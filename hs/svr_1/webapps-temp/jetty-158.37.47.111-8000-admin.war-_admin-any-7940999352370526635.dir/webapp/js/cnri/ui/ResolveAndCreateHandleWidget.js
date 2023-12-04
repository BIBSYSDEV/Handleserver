function ResolveAndCreateHandleWidget(containerDiv, client, app) {
    var self = this;
    var handleInput = null;
    var createHandleButton = null;
    var createHandleWithoutSavingButton = null;
    var createHandleMintSuffixButton = null;
    var resolveHandleButton = null;
    var currentSiteLabel = null;
    var localTypeaheadBloodhound = null;
    
    function constructor() {
        amplify.subscribe(HandleEvents.SPECIFIC_SITE_SELECTION_CHANGED, onSpecificSiteSelectionChanged);
        
        var form = $('<form class="form-inline" role="form"></form>');
        containerDiv.append(form);
        form.submit(function(e) {return false;}); 
        

        
        handleInput = $('<input autocapitalize="off" class="form-control input-sm handleInput" type="text" placeholder="Handle"></input>');
        form.append(handleInput).append(" ");
        handleInput.keypress(function(event){
            if(event.keyCode == 13){ 
                event.preventDefault();
                onResolveHandleClick();
            }
        });
//        handleInput.typeahead({
//            source : $.map(getUsedHandlesFromLocalStore(), cnri.util.StringUtil.escapeHtml),
//            updater:function (handleString) {
//                handleString = cnri.util.StringUtil.reverseEscapeHtml(handleString);
//                app.getHandle(handleString);
//                return handleString;
//            }
//        });
        
        
       // var localTypeaheadBloodhoundLocal = $.map(getUsedHandlesFromLocalStore(), function (value) { return { value: value }; });
        
        localTypeaheadBloodhound = new Bloodhound({
            datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.value); },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            local: function () { return $.map(getUsedHandlesFromLocalStore(), function (value) { return { value: value }; }); }
        });
             
        // initialize the bloodhound suggestion engine
        localTypeaheadBloodhound.initialize();
             
        handleInput.typeahead(null, {
            source: function (query, cb) { return localTypeaheadBloodhound.get(query, cb); }
        });
        
        resolveHandleButton = $('<button class="btn btn-sm btn-primary resolveHandleButton" data-loading-text="Wait...">Resolve</button>');
        form.append(resolveHandleButton).append(" ");
        resolveHandleButton.click(onResolveHandleClick);
        
        createHandleButton = $('<button class="btn btn-sm btn-success createHandleButton" style="display:none;" data-loading-text="Wait...">Create</button>');
        form.append(createHandleButton).append(" ");
        createHandleButton.click(onCreateHandleClick);
        createHandleWithoutSavingButton = $('<button class="btn btn-sm btn-default" style="display:none;">Create without saving</button>');
        form.append(createHandleWithoutSavingButton).append(" ");
        createHandleWithoutSavingButton.click(onCreateHandleNoSaveClick);
        createHandleMintSuffixButton = $('<button class="btn btn-sm btn-default createAndMintHandleButton" style="display:none;" data-loading-text="Wait...">Create with random suffix</button>');
        form.append(createHandleMintSuffixButton).append(" ");
        createHandleMintSuffixButton.click(onCreateHandleMintSuffixClick);
        
        currentSiteLabel = $('<span></span>');
        containerDiv.append(currentSiteLabel);
        
        containerDiv.append(" ");
        
        var changeSiteLink = $('<a href="#">(Change this)</a>');
        changeSiteLink.click(app.onQuerySpecificSiteMenuClick);
        containerDiv.append(changeSiteLink);
    }
    
    function onSpecificSiteSelectionChanged(specificSiteSelection) {
        var description = "";
        if (specificSiteSelection.specificSite == null) {
            description = "Global";
        } else {
            description = cnri.hdl.util.HandleValueSummary.getSiteString(specificSiteSelection.specificSite);
        }
        currentSiteLabel.text("Currently sending requests to: " + description);
    }
    
    function getUsedHandlesFromLocalStore() {
        var resolvedHandles = amplify.store("resolvedHandles");
        if (resolvedHandles != null && resolvedHandles != undefined) {
            return resolvedHandles;
        } else {
            return [];
        }
    }
    
    //Note: only stores the handle not the handle record. Used for autocomplete.
    function storeResolvedHandleInLocalStorage(handleString) {
        var resolvedHandles = getUsedHandlesFromLocalStore();
        if (resolvedHandles.indexOf(handleString) == -1) { 
            resolvedHandles.unshift(handleString);
            amplify.store("resolvedHandles", resolvedHandles);
            localTypeaheadBloodhound = new Bloodhound({
                datumTokenizer: function(d) { return Bloodhound.tokenizers.whitespace(d.value); },
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: function () { return $.map(getUsedHandlesFromLocalStore(), function (value) { return { value: value }; }); }
            });
            localTypeaheadBloodhound.initialize();
            //handleInput.data('typeahead').source = resolvedHandles;
        }
    }
    self.storeResolvedHandleInLocalStorage = storeResolvedHandleInLocalStorage;
    
    function onResolveHandleClick() {
        handleInput.typeahead('close');
        var handleString = handleInput.val();
        app.getHandle(handleString);
    }
    
    function setResolvingState(resolvingState) {
        if (resolvingState === true) {
            resolveHandleButton.button('loading');
        } else {
            resolveHandleButton.button('reset');
        }
    }
    self.setResolvingState = setResolvingState;
    
    function showCreateButtons() {
        createHandleButton.show();
        createHandleWithoutSavingButton.show();
        createHandleMintSuffixButton.show();
    }
    self.showCreateButtons = showCreateButtons;
    
    function hideCreateButtons() {
        createHandleButton.hide();
        createHandleWithoutSavingButton.hide();
        createHandleMintSuffixButton.hide();
    }
    self.hideCreateButtons = hideCreateButtons;    
    
    function onCreateHandleClick() {
        var mintNewSuffix = false;
        createHandle(mintNewSuffix);
    }
    
    function createHandle(mintNewSuffix) {
        var currentAuthInfo = client.sessionTracker.getAuthInfo();
        if (currentAuthInfo == null) {
            return false; //Should never happen
        }
        
        if (mintNewSuffix) {
            createHandleMintSuffixButton.button('loading');
        } else {
            createHandleButton.button('loading');
        }
        
        var handleRecord = createHandleJavaScriptObject(currentAuthInfo);
        app.createHandle(handleRecord, mintNewSuffix, onCreateHandleSuccess, onCreateHandleError);
        return false;
    }
    
    function onCreateHandleMintSuffixClick() {
        var mintNewSuffix = true;
        createHandle(mintNewSuffix);
    }
    
    function createHandleJavaScriptObject(currentAuthInfo) {
        var idTokens = currentAuthInfo.id.split(":");
        var userIndex = idTokens[0];
        var userHandle = idTokens[1];
        var newHandleString = handleInput.val();
        var prefix = getPrefix(newHandleString);
        var handleRecord = {
                "handle":newHandleString,
                "values":[
                {
                    "index":100,
                    "type":"HS_ADMIN",
                    "data":{
                        "format":"admin",
                        "value":{
                            "handle":"0.NA/" + prefix,
                            "index":200,
                            "permissions":"111111111111"
                        }
                    }
                }
            ]
            };
        return handleRecord;
    }
    
    function getPrefix(handleString) {
        return handleString.split("/")[0];
    }
    
    function onCreateHandleNoSaveClick() {
        var currentAuthInfo = client.sessionTracker.getAuthInfo();
        if (currentAuthInfo == null) {
            return false; //Should never happen
        }
        var handleRecord = createHandleJavaScriptObject(currentAuthInfo);
        amplify.publish(HandleEvents.HANDLE_CREATED_LOCAL_SUCCESS, handleRecord);
        return false;       
    }
    
    function onCreateHandleSuccess(response) {
        app.notifications.alertSuccess("Handle " + response.handle + " has been successfully created.");
        amplify.publish(HandleEvents.HANDLE_CREATED_SUCCESS, response.handle);
        createHandleButton.button('reset');
        createHandleMintSuffixButton.button('reset');
    }
    
    function onCreateHandleError(error) {
        app.notifications.alertError("Handle " + error.handleString + " could not be created. " + error.msg);
        createHandleButton.button('reset');
        createHandleMintSuffixButton.button('reset');
    }   
    
    constructor();
}