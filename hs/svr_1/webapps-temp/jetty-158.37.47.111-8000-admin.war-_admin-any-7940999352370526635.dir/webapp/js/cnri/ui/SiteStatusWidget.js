function SiteStatusWidget(containerDiv, client) {
    var self = this;
    var notifications = null;
    var updateButton = null;
    var statusDiv = null;
    
    function constructor() {
        amplify.subscribe(HandleEvents.SPECIFIC_SITE_SELECTION_CHANGED, onSpecificSiteSelectionChanged);
        amplify.subscribe(HandleEvents.ON_SIGN_IN, onSignIn);
        
        var closeButton = $('<button class="btn btn-sm btn-default pull-right">Close</button>');
        containerDiv.append(closeButton);
        closeButton.click(onCloseClick);
        
        containerDiv.append($('<h4>Site Status</h4>'));
        
        var notificationsDiv = $('<div class="notifications-small"></div>');
        containerDiv.append(notificationsDiv);
        notifications = new Notifications(notificationsDiv);
        
        updateButton = $('<button class="btn btn-sm btn-primary" style="min-width: 87px;" data-loading-text="Wait...">Update</button>');
        containerDiv.append(updateButton);
        updateButton.click(onUpdateButtonClick);
        
        statusDiv = $('<div></>');
        containerDiv.append(statusDiv);
        
        if (client.getSpecificSiteInfo() == null) {
            notifications.alertWarning("You need to select a specific site to perform status resolution.");
            disable();
        } else {
            getSiteStatus();
        }
    }
    
    function parseVersionZeroStatusValue(value) {
        var data = value.data.value;
        var entries = data.split("; ");
        var result = {};
        for (var i = 0; i < entries.length; i++) {
            var entry = entries[i];
            var parsedEntry = entry.split("=");
            result[parsedEntry[0]] = parsedEntry[1];
        }
        return result;
    }
    
    function parseVersionOneStatusValue(value) {
        var data = value.data.value;
        var result = JSON.parse(data);
        return result;
    }
    
    function onUpdateButtonClick() {
        getSiteStatus();
    }
    
    function getSiteStatus() {
        client.getSiteStatus(onGotSiteStatusSuccess, onGotSiteStatusError);
    }
    
    function onGotSiteStatusSuccess(statusHandleRecord) {
        notifications.clear();
        statusDiv.empty();
        
        if (statusHandleRecord.values.length > 0) {
            var versionZeroStatus = null;
            var versionOneStatus = null;
            var replicationInfo = null;
            var versionZeroStatusValue = cnri.util.HandleUtil.getHandleValueAtIndex(statusHandleRecord, 1);
            var versionOneStatusValue = cnri.util.HandleUtil.getHandleValueAtIndex(statusHandleRecord, 2);
            var replicationInfoValue = cnri.util.HandleUtil.getHandleValueAtIndex(statusHandleRecord, 3);
            
            if (versionZeroStatusValue !== null) {
                var versionZeroStatus = parseVersionZeroStatusValue(versionZeroStatusValue);
            }
            if (versionOneStatusValue !== null) {
                versionOneStatus = parseVersionOneStatusValue(versionOneStatusValue);
                var viewerDiv = $('<div></div>');
                statusDiv.append(viewerDiv);
                var siteStatusViewer = new SiteStatusVersionOneViewer(viewerDiv, versionOneStatus);
            } else {
                notifications.alertWarning('Your handle server is not configured to make status information available. Add "enable_monitor_daemon" = "yes" to the server_config secion of your config.dct file.');
            }
            if (replicationInfoValue !== null) {
                replicationInfo = JSON.parse(replicationInfoValue.data.value);
                var replicationInfoDiv = $('<div></div>');
                statusDiv.append(replicationInfoDiv);
                var replicationInfoViewer = new SiteReplicationInfoViewer(replicationInfoDiv, replicationInfo);
            }
        } else {
            notifications.alertWarning("No status values available. Try authenticating as a server admin.");
        }
    }
    
    function onGotSiteStatusError(response) {
        notifications.alertError(response.msg);
    }
    
    function disable() {
        updateButton.prop('disabled', true);
    }
    
    function enable() {
        updateButton.prop('disabled', false);
    }
    
    function onCloseClick() {
        hide();
    }
    
    
    function onSpecificSiteSelectionChanged(specificSiteSelection) {
        if (specificSiteSelection.specificSite == null) {
            disable();
            notifications.alertWarning("You need to select a specific site to perform status resolution.");
        } else {
            notifications.clear();
            enable();
            getSiteStatus();
        }
    }
    
    function onSignIn() {
        getSiteStatus();
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