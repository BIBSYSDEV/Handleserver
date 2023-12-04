function ClientConfigWidget(containerDiv, client) {
    var self = this;
    var notifications = null;
    var input = null;
    var lastClientConfigurationString = "";
    
    function constructor() {
        containerDiv.addClass("clientConfigWidget");
        
        var closeButton = $('<button class="btn btn-sm btn-default pull-right">Close</button>');
        containerDiv.append(closeButton);
        closeButton.click(onCloseClick);
        
        containerDiv.append($('<h4>Client Configuration</h4>'));
        
        var form = $('<form class=""></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
        lastClientConfigurationString = JSON.stringify(client.config, null, " ");
        var controlGroupDiv = $('<div class=""></div>'); 
        form.append(controlGroupDiv);
        var controlsDiv = $('<div class="controls"></div>');
        controlGroupDiv.append(controlsDiv);
        input = $('<textarea class="form-control">');
        input.val(lastClientConfigurationString);
        controlsDiv.append(input);
        input.keyup(inputChangeCallback);
        
        form.append(" ");
        
        var applyButton = $('<button class="btn btn-sm btn-primary" >Apply</button>');
        form.append(applyButton);
        applyButton.click(onApplyButtonClick);
                
        form.append(" ");
        
        var resetToDefaultButton = $('<button class="btn btn-sm" >Reset to default</button>');
        form.append(resetToDefaultButton);
        resetToDefaultButton.click(onResetButtonClick);
        
        var notificationsDiv = $('<div class="notifications-small"></div>');
        containerDiv.append(notificationsDiv);
        notifications = new Notifications(notificationsDiv);
    }
    
    function inputChangeCallback() {
        var clientConfigurationString = input.val();
        if (clientConfigurationString !== lastClientConfigurationString) {
            notifications.alertWarning("Config changes not yet saved.");
        } else {
            notifications.clear();
        }
    }
    
    function onApplyButtonClick() {
        var clientConfigurationString = input.val();
        try {
            var clientConfig = JSON.parse(clientConfigurationString);
        } catch (err) {
            notifications.alertError("JSON config could not be parsed.");
            return;
        }
        amplify.store("clientConfig", clientConfig);
        client.setConfig(clientConfig);
        lastClientConfigurationString = clientConfigurationString;
        notifications.alertSuccess("JSON config parsed, applied and saved.");
    }
    
    function onResetButtonClick() {
        var defaultClientConfig = app.getCopyOfDefaultClientConfig();
        var defaultConfigString = JSON.stringify(defaultClientConfig, null, " ");
        input.val(defaultConfigString);
        inputChangeCallback();
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