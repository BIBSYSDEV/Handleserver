(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function UnhomePrefixOperation(client, prefix, authInfo, clientSuccessCallback, clientErrorCallback) {
    var self = this;
    cnri.hdl.util.AbstractOperation.call(self, client, null, authInfo, true, clientSuccessCallback, clientErrorCallback); //HomePrefixOperation extends AbstractOperation

    function constructor() {
        if (authInfo == null) {
            var response = {
                    msg: "Tried to unhome prefix with no authInfo.",
                    handleString: handleString
            };
            clientErrorCallback(response);
        }
    }
    
    function performOperation() {
        unhomePrefix(self.getServerInfo().url, self.onOperationSuccess, self.onOperationError);
    }
    self.performOperation = performOperation;
    
    function unhomePrefix(siteUrl, successCallback, errorCallback) {
        var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
        var authorizationString = session.getMinimalAuthorizationString();
        var url = siteUrl + "/api/prefixes/" + prefix;
        var ajax = jQuery.ajax({
            url : url,
            type : "DELETE",
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

cnri.hdl.util.UnhomePrefixOperation = UnhomePrefixOperation;
/*end*/})();