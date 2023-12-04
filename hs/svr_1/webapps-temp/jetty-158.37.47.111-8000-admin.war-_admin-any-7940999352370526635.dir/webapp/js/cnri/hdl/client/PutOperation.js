(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function PutOperation(client, handleRecord, authInfo, clientSuccessCallback, clientErrorCallback, overwrite, mintNewSuffix, index) {
    var self = this;
    cnri.hdl.util.AbstractOperation.call(self, client, handleRecord.handle, authInfo, true, clientSuccessCallback, clientErrorCallback); //PutOperation extends AbstractOperation
    
    function constructor() {
        if (authInfo == null) {
            var response = {
                    msg: "Tried to save handle with no authInfo.",
                    handleString: handleRecord.handle
            };
            clientErrorCallback(response);
        }
    }
    
    function performOperation() {
        modifyHandle(self.getServerInfo().url, handleRecord, self.onOperationSuccess, self.onOperationError);
    }
    self.performOperation = performOperation;
    
    function modifyHandle(siteUrl, handleRecord, successCallback, errorCallback) {
        var authorizationString = null;
        if (authInfo != null && authInfo != undefined && authInfo.mode === "BASIC") {
            authorizationString = client.generateBasicAuthHeaderString(authInfo);
        } else {
            var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
            authorizationString = session.getMinimalAuthorizationString();
        }
        var url = siteUrl + "/api/handles/" + handleRecord.handle;
        var isfirstQueryParamSet = false;
        if (overwrite != undefined && overwrite === false) {
            url = url + "?overwrite=false";
            isfirstQueryParamSet = true;
        }
        if (mintNewSuffix != undefined && mintNewSuffix === true) {
            if (isfirstQueryParamSet) {
                url = url + "&mintNewSuffix=true";
            } else {
                url = url + "?mintNewSuffix=true";
            }
        }
        if (index != undefined) {
            if (isfirstQueryParamSet) {
                url = url + "&index=" + index;
            } else {
                url = url + "?index=" + index;
            }
        }
        var ajax = jQuery.ajax({
            url : url,
            type : "PUT",
            data : JSON.stringify(handleRecord),
            contentType : "application/json; charset=utf-8",
            dataType : "json",
            beforeSend: function (xhr){ 
                xhr.setRequestHeader('Authorization', authorizationString); 
            },
            success : successCallback,
            error : errorCallback
        });
    } 
    
    constructor();
}

cnri.hdl.util.PutOperation = PutOperation;
/*end*/})();