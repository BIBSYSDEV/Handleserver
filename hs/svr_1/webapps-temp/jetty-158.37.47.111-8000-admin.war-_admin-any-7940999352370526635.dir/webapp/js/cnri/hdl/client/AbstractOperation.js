(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function AbstractOperation(client, handleString, authInfo, authoritative, clientSuccessCallback, clientErrorCallback) {
    var self = this;
    var serverInfo = null; // this is the server info of the server which is actually responsible for the handle
    var currentServerInfo = null; // this is the server info of the server we are currently talking to
    var ROOT_HANDLE = "0.NA/0.NA";
    var rootUrl = null;
    
    function constructor() {}

    function getServerInfo() {
        return serverInfo;
    }
    self.getServerInfo = getServerInfo;
    
    function setServerInfo(serverInfoParam) {
        serverInfo = serverInfoParam;
    }
    self.setServerInfo = setServerInfo;
    
    function getCurrentServerInfo() {
        return currentServerInfo;
    }
    self.getCurrentServerInfo = getCurrentServerInfo;
    
    function setCurrentServerInfo(currentServerInfoParam) {
        currentServerInfo = currentServerInfoParam;
    }
    self.setCurrentServerInfo = setCurrentServerInfo;
    
    function getAuthInfo() {
        return authInfo;
    }
    self.getAuthInfo = getAuthInfo;
    
    function setAuthInfo(newAuthInfo) {
        authInfo = newAuthInfo;
    }
    self.setAuthInfo = setAuthInfo;
    
    function getHandleFromRoot(prefixHandleString, successCallback, errorCallback) {
        var cachedRootHandle = client.cachedRootHandles[prefixHandleString];
        if (cachedRootHandle == undefined) {
            rootUrl = null;
            if (client.config.useProxyAsRoot) {
                rootUrl = client.config.proxyUrl;
            } else {
                rootUrl = client.getRootUrlAtRandom();
            }
            getPrefixHandleFromUrl(prefixHandleString, rootUrl, successCallback, errorCallback);
        } else {
            successCallback(cachedRootHandle);
        }
    }
    self.getHandleFromRoot = getHandleFromRoot;

    function getPrefixHandleFromUrl(prefixHandleString, rootUrl, successCallback, errorCallback) {
        var wrappedSuccessCallback = function (handleRecord) {
            client.cachedRootHandles[handleRecord.handle] = handleRecord;
            successCallback(handleRecord);
        };
        var wrappedErrorCallback = wrapErrorCallbackForDelegation(prefixHandleString, wrappedSuccessCallback, errorCallback);
        setCurrentServerInfo({ url : rootUrl });
        getHandleFromUrl(rootUrl, prefixHandleString, wrappedSuccessCallback, wrappedErrorCallback);
    }
    
    function getHandleFromDelegatedUrl(delegationResponse, prefixHandleString, successCallback, errorCallback) {
        var onGetSiteSuccess = function (site) {
            var siteUrl = getUrlForSite(site);
            if (siteUrl == null) {
                var error = {
                    handleString : prefixHandleString,
                    msg : "Server does not have an http interface."
                };
                clientErrorCallback(error);
            } else {
                setCurrentServerInfo({ url : siteUrl });
                getHandleFromUrl(siteUrl, prefixHandleString, successCallback, errorCallback);
            }
        };
        var onGetServiceHandleSuccess = function (serviceHandleRecord) {
            getSiteFromResponse(serviceHandleRecord, true, onGetSiteSuccess, onGetServiceHandleSuccess);
        };
        getSiteFromResponse(delegationResponse, true, onGetSiteSuccess, onGetServiceHandleSuccess);
    }
    
    function getHandleFromProxy(handleString, successCallback, errorCallback) {
        var wrappedOnGetHandleFromProxyError = function () {
            console.log("The handle could not be retrieved from the proxy.");
            errorCallback();
        };
        return getHandleFromUrl(client.config.proxyUrl, handleString, successCallback, wrappedOnGetHandleFromProxyError);
    }
    self.getHandleFromProxy = getHandleFromProxy;
    
    function getHandleFromUrl(baseUrl, handleString, successCallback, errorCallback) {
        if (client.useProxyUserChoices[baseUrl] != undefined) { //Experimental caching of user choices for proxy resolution
            getHandleFromProxy(handleString, successCallback, errorCallback);
            return;
        }
        var url = baseUrl + "/api/handles/" + handleString;
        if (client.config.useAuthoritativeResolutionWithProxy === true) {
            url = url + "?auth=true";
        }
        jQuery.ajax({
            url : url,
            type : "GET",
            dataType : "json",
            success : self.wrapCallbackTakingHandleRecord(successCallback),
            error : wrapErrorCallbackForDelegation(handleString, successCallback, errorCallback),
            timeout: 3000
        });
    }
    self.getHandleFromUrl = getHandleFromUrl;
    
    function looksLikeSslError(response) {
        return response.statusText === "error" || response.statusText === "timeout";
    }
    self.looksLikeSslError = looksLikeSslError;
    
    function getPrefix(handleString) {
        return handleString.split("/")[0];
    }
    self.getPrefix = getPrefix;
    
    function getPrefixHandleString(handleString) {
        return "0.NA/" + getPrefix(handleString);
    }
    self.getPrefixHandleString = getPrefixHandleString;
        
    function getSelfSignedCertUrl(url) {
        url = url + "/static/self-signed-cert.html";
        return url;
    }
    
    function canUseProxy() {
        return false;
    }
    self.canUseProxy = canUseProxy;
    
    self.useProxyCallback = undefined;
    
    function perform() {
        var prefixHandleString = self.getPrefixHandleString(handleString);
        self.prefixHandleString = prefixHandleString;
        self.getHandleFromRoot(prefixHandleString, onGetHandleFromRootSuccess, onErrorDuringPrefixResolution);
    }
    self.perform = perform;

    function onGetHandleFromRootSuccess(rootHandleRecord) {
        getSiteFromResponse(rootHandleRecord, false, onGetSiteSuccess, onGetHandleFromRootSuccess);
    }

    function onGetSiteSuccess(site) {
        var siteUrl = getUrlForSite(site);
        if (siteUrl == null) {
            var error = {
                handleString : handleString,
                msg : "Server does not have an http interface."
            };
            clientErrorCallback(error);
        } else {
            serverInfo = {
                url : siteUrl,
                server : getFirstServer(site)
            };
            self.performOperationOrAuthenticate();
        }
    }

    function performAtSite(site) {
        onGetSiteSuccess(site);
    }
    self.performAtSite = performAtSite;
    
    function performAtUrl(url) {
        serverInfo = {
                url : url
        };
        self.performOperationOrAuthenticate();
    }
    self.performAtUrl = performAtUrl;
    
    function getSiteFromResponse(responseHandleRecord, delegating, onGetSiteSuccess, onGetServiceHandleSuccess) {
        var siteHandleValues = self.getSites(responseHandleRecord, delegating);
        if (siteHandleValues.length == 0) {
            var services = self.getServices(responseHandleRecord, delegating);
            if (services.length > 0) {
                var service = services[0];
                var serviceHandleString = service.data.value;
                // was self.getHandleFromRoot always...
                if (serviceHandleString.match(/^0\./)) {
                    self.getHandleFromRoot(serviceHandleString, onGetServiceHandleSuccess, onErrorDuringPrefixResolution);
                } else {
                    client.get(serviceHandleString, onGetServiceHandleSuccess, onErrorDuringPrefixResolution);
                }
            } else {
                onGetSiteError();
            }
        } else {
            var site;
            if (authoritative) {
                site = self.getPrimarySite(siteHandleValues);
            } else {
                site = self.getRandomSite(siteHandleValues);
            }
            onGetSiteSuccess(site);
        }        
    } 
    
    function onAuthenticateSuccess(response) {
        self.performOperation();
    }
    self.onAuthenticateSuccess = onAuthenticateSuccess;
    
    function onAuthenticateError(response) {
        if (self.looksLikeSslError(response)) { //The site was not reachable probably because the server doesn't support https yet. 
            if (self.canUseProxy()) {
                //If authentication failed at the local server, just get the handle record direct from the proxy
                console.log("Looks like an SSL error. Could not authenticate at local server so getting handle from proxy.");
                self.useProxyCallback();
            } else {
                var failedServerUrl = self.getServerInfo().url;
                var error = {
                        name : client.errorConstants.POTENTIAL_SSL_ERROR,
                        handleString : handleString,
                        msg : 'Could not authenticate. This may be because you have not accepted the https certificate for the local handle server you were trying to reach.',
                        failedServerUrl : failedServerUrl,
                        xhr : response
                };
                clientErrorCallback(error);
            }
        } else {
            var error = {
                    handleString : handleString,
                    msg : "Could not authenticate.",
                    xhr : response
            };
            clientErrorCallback(error);
        }
    }
    self.onAuthenticateError = onAuthenticateError;
    
    function onOperationSuccess(response) {
        clientSuccessCallback(response);
    }
    self.onOperationSuccess = onOperationSuccess;
    
    function onOperationError(response) {
        if (self.looksLikeSslError(response)) { 
            if (self.canUseProxy()) {
                self.useProxyCallback();
            } else {
                var failedServerUrl = self.getServerInfo().url;
                //var sslErrorReasonMessage = 'This may be because you have not accepted the https certificate for the local handle server you were trying to reach. Try visiting <a href="'+failedServerUrl+'" target="_blank">'+failedServerUrl+'</a> and accept the certificate.';
                var sslErrorReasonMessage = 'This may be because you have not accepted the https certificate for the local handle server you were trying to reach.';
                
                var message = getErrorMessageFromResponse(response);
                message = message + " " +  sslErrorReasonMessage;
                var error = {
                        name : client.errorConstants.POTENTIAL_SSL_ERROR,
                        handleString : handleString,
                        msg : message,
                        failedServerUrl : failedServerUrl,
                        xhr : response
                };
                clientErrorCallback(error);
            }
        } else if (response.status === 401 && client.sessionTracker.hasSession(authInfo, self.getServerInfo())) {
            //The server responded 401 Unauthorized but the clients session tracker thinks there is a session
            //The most likely cause is that the session timed out on the server side. 
            //The solution is to remove the session from the client session tracker for this particular server and try the operation again.
            client.sessionTracker.deleteSessionClientSideOnly(authInfo, self.getServerInfo()); //TODO consider loop prevention. 
            performOperationOrAuthenticate();
        } else {
            var message = getErrorMessageFromResponse(response);
            var error = {
                    handleString : handleString,
                    msg : message,
                    xhr : response
            };
            clientErrorCallback(error);
        }
    }
    self.onOperationError = onOperationError;
    
    function getErrorMessageFromResponse(response) {
        var message = null;
        if (response.responseText != undefined) {
            try {
                var parsedResponse = JSON.parse(response.responseText);
                if (parsedResponse.message != undefined) {
                    message = parsedResponse.message;
                }
            } catch (err) {}
        }
        if (message === null) {
            message = response.statusText;
        }
        return message;
    }
    
    function successSslAuthenticateCallback() {
        setCurrentServerInfo(serverInfo);
        client.sessionTracker.authenticate(authInfo, serverInfo, onAuthenticateSuccess, onAuthenticateError);
    }
    
    function successSslCallback() {
        self.performOperationOrAuthenticate();
    }
    
    function cancelCallback() {
        var error = {
                handleString : handleString,
                msg : "User cancelled operation."
        };
        clientErrorCallback(error);
    }
    
    function performOperationOrAuthenticate() {
        if (authInfo.mode === "BASIC") {
            self.performOperation();
        } else {
            if (client.sessionTracker.hasSession(authInfo, self.getServerInfo())) {
                self.performOperation();
            } else {
                setCurrentServerInfo(self.getServerInfo());
                client.sessionTracker.authenticate(authInfo, self.getServerInfo(), self.onAuthenticateSuccess, self.onAuthenticateError);
            }
        }
    }
    self.performOperationOrAuthenticate = performOperationOrAuthenticate;
    
    self.performOperation = undefined;
    
    function onGetSiteError() {
        var msg;
        if (authoritative) {
            msg = "Error no primary sites on prefix handle.";
        } else {
            msg = "Error no sites or services on prefix handle.";
        }
        var error = {
                handleString : handleString,
                msg : msg
        };
        clientErrorCallback(error);
    }
    
    function onErrorDuringPrefixResolution(response) {
        if (self.looksLikeSslError(response)) { 
            if (self.canUseProxy()) {
                self.useProxyCallback();
            } else {
                var failedServerUrl = currentServerInfo.url;
                var sslErrorReasonMessage = 'This may be because you have not accepted the https certificate for the handle server you were trying to reach.';
                var message = getErrorMessageFromResponse(response);
                message = message + " " +  sslErrorReasonMessage;
                var error = {
                        name : client.errorConstants.POTENTIAL_SSL_ERROR,
                        handleString : handleString,
                        msg : message,
                        failedServerUrl : failedServerUrl,
                        xhr : response
                };
                clientErrorCallback(error);
            }
        } else {
            var message = getErrorMessageFromResponse(response);
            var error = {
                    handleString : handleString,
                    msg : message,
                    xhr : response
            };
            clientErrorCallback(error);
        }
    }
    
    function getPrimarySite(siteHandleValuesList) {
        for (var i = 0; i < siteHandleValuesList.length; i++) {
            var siteHandleValue = siteHandleValuesList[i];
            if (siteHandleValue.data.value.primarySite) {
                return siteHandleValue.data.value;
            }
        }
    }
    self.getPrimarySite = getPrimarySite;
    
    function getRandomSite(siteHandleValuesList) {
        if (siteHandleValuesList.length == 0) {
            return null;
        }
        var siteIndex = randomInRange(0, siteHandleValuesList.length -1);
        var siteHandleValue = siteHandleValuesList[siteIndex];
        return siteHandleValue.data.value;
    }
    self.getRandomSite = getRandomSite;
    
    function randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
   
    function getSites(handleRecord, delegating) {
        var sites = new Array();
        for (var i = 0; i < handleRecord.values.length; i++) {
            var handleValue = handleRecord.values[i];
            var type = "HS_SITE";
            if (delegating) type = "HS_SITE.PREFIX";
            if (handleValue.type === type) {
                sites.push(handleValue);
            }
        }
        return sites;
    }
    self.getSites = getSites;
    
    function getServices(handleRecord, delegating) {
        var services = new Array();
        for (var i = 0; i < handleRecord.values.length; i++) {
            var handleValue = handleRecord.values[i];
            var type = "HS_SERV";
            if (delegating) type = "HS_SERV.PREFIX";
            if (handleValue.type === type) {
                services.push(handleValue);
            }
        }
        return services;
    }
    self.getServices = getServices;

    // modify handle record returned by Ajax calls from older versions of the client
    function adjustHandleValue(value) {
        var data = value.data;
        if (!data) return;
        if (!data.format) {
            value.data = { format : 'string', value : data };
        } else if (value.type === 'HS_PUBKEY' && data.format === 'base64') {
            var bytes = cnri.util.HsEncoder.Base64.bytes(data.value);
            if (cnri.util.HsEncoder.Key.looksLikeKey(bytes)) {
                data.format = 'key',
                data.value = cnri.util.HsEncoder.Key.json(bytes);
            }
        }
    }
    
    function wrapCallbackTakingHandleRecord(callback) {
        return function (handleRecord) {
            if (!handleRecord || !handleRecord.values || !handleRecord.values.length) callback(handleRecord);
            else {
                for (var i = 0; i < handleRecord.values.length; i++) {
                    var value = handleRecord.values[i];
                    adjustHandleValue(value);
                }
                callback(handleRecord);
            }
        };
    }
    self.wrapCallbackTakingHandleRecord = wrapCallbackTakingHandleRecord;
    
    function wrapErrorCallbackForDelegation(handleString, successCallback, errorCallback) {
        var wrappedErrorCallback = function (jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 300) {
                getHandleFromDelegatedUrl($.parseJSON(jqXHR.responseText), handleString, successCallback, wrappedErrorCallback);
            } else {
                errorCallback(jqXHR, textStatus, errorThrown);
            }
        };
        return wrappedErrorCallback;
    }
    
    constructor();
}

function getUrlForSite(site) {
    var server = getFirstServer(site);//TODO hash buckets of the handle to get the correct server, note that nobody uses this
    var httpInterface = getHttpInterface(server);
    if (httpInterface == null) {
        return null;
    }
    var port = httpInterface.port;
    var url = null;
    var domain = getAttribute("domain", site);
    if (domain) {
        url = getUrlForDomainPort(domain, port);
    } else {
        var ipAddress = server.address;
        url = getUrlForIpPort(ipAddress, port);
    } 
    return url;
}
AbstractOperation.getUrlForSite = getUrlForSite;

function getFirstServer(site) {
    var servers = site.servers;
    var server = servers[0];
    return server;
}

function getHttpInterface(server) {
    var result = null;
    var interfaces = server.interfaces;
    for (var i = 0; i < interfaces.length; i++) {
        var interfaceInfo = interfaces[i];
        if (isHttpInterface(interfaceInfo)) {
            result = interfaceInfo;
            break;
        }
    }
    return result;
}

function isHttpInterface(interfaceInfo) {
    return interfaceInfo.protocol == "HTTP";
}   

function getAttribute(name, site) {
    var attributesList = site.attributes;
    for (var i = 0; i < attributesList.length; i++) {
        var attribute = attributesList[i];
        if (attribute.name === name) {
            return attribute.value;
        }
    }
    return null;
}

function getUrlForIpPort(ipAddress, port) {
    if (ipAddress.indexOf(':') >= 0) {
        ipAddress = '[' + ipAddress + ']';
    }
    return "https://"+ ipAddress + ":" + port;
}

function getUrlForDomainPort(domain, port) {
    return "https://"+ domain + ":" + port;
}

cnri.hdl.util.AbstractOperation = AbstractOperation;
/*end*/})();