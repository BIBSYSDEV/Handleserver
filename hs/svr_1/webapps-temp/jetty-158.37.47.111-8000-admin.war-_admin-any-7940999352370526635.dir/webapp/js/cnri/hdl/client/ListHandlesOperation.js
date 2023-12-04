(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function ListHandlesOperation(client, prefix, page, pageSize, authInfo, clientSuccessCallback, clientErrorCallback) {
    var self = this;
    cnri.hdl.util.AbstractOperation.call(self, client, null, authInfo, true, clientSuccessCallback, clientErrorCallback);

    function constructor() {
        if (authInfo == null) {
            var response = {
                    msg: "Tried to list handles with no authInfo.",
                    handleString: handleString
            };
            clientErrorCallback(response);
        }
    }
    
    function performOperation() {
        listHandles(self.getServerInfo().url, self.onOperationSuccess, self.onOperationError);
    }
    self.performOperation = performOperation;
    
    function listHandles(siteUrl, successCallback, errorCallback) {
        var authorizationString = null;
        if (authInfo != null && authInfo != undefined && authInfo.mode === "BASIC") {
            authorizationString = client.generateBasicAuthHeaderString(authInfo);
        } else {
            var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
            authorizationString = session.getMinimalAuthorizationString();
        }
        
        
//        var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
//        var authorizationString = session.getMinimalAuthorizationString();
        var upperCasePrefix = prefix.toUpperCase();
        var url = siteUrl + "/api/handles/?prefix=" + upperCasePrefix + "&page=" + page + "&pageSize=" + pageSize;
        var ajax = jQuery.ajax({
            url : url,
            type : "GET",
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

cnri.hdl.util.ListHandlesOperation = ListHandlesOperation;
/*end*/})();