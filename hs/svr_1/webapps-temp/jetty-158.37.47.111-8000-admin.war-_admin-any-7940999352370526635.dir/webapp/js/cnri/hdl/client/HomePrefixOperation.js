(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function HomePrefixOperation(client, prefix, authInfo, clientSuccessCallback, clientErrorCallback) {
    var self = this;
    cnri.hdl.util.AbstractOperation.call(self, client, null, authInfo, true, clientSuccessCallback, clientErrorCallback); //HomePrefixOperation extends AbstractOperation

    function constructor() {
        if (authInfo == null) {
            var response = {
                    msg: "Tried to home prefix with no authInfo.",
                    handleString: handleString
            };
            clientErrorCallback(response);
        }
    }
    
    function performOperation() {
        homePrefix(self.getServerInfo().url, self.onOperationSuccess, self.onOperationError);
    }
    self.performOperation = performOperation;
    
    function homePrefix(siteUrl, successCallback, errorCallback) {
        var authorizationString = null;
        if (authInfo != null && authInfo != undefined && authInfo.mode === "BASIC") {
            authorizationString = client.generateBasicAuthHeaderString(authInfo);
        } else {
            var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
            authorizationString = session.getMinimalAuthorizationString();
        }
        
        
//        var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
//        var authorizationString = session.getMinimalAuthorizationString();
        var url = siteUrl + "/api/prefixes/" + prefix;
        var ajax = jQuery.ajax({
            url : url,
            type : "POST",
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

cnri.hdl.util.HomePrefixOperation = HomePrefixOperation;
/*end*/})();