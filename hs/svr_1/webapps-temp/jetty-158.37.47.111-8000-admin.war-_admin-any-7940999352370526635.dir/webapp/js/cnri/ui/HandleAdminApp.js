function HandleAdminApp(onStartUpComplete) {
	
    var self = this;
    
    var versionNumber = 0;
    var versionName = "0.9.6 beta";
    
    var client = null;
    var notifications = null;
    var resolveAndCreateHandleWidget = null;
	var handleWidget = null;
	var handleDiv = null;

	var handleObjectChangeDetector = null;
	
	var listHandlesWidget = null;
	var listPrefixesWidget = null;
	var homePrefixWidget = null;
	var querySpecificSiteWidget = null;
	var clientConfigWidget = null;
	var siteStatusWidget = null;

	var isResolving = false;
	var isResolvingAfterCreate = false;
	
	var sourceServerSiteInfo = null;
	
	var defaultClientConfig = {
	    useProxyAsRoot : true,
	    useAuthoritativeResolutionWithProxy : false,
	    proxyUrl : "https://hdl.handle.net",
	    rootUrls : [ "https://38.100.138.131:8000", "https://132.151.1.179:8000" ]
            //root server running HSv8 with an https interface. Add other roots when they support v8 and https.
	};
	
	//Construction sequence 1
	function constructor() {
	    var clientConfig = loadClientConfigFromLocalStorage();
	    client = new cnri.hdl.util.HandleClient(clientConfig);
	    handleObjectChangeDetector = new ObjectChangeDetector(null, onHandleObjectChangeDetected);
	    constructorContinuation();
	}
	
	//Construction sequence 2
	function loadClientConfigFromLocalStorage() {
	    var storedClientConfig = amplify.store("clientConfig");
	    if (storedClientConfig === null || storedClientConfig === undefined) {
	        return getCopyOfDefaultClientConfig();
	    } else {
	        return storedClientConfig;
	    }
	}
	
	function getCopyOfDefaultClientConfig() {
	    var result = jQuery.extend(true, {}, defaultClientConfig);
	    return result;
	}
	self.getCopyOfDefaultClientConfig = getCopyOfDefaultClientConfig;
	
	//Construction sequence 3
	function constructorContinuation() {
	    notifications = new Notifications($("#notificationsDiv"));
	    self.notifications = notifications;
	    amplify.subscribe(HandleEvents.HANDLE_LOOKUP_REQUESTED, onHandleLookupRequested);

	    resolveAndCreateHandleWidget = new ResolveAndCreateHandleWidget($("#createHandleDiv"), client, self);
	    handleDiv = $("#handleDiv");
	    
	    //self.serverRestarter = new ServerRestarter($("#maindiv"));

	    amplify.subscribe(HandleEvents.HANDLE_SAVED_SUCCESS, onSaveHandleSuccess);
	    amplify.subscribe(HandleEvents.HANDLE_SAVED_ERROR, onSaveHandleError);
	    amplify.subscribe(HandleEvents.ON_SIGN_IN, onSignIn);
	    amplify.subscribe(HandleEvents.ON_SIGN_OUT, onSignOut);
	    amplify.subscribe(HandleEvents.HANDLE_CREATED_LOCAL_SUCCESS, onHandleCreatedLocalSuccess);
	    amplify.subscribe(HandleEvents.HANDLE_CREATED_SUCCESS, onHandleCreatedSuccess);
	    amplify.subscribe(HandleEvents.HANDLE_DELETED_SUCCESS, onHandleDeletedSuccess);
	    amplify.subscribe(HandleEvents.HANDLE_DELETED_ERROR, onHandleDeletedError);
	    amplify.subscribe(HandleEvents.SELECTED_PREFIX_CHANGED, onSelectedPrefixChanged);

	    var authWidget = new HsAuthenticatorWidget($("#authenticateDiv"), client, client.sessionTracker);

	    getSourceServerSiteInfo();
	    //buildToolsMenu();
	}
	
	//Construction sequence 4
    function getSourceServerSiteInfo() {
        var sourceServerInfo = getSourceServerAddressAndPort();
        client.getSiteInfoDirectFromServer(sourceServerInfo.ipAddress, sourceServerInfo.port, onGotSourceSiteSuccess, onGotSourceSiteError);
    }
    
    function onGotSourceSiteSuccess(site) {
        sourceServerSiteInfo = site;
        console.log("Site info retrieved");
        warnIfSourceServerDoesNotMatch();
        buildToolsMenu();
    }
    
    function onGotSourceSiteError(response) {
        console.log("Could not get site info from the server serving this page");
        buildToolsMenu();
    }	
	
    function getSourceServerAddressAndPort() {
        var sourceServerInfo = {
                ipAddress: window.location.hostname,
                port: window.location.port
        };
        return sourceServerInfo;
    }    
    
    function warnIfSourceServerDoesNotMatch() {
        if (!sourceServerSiteInfo) return;
        var sourceServerUrl = cnri.hdl.util.AbstractOperation.getUrlForSite(sourceServerSiteInfo);
        var windowUrl = "https://" + window.location.hostname + ":" + window.location.port;
        if (windowUrl != sourceServerUrl) {
            var div = $('<div></div>')
            .append('Window location does not match server site info ')
            .append($('<a></a>')
                .attr('href', sourceServerUrl + '/admin/')
                .text(sourceServerUrl + '/admin/'))
            .append('; HTTPS errors may result; consider clicking link in this warning');
            notifications.alertWarningDiv(div);
        }
    }
    
    //Construction sequence 5
	function buildToolsMenu() {
	    var homePrefixDiv = $("#homePrefixDiv");
	    homePrefixWidget = new HomePrefixWidget(homePrefixDiv, client);
	    $("#homePrefixMenuItem").click(onHomePrefixMenuClick);
	    
	    var listHandlesDiv = $("#listHandlesDiv");
	    listHandlesWidget = new ListHandlesWidget(listHandlesDiv, client);
	    $("#listHandlesMenuItem").click(onListHandlesMenuClick);
	    
	    var listPrefixesDiv = $("#listPrefixesDiv");
	    listPrefixesWidget = new ListPrefixesWidget(listPrefixesDiv, client);
	    $("#listPrefixesMenuItem").click(onListPrefixesMenuClick);
	    
	    var specificSiteConfig = amplify.store("specificSiteConfig");
	    if (specificSiteConfig == null) {
	        specificSiteConfig = getDefaultSpecificSiteConfig();
	    }
	    var querySpecificSiteDiv = $("#querySpecificSiteDiv");
	    querySpecificSiteWidget = new QuerySpecificSiteWidget(querySpecificSiteDiv, client, specificSiteConfig, sourceServerSiteInfo);
	    $("#querySpecificSiteMenuItem").click(onQuerySpecificSiteMenuClick);
	    
	    var clientConfigDiv = $("#clientConfigDiv");
	    clientConfigWidget = new ClientConfigWidget(clientConfigDiv, client);
	    $("#clientConfigMenuItem").click(onClientConfigMenuClick);
	    
	    var siteStatusDiv = $("#siteStatusDiv");
	    siteStatusWidget = new SiteStatusWidget(siteStatusDiv, client);
	    $("#siteStatusMenuItem").click(onSiteStatusMenuClick);
	    
	    getLatestAppVersionInfo();
	}
	
	//Construction sequence 6
	function getLatestAppVersionInfo() {
	    var versionInfoWidget = new VersionInfoWidget($("#versionInfo"), client, versionName, versionNumber);
	    fireStartUpComplete();
	}
	
	function fireStartUpComplete() {
	    if (onStartUpComplete) {
	        onStartUpComplete();
	    }
	}
	
	function getDefaultSpecificSiteConfig() {
	    var result = {
	            selection : "source",
	            lastRetrievedByAddressSiteInfo : null,
	            lastRetrievedByHandleSiteInfo : null
	    };
//	    var result = {
//                selection : "global",
//                lastRetrievedByAddressSiteInfo : null,
//                lastRetrievedByHandleSiteInfo : null
//        };
	    return result;
	}
	
    function onHomePrefixMenuClick(e) {
        if (e !== undefined) {
            e.preventDefault();
        }
        var homePrefixDiv = $("#homePrefixDiv");
        homePrefixWidget.show();
        $('html, body').animate({scrollTop: homePrefixDiv.offset().top - 50}, 800);
    }   
	
	function onListHandlesMenuClick(e) {
	    e.preventDefault();
	    var listHandlesDiv = $("#listHandlesDiv");
	    listHandlesWidget.show();
	    $('html, body').animate({scrollTop: listHandlesDiv.offset().top - 50}, 800);
	}

    function onListPrefixesMenuClick(e) {
        e.preventDefault();
        var listPrefixesDiv = $("#listPrefixesDiv");
        listPrefixesWidget.show();
        $('html, body').animate({scrollTop: listPrefixesDiv.offset().top - 50}, 800);
    }
		
	function onQuerySpecificSiteMenuClick(e) {
	    e.preventDefault();
	    var querySpecificSiteDiv = $("#querySpecificSiteDiv");
	    querySpecificSiteWidget.show();
	    $('html, body').animate({scrollTop: querySpecificSiteDiv.offset().top - 50}, 800);
	}
	self.onQuerySpecificSiteMenuClick = onQuerySpecificSiteMenuClick;
	
    function onClientConfigMenuClick(e) {
        e.preventDefault();
        var clientConfigDiv = $("#clientConfigDiv");
        clientConfigDiv.show();
        $('html, body').animate({scrollTop: clientConfigDiv.offset().top - 50}, 800);
    }	
	
    function onSiteStatusMenuClick(e) {
        e.preventDefault();
        var siteStatusDiv = $("#siteStatusDiv");
        siteStatusDiv.show();
        $('html, body').animate({scrollTop: siteStatusDiv.offset().top - 50}, 800);
    }
    
	function onSelectedPrefixChanged(prefix) {
	    listHandlesWidget.show();
	    //var listHandlesDiv = $("#listHandlesDiv");
	    //$('html, body').animate({scrollTop: listHandlesDiv.offset().top - 50}, 800);
	    listHandlesWidget.listHandleForPrefix(prefix);
	}
	
	function createHandle(handleRecord, mintNewSuffix, onCreateHandleSuccess, onCreateHandleError) {
	    client.create(handleRecord, mintNewSuffix, onCreateHandleSuccess, onCreateHandleError);
	}
	self.createHandle = createHandle;
	
	function onHandleCreatedLocalSuccess(handleRecord) {
	    editHandle(handleRecord);
	    if (handleWidget !== null) {
	        handleWidget.indicateNeedToSave(true);
	    }
	} 
	
	function onHandleCreatedSuccess(handle) {
	    isResolvingAfterCreate = true;
	    getHandle(handle);
	}
	
	function onSignIn(sessionDetails) {
	    resolveAndCreateHandleWidget.showCreateButtons();
	    if (handleWidget != null) {
	        // not enough to just enable; HS_SECKEY values may be missing
	        getHandle(handleWidget.getHandleRecord().handle);
	    }
	    testForHomedPrefixOnSource();
	}
	
    function testForHomedPrefixOnSource() {
        if (sourceServerSiteInfo != null) {
            if (querySpecificSiteWidget.getSpecificSiteConfig().selection === "source") {
                var pageNum = 0;
                var pageSize = 10;
                client.listPrefixesAtSite(sourceServerSiteInfo, pageNum, pageSize, listPrefixesAtSourceSiteSuccess, listPrefixesAtSourceSiteError);                
            }
        }
    }
    
    function listPrefixesAtSourceSiteSuccess(response) {
        var prefixList = response.prefixes;
        if (prefixList.length === 0) {
            homePrefixWidget.showNoPrefixedHomedWarning();
            onHomePrefixMenuClick();
        } 
    }
    
    function listPrefixesAtSourceSiteError() {
        console.log("Could not list prefixes at source site.");
    }	
	
	function onSignOut() {
	    resolveAndCreateHandleWidget.hideCreateButtons();
	    if (handleWidget != null) {
	        handleWidget.disable();
	        if (handleWidget.isNeedToSave()) {
	            getHandle(handleWidget.getHandleRecord().handle);
	        }
	    }
	}
	
	function onSaveHandleSuccess(handleString) {
	    notifications.alertSuccess("Handle: "+ handleString + " saved.");
	    handleObjectChangeDetector.reset();
	} 

	function onSaveHandleError(error) {
	    var message = ""; 
	    if (error.handleString != null) {
	        message += "Handle: "+ error.handleString + " could not be saved.";
	    } 
	    if (error.msg != null) {
	        message +=  " " + error.msg;
	    }
	    notifications.alertError(message);
	} 
	
	function onHandleDeletedSuccess(handleString) {
	    notifications.alertSuccess("Handle: "+ handleString + " deleted.");
	    handleDiv.hide();
	}

    function onHandleDeletedError(error) {
        var message = ""; 
        if (error.handleString != null) {
            message += "Handle: "+ error.handleString + " could not be deleted.";
        } 
        if (error.msg != null) {
            message +=  " " + error.msg;
        }
        notifications.alertError(message);
    }	
	
    function onHandleLookupRequested(handleString) {
        getHandle(handleString);
    }
    
    function getHandle(handleString) {
        if (isResolving) {
            return;
        }
        isResolving = true;
        resolveAndCreateHandleWidget.setResolvingState(isResolving);
        client.get(handleString, onGetHandleSuccess, onGetHandleError);
    }
    self.getHandle = getHandle;
    
    function onGetHandleSuccess(handleRecord, failedServerUrl) {
        isResolving = false;
        resolveAndCreateHandleWidget.setResolvingState(isResolving);
        resolveAndCreateHandleWidget.storeResolvedHandleInLocalStorage(handleRecord.handle);
        editHandle(handleRecord);
        if (isResolvingAfterCreate) {
            isResolvingAfterCreate = false;
        } else {
            if (handleRecord.fromProxy) {
                var messageDiv = $('<div></div>');
                var messageSpan1 = $('<span></span>');
                messageSpan1.text('This handle was resolved from the proxy. ' + 
                        'This may be because you have not accepted the https certificate for a handle server accessed during resolution.');
                if (failedServerUrl) {
                    messageSpan1.append(' Try visiting ');
                }
                var failedServerLink = $('<a>').attr('href', failedServerUrl).attr('target', '_blank').text(failedServerUrl);
                var messageSpan2 = $('<span></span>');
                messageSpan2.text(' If you successfully accept an https certificate you may resolve again.');
                if (failedServerUrl) messageSpan2.prepend('.');
                messageDiv.append(messageSpan1);
                if (failedServerUrl) messageDiv.append(failedServerLink);
                messageDiv.append(messageSpan2);
                notifications.alertWarningDiv(messageDiv);
            } else {
                notifications.clear();
            }
        }
    } 
    
    function editHandle(handleRecord) {
        handleDiv.empty();
        handleDiv.show();
        var isDisabled = true;
        if (client.sessionTracker.getAuthInfo() != null) {
            isDisabled = false;
        }
        if (handleRecord.fromProxy) {
            isDisabled = true;
        }
        handleWidget = new HandleEditorWidget(handleDiv, handleRecord, client, "", isDisabled);
        handleObjectChangeDetector.stop();
        handleObjectChangeDetector.setNewObjectToWatch(handleRecord);
        handleObjectChangeDetector.start();
    }
    
    function onHandleObjectChangeDetected() {
        // console.log("Handle object change detected need save.");
        //If needed update signature verify indicator.
        if (handleWidget !== null) {
            handleWidget.indicateNeedToSave(true);
        }  
    }
    
    function onGetHandleError(error) {
        if (isResolvingAfterCreate) {
            isResolvingAfterCreate = false;
        }
        handleDiv.empty();
        handleDiv.hide();
        var messageDiv = $('<div></div>');
        
        var message = ""; 
        if (error.handleString != null) {
            message += "Handle: "+ error.handleString + " could not be resolved.";
        } 
        if (error.msg != null) {
            message +=  " " + error.msg;
        }
        var span1 = $('<span></span>');
        span1.text(message);
        messageDiv.append(span1);
        if (error.name !== undefined) {
            if (error.name === client.errorConstants.POTENTIAL_SSL_ERROR || error.name === client.errorConstants.COULD_NOT_REACH_PROXY_ERROR) {
                var span2 = $('<span></span>');
                span2.text(' Try visiting ');
                messageDiv.append(span2);
                var link = $('<a>').attr('href', error.failedServerUrl).attr('target', '_blank').text(error.failedServerUrl);
                messageDiv.append(link);
                var span3 = $('<span></span>');
                span3.text(' and accept the certificate.');
            } 
        }
        notifications.alertErrorDiv(messageDiv);
        isResolving = false;
        resolveAndCreateHandleWidget.setResolvingState(isResolving);
    }    
    
    function getClient() {
        return client;
    }
    self.getClient = getClient;
    
	constructor();
}
