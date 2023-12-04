(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

var callbacksToPromiseWithArgs = cnri.util.FunctionUtil.callbacksToPromiseWithArgs;

function HandleClient(clientConfig) {
    var self = this;
    
    self.config = {};
    
    self.cachedRootHandles = {};
    self.sessionTracker = null;
    self.useProxyUserChoices = {};
    
    var isQuerySpecificSite = false;
    var specificSite = null;
    
    function constructor() {
        self.errorConstants = {
                POTENTIAL_SSL_ERROR : "POTENTIAL_SSL_ERROR", //Can be caused by legacy handle server without https or caused by browser not accepting self signed cert
                COULD_NOT_REACH_PROXY_ERROR : "COULD_NOT_REACH_PROXY_ERROR" //Caused by browser not accepting self signed cert from legacy proxy; shouldn't happen
        };
        
        self.config = clientConfig;
        self.sessionTracker = new cnri.hdl.util.SessionTracker();
    }
    
    function setConfig(clientConfig) {
        self.config = clientConfig;
        self.cachedRootHandles = {};
    }
    self.setConfig = setConfig;
    
    function getRootUrlAtRandom() {
        if (self.config.rootUrls === undefined || self.config.rootUrls.length === 0) {
            if (self.config.rootUrl !== undefined) {
                return self.config.rootUrl;
            } else {
                return null;
            }
        } else {
            var index = Math.floor(Math.random()*self.config.rootUrls.length);
            return self.config.rootUrls[index];
        }
    }
    self.getRootUrlAtRandom = getRootUrlAtRandom;
    
    function setAuthInfo(authInfo) {
        self.sessionTracker.setAuthInfo(authInfo);
    }
    self.setAuthInfo = setAuthInfo;
    
    function generateBasicAuthHeaderString(authInfo) {
        var username = escape(authInfo.id);
        var password = authInfo.secretKey; 
        var usernameColonPassword = username + ":" + password;
        var bytes = cnri.util.Encoder.Utf8.bytes(usernameColonPassword);
        var base64String = cnri.util.Encoder.Base64.string(bytes);
        var result = "Basic " + base64String;
        return result;
    }
    self.generateBasicAuthHeaderString = generateBasicAuthHeaderString;
        
    function signOut(onSignOutSuccess, onSignOutError) {
        self.sessionTracker.signOutCurrentAuthInfo(onSignOutSuccess, onSignOutError);
    }
    self.signOut = callbacksToPromiseWithArgs(0, signOut);
    
    function get(handleString, successCallback, errorCallback) {
        var getOperation = new cnri.hdl.util.GetOperation(self, handleString, successCallback, errorCallback);
        if (isQuerySpecificSite) {
            getOperation.performAtSite(specificSite);
        } else {
            getOperation.perform();
        }
    }
    self.get = callbacksToPromiseWithArgs(1, get);
    
    function getFromSpecificSite(handleString, site, successCallback, errorCallback) {
        var getOperation = new cnri.hdl.util.GetOperation(self, handleString, successCallback, errorCallback);
        getOperation.performAtSite(site);
    }
    self.getFromSpecificSite = callbacksToPromiseWithArgs(2, getFromSpecificSite);
    
    function getGlobally(handleString, successCallback, errorCallback) {
        var getOperation = new cnri.hdl.util.GetOperation(self, handleString, successCallback, errorCallback);
        getOperation.perform();
    }
    self.getGlobally = callbacksToPromiseWithArgs(1, getGlobally);
    
    function getFromProxy(handleString, successCallback, errorCallback) {
        var getOperation = new cnri.hdl.util.GetOperation(self, handleString, successCallback, errorCallback);
        var useProxy = true;
        getOperation.perform(useProxy);
    }
    self.getFromProxy = callbacksToPromiseWithArgs(1, getFromProxy);  
    
    function getSiteStatusFromSpecificSite(site, successCallback, errorCallback) {
        var siteStatusHandle = "0.SITE/status";
        var getOperation = new cnri.hdl.util.GetOperation(self, siteStatusHandle, successCallback, errorCallback);
        getOperation.performAtSite(site);
    }
    self.getSiteStatusFromSpecificSite = callbacksToPromiseWithArgs(1, getSiteStatusFromSpecificSite);
    
    function getSiteStatus(successCallback, errorCallback) {
        var siteStatusHandle = "0.SITE/status";
        var getOperation = new cnri.hdl.util.GetOperation(self, siteStatusHandle, successCallback, errorCallback);
        if (isQuerySpecificSite) {
            getOperation.performAtSite(specificSite);
        } else {
            var response = {
                    msg : "You need to select a specific site to perform status resolution."
            };
            errorCallback(response);
        }
    }
    self.getSiteStatus = callbacksToPromiseWithArgs(0, getSiteStatus);
        
    function put(handleRecord, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var putOperation = new cnri.hdl.util.PutOperation(self, handleRecord, authInfo, successCallback, errorCallback);
            if (isQuerySpecificSite) {
                putOperation.performAtSite(specificSite);
            } else {
                putOperation.perform();
            }
        }
    }
    self.put = callbacksToPromiseWithArgs(1, put);
    
    function putIndex(handleRecord, index, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var putOperation = new cnri.hdl.util.PutOperation(self, handleRecord, authInfo, successCallback, errorCallback, undefined, undefined, index);
            if (isQuerySpecificSite) {
                putOperation.performAtSite(specificSite);
            } else {
                putOperation.perform();
            }
        }
    }
    self.putIndex = callbacksToPromiseWithArgs(2, putIndex);
    
    function create(handleRecord, mintNewSuffix, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var overwrite = false;
            if (mintNewSuffix === undefined) {
                mintNewSuffix = false;
            }
            var putOperation = new cnri.hdl.util.PutOperation(self, handleRecord, authInfo, successCallback, errorCallback, overwrite, mintNewSuffix);
            if (isQuerySpecificSite) {
                putOperation.performAtSite(specificSite);
            } else {
                putOperation.perform();
            }
        }
    }
    var promiseBasedCreate = callbacksToPromiseWithArgs(2, create);    
    function createWithOptionalMintNewSuffixArgument() {
        if (arguments[1] === true || arguments[1] === false) {
            return promiseBasedCreate.apply(this, arguments);
        } else {
            return promiseBasedCreate(arguments[0], false, arguments[1], arguments[2], arguments[3]);
        }
    }
    self.create = createWithOptionalMintNewSuffixArgument;
    
    function putToSpecificSite(handleRecord, site, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var putOperation = new cnri.hdl.util.PutOperation(self, handleRecord, authInfo, successCallback, errorCallback);
            putOperation.performAtSite(site);
        }
    }
    self.putToSpecificSite = callbacksToPromiseWithArgs(2, putToSpecificSite);    
    
    function putGlobally(handleRecord, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var putOperation = new cnri.hdl.util.PutOperation(self, handleRecord, authInfo, successCallback, errorCallback);
            putOperation.perform();
        }
    }
    self.putGlobally = callbacksToPromiseWithArgs(1, putGlobally);    
    
    function homePrefixAtSite(prefix, site, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    xhr : null
            };
            errorCallback(error);
        } else {
            var homePrefixOperation = new cnri.hdl.util.HomePrefixOperation(self, prefix, authInfo, successCallback, errorCallback);
            homePrefixOperation.performAtSite(site);
        }
    }
    self.homePrefixAtSite = callbacksToPromiseWithArgs(2, homePrefixAtSite);
    
    function homePrefixAtUrl(prefix, url, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    xhr : null
            };
            errorCallback(error);
        } else {
            var homePrefixOperation = new cnri.hdl.util.HomePrefixOperation(self, prefix, authInfo, successCallback, errorCallback);
            homePrefixOperation.performAtUrl(url);
        }
    }
    self.homePrefixAtUrl = callbacksToPromiseWithArgs(2, homePrefixAtUrl);
    
    function unhomePrefixAtSite(prefix, site, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    xhr : null
            };
            errorCallback(error);
        } else {
            var unhomePrefixOperation = new cnri.hdl.util.UnhomePrefixOperation(self, prefix, authInfo, successCallback, errorCallback);
            unhomePrefixOperation.performAtSite(site);
        }
    }
    self.unhomePrefixAtSite = callbacksToPromiseWithArgs(2, unhomePrefixAtSite);
    
    function unhomePrefixAtUrl(prefix, url, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    xhr : null
            };
            errorCallback(error);
        } else {
            var unhomePrefixOperation = new cnri.hdl.util.UnhomePrefixOperation(self, prefix, authInfo, successCallback, errorCallback);
            unhomePrefixOperation.performAtUrl(url);
        }
    }
    self.unhomePrefixAtUrl = callbacksToPromiseWithArgs(2, unhomePrefixAtUrl);    
    
    function listHandlesAtSite(prefix, site, pageNum, pageSize, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    xhr : null
            };
            errorCallback(error);
        } else {
            if (pageNum == undefined) {
                pageNum = 0;
            }
            if (pageSize == undefined) {
                pageSize = 20;
            }
            var listHandlesOperation = new cnri.hdl.util.ListHandlesOperation(self, prefix, pageNum, pageSize, authInfo, successCallback, errorCallback);
            listHandlesOperation.performAtSite(site);
        }
    }
    self.listHandlesAtSite = callbacksToPromiseWithArgs(4, listHandlesAtSite);
    
    function listPrefixesAtSite(site, pageNum, pageSize, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    xhr : null
            };
            errorCallback(error);
        } else {
            if (pageNum == undefined) {
                pageNum = 0;
            }
            if (pageSize == undefined) {
                pageSize = 20;
            }
            var listPrefixesOperation = new cnri.hdl.util.ListPrefixesOperation(self, pageNum, pageSize, authInfo, successCallback, errorCallback);
            listPrefixesOperation.performAtSite(site);
        }
    }
    self.listPrefixesAtSite = callbacksToPromiseWithArgs(3, listPrefixesAtSite);
    
    function listHandlesAtUrl(prefix, url, pageNum, pageSize, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    xhr : null
            };
            errorCallback(error);
        } else {
            if (pageNum == undefined) {
                pageNum = 0;
            }
            if (pageSize == undefined) {
                pageSize = 20;
            }
            var listHandlesOperation = new cnri.hdl.util.ListHandlesOperation(self, prefix, pageNum, pageSize, authInfo, successCallback, errorCallback);
            listHandlesOperation.performAtUrl(url);
        }
    }
    self.listHandlesAtUrl = callbacksToPromiseWithArgs(4, listHandlesAtUrl);    

    function del(handleRecord, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var deleteOperation = new cnri.hdl.util.DeleteOperation(self, handleRecord, authInfo, successCallback, errorCallback);
            if (isQuerySpecificSite) {
                deleteOperation.performAtSite(specificSite);
            } else {
                deleteOperation.perform();
            }
        }
    }
    self.del = callbacksToPromiseWithArgs(1, del);
    
    function delFromSpecificSite(handleRecord, site, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var deleteOperation = new cnri.hdl.util.DeleteOperation(self, handleRecord, authInfo, successCallback, errorCallback);
            deleteOperation.performAtSite(site);
        }
    }
    self.delFromSpecificSite = callbacksToPromiseWithArgs(2, delFromSpecificSite);  
    
    function delGlobally(handleRecord, successCallback, errorCallback) {
        var authInfo = self.sessionTracker.getAuthInfo();
        if (authInfo == null) {
            var error = {
                    msg : "User is not authenticated.",
                    handleString : handleRecord.handle, 
                    xhr : null
            };
            errorCallback(error);
        } else {
            var deleteOperation = new cnri.hdl.util.DeleteOperation(self, handleRecord, authInfo, successCallback, errorCallback);
            deleteOperation.perform();
        }
    }
    self.delGlobally = callbacksToPromiseWithArgs(1, delGlobally);     
    
    function querySpecificSite(site) {
        isQuerySpecificSite = true;
        specificSite = site;
    }
    self.querySpecificSite = querySpecificSite;
    
    function doNotQuerySpecificSite() {
        isQuerySpecificSite = false;
        specificSite = null;
    }
    self.doNotQuerySpecificSite = doNotQuerySpecificSite;
    
    function getSpecificSiteInfo() {
        return specificSite;
    }
    self.getSpecificSiteInfo = getSpecificSiteInfo;
    
    function getSiteInfoFromHandle(handle, index, usePrimary, success, error) {
        var siteRetriever = new cnri.hdl.util.SiteRetriever(self, handle, index, usePrimary, success, error);
        siteRetriever.retrieve();
    }
    self.getSiteInfoFromHandle = callbacksToPromiseWithArgs(3, getSiteInfoFromHandle);
    
    function getSiteInfoDirectFromServer(ipAddress, port, success, error) {
        if (ipAddress.indexOf(':') >= 0 && ipAddress.indexOf('[') < 0) {
            ipAddress = '[' + ipAddress + ']';
        }
        var url = "https://"+ipAddress + ":" + port + "/api/site";
        var wrappedSuccess = function (response) {
            response.site.retrievalTimestamp = getUnixTime();
            success(response.site);
        };
        jQuery.ajax({
            url : url,
            type : "GET",
            dataType : "json",
            success : wrappedSuccess,
            error : error,
            timeout: 3000
        });
        
    }
    self.getSiteInfoDirectFromServer = callbacksToPromiseWithArgs(2, getSiteInfoDirectFromServer);
    
    function getUnixTime() {
        var now = new Date();
        var nowSeconds = Math.round(now.getTime() / 1000);
        return nowSeconds;
    }
    
    function putWithAuthInfo(authInfo, handleRecord, successCallback, errorCallback) {
        //TODO
    }
    
    constructor();
}

cnri.hdl.util.HandleClient = HandleClient;
/*end*/})();