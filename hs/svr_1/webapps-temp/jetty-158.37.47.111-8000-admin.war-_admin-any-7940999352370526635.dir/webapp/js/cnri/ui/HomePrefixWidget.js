function HomePrefixWidget(containerDiv, client) {
    var self = this;
    var prefixInput = null;
    var homePrefixButton = null;
    var unHomePrefixButton = null;
    var notifications = null;
    
    function constructor() {
        amplify.subscribe(HandleEvents.SPECIFIC_SITE_SELECTION_CHANGED, onSpecificSiteSelectionChanged);
        
        var closeButton = $('<button class="btn btn-sm btn-default pull-right">Close</button>');
        containerDiv.append(closeButton);
        closeButton.click(onCloseClick);
        
        containerDiv.append($('<h4>Home Prefix</h4>'));
        
        var form = $('<form class="form-inline" style="margin-bottom: 0px;"></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
        
        prefixInput = $('<input type="text" class="form-control input-sm" placeholder="Prefix"></input>');
        form.append(prefixInput);
        
        form.append(" ");
        
        homePrefixButton = $('<button class="btn btn-sm btn-primary homePrefixButton" data-loading-text="Wait...">Home prefix</button>');
        form.append(homePrefixButton);
        homePrefixButton.click(onHomeButtonClick);
        
        form.append(" ");
        
        unHomePrefixButton = $('<button class="btn btn-sm btn-danger unHomePrefixButton" data-loading-text="Wait...">Unhome prefix</button>');
        form.append(unHomePrefixButton);
        unHomePrefixButton.click(onUnhomeButtonClick);
        
        var notificationsDiv = $('<div class="notifications-small"></div>');
        containerDiv.append(notificationsDiv);
        notifications = new Notifications(notificationsDiv);
        
        if (client.getSpecificSiteInfo() == null) {
            notifications.alertWarning("You must select a specific site before homing a prefix.");
            disable();
        }
    }
    
    function showNoPrefixedHomedWarning() {
        notifications.alertWarning("You have not yet homed a prefix on the source handle server.");
    }
    self.showNoPrefixedHomedWarning = showNoPrefixedHomedWarning;
    
    function onSpecificSiteSelectionChanged(specificSiteSelection) {
        if (specificSiteSelection.specificSite == null) {
            disable();
            notifications.alertWarning("You must select a specific site before homing a prefix.");
        } else {
            enable();
            notifications.clear();
        }
    }
    
    function disable() {
        prefixInput.prop('disabled', true);
        homePrefixButton.prop('disabled', true);
        unHomePrefixButton.prop('disabled', true);
    }
    
    function enable() {
        prefixInput.prop('disabled', false);
        homePrefixButton.prop('disabled', false);
        unHomePrefixButton.prop('disabled', false);
    }
    
    function onCloseClick() {
        hide();
    }
    
    function onHomeButtonClick() {
        notifications.clear();
        var prefix = prefixInput.val();
        if (prefix === "") {
            var messageDiv = $('<div></div>');
            messageDiv.text("You must specify a prefix.");
            notifications.alertErrorDiv(messageDiv);
            return;
        }
        var site = client.getSpecificSiteInfo();
        client.homePrefixAtSite(prefix, site, onSuccess, onError);
    }
    
    function onUnhomeButtonClick() {
        var prefix = prefixInput.val();
        if (prefix === "") {
            var messageDiv = $('<div></div>');
            messageDiv.text("You must specify a prefix.");
            notifications.alertError(messageDiv);
            return;
        }
        unHomePrefixButton.button("loading");
        var site = client.getSpecificSiteInfo();
        client.unhomePrefixAtSite(prefix, site, onUnhomeSuccess, onUnhomeError);
    }
    
    function onSuccess(response) {
        notifications.alertSuccess("Prefix: "+ response.handle + " has been homed.");
        homePrefixButton.button("reset");
    }
    
    function onUnhomeSuccess(response) {
        notifications.alertSuccess("Prefix: "+ response.handle + " has been unhomed.");
        unHomePrefixButton.button("reset");
    }
    
    function onError(response) {
        var errorMessage = "Prefix could not be homed.";
        if (response.msg !== undefined) {
            errorMessage = errorMessage + " " + response.msg;
        }
        notifications.alertError(errorMessage);
        homePrefixButton.button("reset");
    }
    
    function onUnhomeError(response) {
        notifications.alertError("Prefix could not be unhomed.");
        unHomePrefixButton.button("reset");
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