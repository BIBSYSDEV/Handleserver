function SiteDataEditorWidget(containerDiv, handleValue) {
    var self = this;
    var widgetId = null;
    var protocolVersion = null;
    var serialNumber = null;
    var isPrimary = null;
    var isMultiPrimary = null;
    var serversDiv = null;
    var siteEditorContainerDiv = null;
    
    function constructor() {
        widgetId = SiteDataEditorWidget.count++;
        buildFilePicker();
        siteEditorContainerDiv = $('<div></div>');
        containerDiv.append(siteEditorContainerDiv);
        buildSiteEditor();
    }
    
    function buildSiteEditor() {
        var form = $('<form class="form-horizontal" role="form"></form>');
        form.submit(function(e) {return false;}); 
        siteEditorContainerDiv.append(form);
        protocolVersion = addTextInput(form, "Protocol Version", "hsSiteProtocolVersion-"+widgetId, handleValue.data.value.protocolVersion, onProtocolVersionChange);
        serialNumber = addTextInput(form, "Serial #", "hsSiteSerialNumber-"+widgetId, handleValue.data.value.serialNumber, onSerialNumberChange);
        isPrimary = addBooleanInput(form, "Primary", "hsSiteIsPrimary-"+widgetId, handleValue.data.value.primarySite, onIsPrimaryChange);
        isMultiPrimary = addBooleanInput(form, "Multi-Primary", "hsSiteIsMultiPrimary-"+widgetId, handleValue.data.value.multiPrimary, onIsMultiPrimaryChange);
        buildServerEditors();        
    }
    
    function buildFilePicker() {
        var form = $('<form class="form-horizontal"></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
    }
    
    function buildServerEditors() {
        serversDiv = $('<div class="well well-sm well-light"></div>');
        siteEditorContainerDiv.append(serversDiv);
        
        addServerButton = $('<button type="submit" class="btn btn-sm btn-default">Add</button>');
        serversDiv.append(addServerButton);
        addServerButton.click(onAddServerButtonClick);
        serversDiv.append(" ");
        var title = $('<p style="display:inline-block;">Servers<p>');
        serversDiv.append(title);
        
        for (var i = 0; i < handleValue.data.value.servers.length; i++) {
            var server = handleValue.data.value.servers[i];
            addServerWidget(server);
        }
    }
    
    function addServerWidget(server) {
        var serverContainerDiv = $('<div class="well well-sm"></div>');
        serversDiv.append(serverContainerDiv);
        var serverEditor = new ServerEditorWidget(serverContainerDiv, handleValue, server);
    }
    
    function onAddServerButtonClick() {
        var newServer = {
                    "serverId": 1,
                    "address": "0.0.0.0",
                    "publicKey": {
                      "format": "base64",
                      "value": ""
                    },
                    "interfaces": [
                      {
                        "query": true,
                        "admin": true,
                        "protocol": "TCP",
                        "port": 2641
                      },
                      {
                        "query": true,
                        "admin": false,
                        "protocol": "UDP",
                        "port": 2641
                      },
                      {
                        "query": true,
                        "admin": true,
                        "protocol": "HTTP",
                        "port": 8000
                      }
                    ]
                  };
        handleValue.data.value.servers.push(newServer);
        addServerWidget(newServer);
    }
    
    function onProtocolVersionChange() {
        handleValue.data.value.protocolVersion = protocolVersion.val();
    }
    
    function onSerialNumberChange() {
        handleValue.data.value.serialNumber = serialNumber.val();
    } 
    
    function onIsPrimaryChange() {
        handleValue.data.value.primarySite = isPrimary.is(':checked');
    }   
    
    function onIsMultiPrimaryChange() {
        handleValue.data.value.multiPrimary = isMultiPrimary.is(':checked');
    }     
    
    function isObject(o) { return Object.prototype.toString.call(o) == '[object Object]'; }
    function isArray(o) { return Object.prototype.toString.call(o) == '[object Array]'; }
    function isBoolean(o) { return Object.prototype.toString.call(o) == '[object Boolean]'; }
    function isNumber(o) { return Object.prototype.toString.call(o) == '[object Number]'; }
    function isString(o) { return Object.prototype.toString.call(o) == '[object String]'; }
    
    function addTextInput(form, labelText, inputId, value, changeCallback) {
        var valueString = "";
        if (isObject(value) || isArray(value)) {
            valueString = JSON.stringify(value);
        } else {
            valueString = value;
        }
        var controlGroupDiv = $('<div class="form-group"></div>'); 
        form.append(controlGroupDiv);
        var label = $('<label class="col-sm-2 control-label"></label>').attr('for', inputId).text(labelText);
        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="col-sm-3"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<input type="text" class="form-control input-sm">').attr('id', inputId);
        input.val(valueString);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }
    
    function addBooleanInput(form, labelText, inputId, value, changeCallback) {
        var controlGroupDiv = $('<div class="form-group"></div>'); 
        form.append(controlGroupDiv);
        var label = $('<label class="col-sm-2 control-label"></label>').attr('for', inputId).text(labelText);
        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="checkbox col-sm-3"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<input type="checkbox"></input>').attr('id', inputId);
        input.prop('checked', value);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }    
    
    constructor();
}

SiteDataEditorWidget.count = 0;