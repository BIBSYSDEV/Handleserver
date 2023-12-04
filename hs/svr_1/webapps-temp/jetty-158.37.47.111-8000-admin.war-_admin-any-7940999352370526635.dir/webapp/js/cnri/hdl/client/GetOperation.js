(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function GetOperation(client, handleString, clientSuccessCallback, clientErrorCallback) {
    var self = this;
    cnri.hdl.util.AbstractOperation.call(self, client, handleString, null, false, clientSuccessCallback, clientErrorCallback); //GetOperation extends AbstractOperation
    var superPerform = self.perform;
    
    function constructor() {}
    
    function perform(useProxy) {
        if (useProxy != undefined && useProxy == true) {
            self.getHandleFromProxy(handleString, clientSuccessCallback, clientErrorCallback); 
        } else {
            superPerform();
        }
    }
    self.perform = perform;

    function performOperationOrAuthenticate() {
        var authInfo = client.sessionTracker.getAuthInfo();
        self.setAuthInfo(authInfo);
        if (authInfo != null) {
            if (authInfo.mode === "BASIC") {
                self.performOperation();
            } else {
                if (client.sessionTracker.hasSession(authInfo, self.getServerInfo())) {
                    self.performOperation();
                } else {
                    self.setCurrentServerInfo(self.getServerInfo());
                    client.sessionTracker.authenticate(authInfo, self.getServerInfo(), self.onAuthenticateSuccess, self.onAuthenticateError);
                }
            }
        } else {
            self.setCurrentServerInfo(self.getServerInfo());
            self.getHandleFromUrl(self.getServerInfo().url, handleString, self.onOperationSuccess, self.onOperationError);
        }
    }
    self.performOperationOrAuthenticate = performOperationOrAuthenticate;

    function performOperation() {
        self.setCurrentServerInfo(self.getServerInfo());
        getHandleFromUrlAuthenticated(self.getServerInfo().url, handleString, self.onOperationSuccess, self.onOperationError);
    }
    self.performOperation = performOperation;
    
    function getHandleFromUrlAuthenticated(baseUrl, handleString, onGetHandleFromUrlSuccess, onGetHandleFromUrlError) {
        var authInfo = self.getAuthInfo();
        
        var authorizationString = null;
        if (authInfo != null && authInfo != undefined && authInfo.mode === "BASIC") {
            authorizationString = client.generateBasicAuthHeaderString(authInfo);
        } else {
            var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
            authorizationString = session.getMinimalAuthorizationString();
        }
        
        
//        var session = client.sessionTracker.getSession(self.getAuthInfo(), self.getServerInfo());
//        var authorizationString = session.getMinimalAuthorizationString();
        var url = baseUrl + "/api/handles/" + handleString;
        jQuery.ajax({
            url : url,
            type : "GET",
            dataType : "json",
            beforeSend: function (xhr){ 
                xhr.setRequestHeader('Authorization', authorizationString); 
            },
            success : self.wrapCallbackTakingHandleRecord(onGetHandleFromUrlSuccess),
            error : onGetHandleFromUrlError,
            timeout: 3000
        });
    }      

    function canUseProxy() {
        return true;    
    }
    self.canUseProxy = canUseProxy;
    
    function useProxyCallback() {
        //client.useProxyUserChoices[self.getServerInfo().url] = true;
        self.getHandleFromProxy(handleString, onGetHandleFromProxySuccess, onGetHandleFromProxyError);
    }
    self.useProxyCallback = useProxyCallback;
    
    function onGetHandleFromProxySuccess(handleRecord) {
        handleRecord.fromProxy = true;
        if (self.getCurrentServerInfo()) {
            var failedServerUrl = self.getCurrentServerInfo().url;
            clientSuccessCallback(handleRecord, failedServerUrl);
        } else {
            clientSuccessCallback(handleRecord);
        }
    }
    
    function onGetHandleFromProxyError(response) {
        var error = {
                name : client.errorConstants.COULD_NOT_REACH_PROXY_ERROR,
                handleString : handleString,
                msg : 'Handle '+ handleString +' could not be resolved on the proxy.',
                failedServerUrl : client.config.proxyUrl,
                xhr : response
        };
        clientErrorCallback(error);
    }
    
    constructor();
}

cnri.hdl.util.GetOperation = GetOperation;
/*end*/})();