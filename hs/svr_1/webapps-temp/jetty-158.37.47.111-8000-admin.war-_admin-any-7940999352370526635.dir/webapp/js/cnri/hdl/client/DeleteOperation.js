(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function DeleteOperation(client, handleString, authInfo, clientSuccessCallback, clientErrorCallback) {
    var self = this;
    cnri.hdl.util.AbstractOperation.call(self, client, handleString, authInfo, true, clientSuccessCallback, clientErrorCallback); //DeleteOperation extends AbstractOperation
    
    function constructor() {
        if (authInfo == null) {
            var error = {
                    msg: "Tried to delete handle with no authInfo.",
                    handleString: handleString
            };
            clientErrorCallback(error);
        }
    }
    
    function performOperation() {
        deleteHandle(self.getServerInfo().url, handleString, self.onOperationSuccess, self.onOperationError);
    }
    self.performOperation = performOperation;
    
    function deleteHandle(siteUrl, handleString, successCallback, errorCallback) {
        var url = siteUrl + "/api/handles/" + handleString;
        
        var authorizationString = null;
        if (authInfo != null && authInfo != undefined && authInfo.mode === "BASIC") {
            authorizationString = client.generateBasicAuthHeaderString(authInfo);
        } else {
            var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
            authorizationString = session.getExistingSessionAuthorizationString();
        }
        
        jQuery.ajax({
            url : url,
            type : "DELETE",
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

cnri.hdl.util.DeleteOperation = DeleteOperation;
/*end*/})();