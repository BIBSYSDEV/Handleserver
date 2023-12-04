function QuerySpecificSiteWidget(containerDiv, client, specificSiteConfig, sourceServerSiteInfo) {
    var self = this;

    var selection = null;
    //var sourceServerSiteInfo = null;
    var lastRetrievedByAddressSiteInfo = null;
    var lastRetrievedByHandleSiteInfo = null;
    
    var selectSiteByAddressWidget = null;
    var selectSiteByValueInHandleWidget = null;
    
    var sourceSelectionDiv = null;
    var byAddressNotifications = null;
    var byHandleNotifications = null;
    
    var globalRadio = null;
    var sourceRadio = null;
    var byHandleRadio = null;
    var byAddressRadio = null;
    
    var selectedSiteLabel = null;
    
    function constructor() {
        var closeButton = $('<button class="btn btn-sm btn-default pull-right">Close</button>');
        containerDiv.append(closeButton);
        closeButton.click(onCloseClick);
        
        containerDiv.append($('<h4>Query Specific Site</h4>'));
        selectedSiteLabel = $('<span></span>');
        containerDiv.append(selectedSiteLabel);
        
        var siteSelectionForm = $('<form></form>');
        containerDiv.append(siteSelectionForm);

        //==============
        
        var globalSelectionDiv = $('<div class="well well-sm"></div>');
        siteSelectionForm.append(globalSelectionDiv);
        var globalLabel = $('<label class="radio">Global</label>');
        globalSelectionDiv.append(globalLabel);
        globalRadio = $('<input type="radio" name="siteSelection" id="siteSelectionGlobalRadio" value="global" checked>');
        globalRadio.change(onSelectionChanged);
        globalLabel.append(globalRadio);
        
        //==============
        
        sourceSelectionDiv = $('<div class="well well-sm"></div>');
        siteSelectionForm.append(sourceSelectionDiv);
        var sourceLabel = $('<label class="radio">Source Server</label>');
        sourceSelectionDiv.append(sourceLabel);
        sourceRadio = $('<input type="radio" name="siteSelection" id="siteSelectionSourceRadio" value="source">');
        sourceRadio.change(onSelectionChanged);
        sourceLabel.append(sourceRadio);
        
        var bySourceNotificationsDiv = $('<div class="notifications-small"></div>');
        sourceSelectionDiv.append(bySourceNotificationsDiv);
        bySourceNotifications = new Notifications(bySourceNotificationsDiv);
        
        //=============
        
        var byHandleSelectionDiv = $('<div class="well well-sm"></div>');
        siteSelectionForm.append(byHandleSelectionDiv);
        var byHandleLabel = $('<label class="radio">By Handle</label>');
        byHandleSelectionDiv.append(byHandleLabel);
        byHandleRadio = $('<input type="radio" name="siteSelection" id="siteSelectionByHandleRadio" value="byHandle" >');
        byHandleRadio.change(onSelectionChanged);
        byHandleLabel.append(byHandleRadio);
        
        var byHandleWidgetDiv = $('<div></div>');
        byHandleSelectionDiv.append(byHandleWidgetDiv);
        selectSiteByValueInHandleWidget = new SelectSiteByValueInHandleWidget(byHandleWidgetDiv, onByHandleInputChanged);
        selectSiteByValueInHandleWidget.disable();

        var retrieveSiteInfoByHandleButton = $('<button class="btn btn-sm btn-default">Retrieve</button>');
        byHandleSelectionDiv.append(retrieveSiteInfoByHandleButton);
        retrieveSiteInfoByHandleButton.click(retrieveSiteInfoByHandleClick);
        
        var byHandleNotificationsDiv = $('<div class="notifications-small"></div>');
        byHandleSelectionDiv.append(byHandleNotificationsDiv);
        byHandleNotifications = new Notifications(byHandleNotificationsDiv);
        
        //==============
        
        var byAddressSelectionDiv = $('<div class="well well-sm"></div>');
        siteSelectionForm.append(byAddressSelectionDiv);
        var byAddressLabel = $('<label class="radio">By Address</label>');
        byAddressSelectionDiv.append(byAddressLabel);
        byAddressRadio = $('<input type="radio" name="siteSelection" id="siteSelectionByAddressRadio" value="byAddress" >');
        byAddressRadio.change(onSelectionChanged);
        byAddressLabel.append(byAddressRadio);
        
        var byAddressWidgetDiv = $('<div></div>');
        byAddressSelectionDiv.append(byAddressWidgetDiv);
        selectSiteByAddressWidget = new SelectSiteByAddressWidget(byAddressWidgetDiv, onByAddressInputChanged);
        selectSiteByAddressWidget.disable();
        
        var retrieveSiteInfoByAddressButton = $('<button class="btn btn-sm btn-default">Retrieve</button>');
        byAddressSelectionDiv.append(retrieveSiteInfoByAddressButton);
        retrieveSiteInfoByAddressButton.click(retrieveSiteInfoByAddressClick);
        
        var byAddressNotificationsDiv = $('<div class="notifications-small"></div>');
        byAddressSelectionDiv.append(byAddressNotificationsDiv);
        byAddressNotifications = new Notifications(byAddressNotificationsDiv);
        
        //==============
        
        //getSourceServerSiteInfo();
        
        if (sourceServerSiteInfo == null) {
            sourceSelectionDiv.hide();
        } else {
            bySourceNotifications.alertSuccess("Site info retrieved");
        }
        applyConfigurationOptions();
    }
    
    function isSiteInfoOutOfDate(siteInfo) {
        var retrievalTimestamp = siteInfo.retrievalTimestamp;
        if (retrievalTimestamp === undefined) {
            return true;
        }
        var ttlSeconds = siteInfo.ttl; 
        if (ttlSeconds === undefined) {
            ttlSeconds = 86400; //24hours
        } 
        var now = new Date();
        var nowMs = now.getTime();
        var nowSeconds = Math.round(nowMs / 1000);
        var deltaSeconds = nowSeconds - retrievalTimestamp;
        return deltaSeconds > ttlSeconds; 
    }
    
    function applyConfigurationOptions() {
        selection = specificSiteConfig.selection;
        if (selection === "source" && sourceServerSiteInfo === null) {
            selection = "global";
        }
        lastRetrievedByAddressSiteInfo = specificSiteConfig.lastRetrievedByAddressSiteInfo;
        lastRetrievedByHandleSiteInfo = specificSiteConfig.lastRetrievedByHandleSiteInfo;
        
        if (lastRetrievedByAddressSiteInfo != null) {
            if (isSiteInfoOutOfDate(lastRetrievedByAddressSiteInfo)) {
                console.log("by address siteInfo out of date");
                //lastRetrievedByAddressSiteInfo = null;
                byAddressNotifications.alertWarning("Site info retrieved from local storage is out of date.");
            } else {
                byAddressNotifications.alertSuccess("Site info retrieved from local storage");
            }
        }
        
        if (lastRetrievedByHandleSiteInfo != null) {
            if (isSiteInfoOutOfDate(lastRetrievedByHandleSiteInfo)) {
                console.log("by handle siteInfo out of date");
                //lastRetrievedByHandleSiteInfo = null;
                byHandleNotifications.alertWarning("Site info retrieved from local storage is out of date.");
            } else {
                byHandleNotifications.alertSuccess("Site info retrieved from local storage.");
            }
        }
                
        if (specificSiteConfig.byHandleInputInfo) {
            selectSiteByValueInHandleWidget.setSelection(specificSiteConfig.byHandleInputInfo);
        }
        if (specificSiteConfig.byAddressInputInfo) {
            selectSiteByAddressWidget.setSelection(specificSiteConfig.byAddressInputInfo);
        }
        if (selection === "global") {
            globalRadio.prop('checked',true);
            selectSiteByValueInHandleWidget.disable();
            selectSiteByAddressWidget.disable();
            client.doNotQuerySpecificSite();
            updateSelectedSiteLabel();
        } else if (selection === "source") {
            sourceRadio.prop('checked',true);
            selectSiteByValueInHandleWidget.disable();
            selectSiteByAddressWidget.disable();
            client.querySpecificSite(sourceServerSiteInfo);
            updateSelectedSiteLabel();
        } else if (selection === "byHandle") {
            byHandleRadio.prop('checked',true);
            selectSiteByValueInHandleWidget.enable();
            selectSiteByAddressWidget.disable();
            if (lastRetrievedByHandleSiteInfo != null) {
                client.querySpecificSite(lastRetrievedByHandleSiteInfo);
                updateSelectedSiteLabel();
            } else {
                client.doNotQuerySpecificSite();
                updateSelectedSiteLabel();
                byHandleNotifications.alertWarning("Site info needs to be retrieved before it can be used.");
            }
        } else if (selection === "byAddress") {
            byAddressRadio.prop('checked',true);
            selectSiteByValueInHandleWidget.disable();
            selectSiteByAddressWidget.enable();
            if (lastRetrievedByAddressSiteInfo != null) {
                client.querySpecificSite(lastRetrievedByAddressSiteInfo);
                updateSelectedSiteLabel();
            } else {
                client.doNotQuerySpecificSite();
                updateSelectedSiteLabel();
                byAddressNotifications.alertWarning("Site info needs to be retrieved before it can be used.");
            }
        }
        updateSelectedSiteLabel();
    }
    
    function storeSpecificSiteConfig() {
        specificSiteConfig.selection = selection;
        specificSiteConfig.lastRetrievedByAddressSiteInfo = lastRetrievedByAddressSiteInfo;
        specificSiteConfig.lastRetrievedByHandleSiteInfo = lastRetrievedByHandleSiteInfo;
        specificSiteConfig.byHandleInputInfo = selectSiteByValueInHandleWidget.getSelection();
        specificSiteConfig.byAddressInputInfo = selectSiteByAddressWidget.getSelection();
        
        amplify.store("specificSiteConfig", specificSiteConfig);
    }
    
    function getSpecificSiteConfig() {
        return specificSiteConfig;
    }
    self.getSpecificSiteConfig = getSpecificSiteConfig;
    
    function onByHandleInputChanged() {
        lastRetrievedByHandleSiteInfo = null;
        client.doNotQuerySpecificSite();
        updateSelectedSiteLabel();
        byHandleNotifications.alertWarning("Site info needs to be retrieved before it can be used.");
    }
    
    function onByAddressInputChanged() {
        lastRetrievedByAddressSiteInfo = null;
        client.doNotQuerySpecificSite();
        updateSelectedSiteLabel();
        byAddressNotifications.alertWarning("Site info needs to be retrieved before it can be used.");
    }
    
    function retrieveSiteInfoByHandleClick(e) {
        e.preventDefault();
        refreshByHandleSiteInfo();
    }
    
    function refreshByHandleSiteInfo() {
        var siteHandleInfo = selectSiteByValueInHandleWidget.getSelection();
        var index = parseInt(siteHandleInfo.index);
        client.getSiteInfoFromHandle(siteHandleInfo.handle, index, siteHandleInfo.usePrimary, onGotSiteByHandleSuccess, onGotSiteByHandleError);
    }
    
    function retrieveSiteInfoByAddressClick(e) {
        e.preventDefault();
        refreshByAddressSiteInfo();
    }
    
    function refreshByAddressSiteInfo() {
        var siteAddressInfo = selectSiteByAddressWidget.getSelection();
        client.getSiteInfoDirectFromServer(siteAddressInfo.ipAddress, siteAddressInfo.port, onGotSiteByAddressSuccess, onGotSiteByAddressError);        
    }
    
    function onGotSiteByHandleSuccess(site) {
        lastRetrievedByHandleSiteInfo = site;
        if (selection === "byHandle") {
            client.querySpecificSite(site);
            updateSelectedSiteLabel(); 
        }
        byHandleNotifications.alertSuccess("Site info retrieved");
    }
    
    function onGotSiteByHandleError(response) {
        lastRetrievedByHandleSiteInfo = null;
        if (selection === "byHandle") {
            client.doNotQuerySpecificSite();
            updateSelectedSiteLabel();
        }
        byHandleNotifications.alertError("Could not get site info from specified handle. " + response.message);
    }
    
    function onGotSiteByAddressSuccess(site) {
        lastRetrievedByAddressSiteInfo = site;
        if (selection === "byAddress") {
            client.querySpecificSite(site);
            updateSelectedSiteLabel();
        }
        byAddressNotifications.alertSuccess("Site info retrieved");
    }
    
    function onGotSiteByAddressError(response) {
        lastRetrievedByAddressSiteInfo = null;
        if (selection === "byAddress") {
            client.doNotQuerySpecificSite();
        }
        updateSelectedSiteLabel();
        byAddressNotifications.alertError("Could not get site info from specified address");
    }
    
    function updateSelectedSiteLabel() {
        var currentlyUsingString = "Currently sending requests to: " + getCurrentlyUsedSiteString();
        selectedSiteLabel.text(currentlyUsingString);
        var specificSiteSelection = {
                selection : selection,
                specificSite : client.getSpecificSiteInfo()
        };
        amplify.publish(HandleEvents.SPECIFIC_SITE_SELECTION_CHANGED, specificSiteSelection);
        storeSpecificSiteConfig();
    }
    
    function getCurrentlyUsedSiteString() {
        var specificSite = client.getSpecificSiteInfo();
        if (specificSite === null) {
            return "Global";
        } else {
            var description = cnri.hdl.util.HandleValueSummary.getSiteString(specificSite);
            return description;
        }
    }
    
    function getSiteDescriptionAttribute(specificSite) {
        var attributes = specificSite.data.value.attributes;
        if (attributes === undefined) {
            return null;
        }
        for (var i = 0; i < attributes.length; i++) {
            var attribute = attributes[i];
            if (attribute.name === "desc") {
                return attribute.value;
            }
        }
        return null;
    }
    
    function onSelectionChanged(e) {
        selection = $(this).val();
        console.log("selection changed " + selection);
        if (selection === "global") {
            selectSiteByValueInHandleWidget.disable();
            selectSiteByAddressWidget.disable();
            client.doNotQuerySpecificSite();
            updateSelectedSiteLabel();
        } else if (selection === "source") { //TODO handle case where sourceSiteInfo is null
            selectSiteByValueInHandleWidget.disable();
            selectSiteByAddressWidget.disable();
            client.querySpecificSite(sourceServerSiteInfo);
            updateSelectedSiteLabel();
        } else if (selection === "byHandle") {
            selectSiteByValueInHandleWidget.enable();
            selectSiteByAddressWidget.disable();
            if (lastRetrievedByHandleSiteInfo != null) {
                if (isSiteInfoOutOfDate(lastRetrievedByHandleSiteInfo)) {
                    refreshByHandleSiteInfo();
                } else {
                    client.querySpecificSite(lastRetrievedByHandleSiteInfo);
                    updateSelectedSiteLabel();
                }
            } else {
                client.doNotQuerySpecificSite();
                updateSelectedSiteLabel();
                byHandleNotifications.alertWarning("Site info needs to be retrieved before it can be used.");
            }
        } else if (selection === "byAddress") {
            selectSiteByValueInHandleWidget.disable();
            selectSiteByAddressWidget.enable();
            if (lastRetrievedByAddressSiteInfo != null) {
                if (isSiteInfoOutOfDate(lastRetrievedByAddressSiteInfo)) {
                    refreshByAddressSiteInfo();
                } else {
                    client.querySpecificSite(lastRetrievedByAddressSiteInfo);
                    updateSelectedSiteLabel();
                }

            } else {
                client.doNotQuerySpecificSite();
                updateSelectedSiteLabel();
                byAddressNotifications.alertWarning("Site info needs to be retrieved before it can be used.");
            }
        }
    }
    
    function onCloseClick() {
        hide();
    }
    
    function show() {
        containerDiv.show();
    }
    self.show = show;
    
    function hide() {
        containerDiv.hide();
    }
    self.hide = hide;
    
    constructor();
}

function SelectSiteByValueInHandleWidget(byValueInHandleDiv, onChangeHandler) {
    var self = this;
    var indexInput = null;
    var handleInput = null;
    var usePrimaryCheckBox = null;
    var isUsePrimary = true;
    
    function constructor() {
        var byValueInHandleForm = $('<form class="form-inline" role="form"></form>');
        byValueInHandleForm.submit(function(e) {return false;}); 
        byValueInHandleDiv.append(byValueInHandleForm);
        
        indexInput = $('<input type="text" class="form-control input-sm" placeholder="Index"></input>');
        byValueInHandleForm.append(indexInput);
        if (isUsePrimary) {
            indexInput.prop('disabled', true);
        }
        indexInput.on('input', onChange);
        
        byValueInHandleForm.append(" : ");
        
        handleInput = $('<input type="text" class="form-control input-sm" placeholder="Handle"></input>');
        byValueInHandleForm.append(handleInput);
        handleInput.on('input', onChange);
        
        byValueInHandleForm.append(" ");
        
        var usePrimaryLabel = $('<label class="checkbox" >Use any primary site info from handle</label>');
        usePrimaryCheckBox = $('<input type="checkbox" class=""></input>');
        usePrimaryLabel.append(usePrimaryCheckBox);
        usePrimaryCheckBox.change(usePrimaryChangeCallback);
        usePrimaryCheckBox.attr("checked", isUsePrimary);
        
        byValueInHandleForm.append(usePrimaryLabel);
        
        byValueInHandleForm.append(" ");
    }
    
    function onChange() {
        onChangeHandler();
    }
    
    function usePrimaryChangeCallback() {
        isUsePrimary = usePrimaryCheckBox.is(':checked');
        if (isUsePrimary) {
            indexInput.prop('disabled', true);
        } else {
            indexInput.prop('disabled', false);
        }
        onChange();
    }
    
    function enable() {
        handleInput.prop('disabled', false);
        usePrimaryCheckBox.prop('disabled', false);
        if (!isUsePrimary) {
            indexInput.prop('disabled', false);
        }
    }
    self.enable = enable;
    
    function disable() {
        handleInput.prop('disabled', true);
        indexInput.prop('disabled', true);
        usePrimaryCheckBox.prop('disabled', true);
    }
    self.disable = disable;
    
    function setSelection(specificSiteSelection) {
        handleInput.val(specificSiteSelection.handle);
        indexInput.val(specificSiteSelection.index);
        usePrimaryCheckBox.attr("checked", specificSiteSelection.usePrimary);
        isUsePrimary = specificSiteSelection.usePrimary;
        if (!isUsePrimary) {
            indexInput.prop('disabled', false);
        }
    }
    self.setSelection = setSelection;
    
    function getSelection() {
        var specificSiteSelection = {};
        specificSiteSelection.handle = handleInput.val();
        specificSiteSelection.usePrimary = isUsePrimary;
        if (!isUsePrimary) {
            specificSiteSelection.index = indexInput.val();
        }
        return specificSiteSelection;
    }
    self.getSelection = getSelection;
    
    constructor();
}

function SelectSiteByAddressWidget(byAddressDiv, onChangeHandler) {
    var self = this;
    
    var serverAddressInput = null;
    var portInput = null;
    
    function constructor() {
        var byAddressForm = $('<form class="form-inline" role="form"></form>');
        byAddressForm.submit(function(e) {return false;}); 
        byAddressDiv.append(byAddressForm);
        
        serverAddressInput = $('<input type="text" class="form-control input-sm" placeholder="IP Address"></input>');
        serverAddressInput.on('input', onChange);
        byAddressForm.append(serverAddressInput);
        
        byAddressForm.append(" : ");
        
        portInput = $('<input type="text" class="form-control input-sm" placeholder="Port"></input>');
        portInput.on('input', onChange);
        byAddressForm.append(portInput);
    }
    
    function onChange() {
        onChangeHandler();
    }
    
    function enable() {
        serverAddressInput.prop('disabled', false);
        portInput.prop('disabled', false);
    }
    self.enable = enable;
    
    function disable() {
        serverAddressInput.prop('disabled', true);
        portInput.prop('disabled', true);
    }
    self.disable = disable;
    
    function setSelection(specificSiteSelection) {
        serverAddressInput.val(specificSiteSelection.ipAddress);
        portInput.val(specificSiteSelection.port);
    }
    self.setSelection = setSelection;
    
    function getSelection() {
        var specificSiteSelection = {};
        specificSiteSelection.ipAddress = serverAddressInput.val();
        specificSiteSelection.port = portInput.val();
        return specificSiteSelection;
    }
    self.getSelection = getSelection;
    
    constructor();
}