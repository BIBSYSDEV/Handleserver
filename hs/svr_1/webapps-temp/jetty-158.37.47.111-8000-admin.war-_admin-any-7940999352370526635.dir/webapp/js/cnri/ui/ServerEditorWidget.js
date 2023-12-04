function ServerEditorWidget(containerDiv, handleValue, server) {
    var self = this;
    var serverAddress = null;
    var serverId = null;
    var publicKey = null;
    var interfacesDiv = null;
    
    function constructor() {
        widgetId = ServerEditorWidget.count++;
        
        var deleteButton = $('<button type="submit" class="btn btn-sm btn-danger">Delete</button>');
        containerDiv.append(deleteButton);
        deleteButton.click(onDeleteClick);
        
        var form = $('<form class="form-horizontal" role="form"></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
        
        serverAddress = addTextInput(form, "Server Address", "serverAddressEditor-"+widgetId, server.address, onServerAddressChange);
        serverId = addTextInput(form, "Server ID", "serverIdEditor-"+widgetId, server.serverId, onServerIdChange);
        publicKey = addTextAreaInput(form, "Public Key", "serverPublicKeyEditor-"+widgetId, vkbeautify.json(JSON.stringify(server.publicKey)), onServerPublicKeyChange);
        buildInterfaceEditors();
    }
    
    function onDeleteClick() {
        var index = handleValue.data.value.servers.indexOf(server);
        handleValue.data.value.servers.splice(index, 1);
        containerDiv.remove();
        return false;
    }
    
    function buildInterfaceEditors() {
        interfacesDiv = $('<div class="well well-sm"></div>');
        containerDiv.append(interfacesDiv);

        addInterfaceButton = $('<button type="submit" class="btn btn-sm btn-default">Add</button>');
        interfacesDiv.append(addInterfaceButton);
        addInterfaceButton.click(onAddInterfaceButtonClick);
        interfacesDiv.append(" ");
        var title = $('<p style="display:inline-block;">Interfaces<p>');
        interfacesDiv.append(title);
        
        for (var i = 0; i < server.interfaces.length; i++) {
            var thisInterface = server.interfaces[i];
            addInterfaceWidget(thisInterface);
        }
    }
    
    function addInterfaceWidget(thisInterface) {
        var interfaceDiv = $('<div></div>');
        interfacesDiv.append(interfaceDiv);
        var interfaceEditorWidget = new InterfaceEditorWidget(interfaceDiv, handleValue, server, thisInterface);
    }
    
    function onAddInterfaceButtonClick() {
        var newInterface = {
                query: true,
                admin: true,
                protocol: "TCP",
                port: 2641
        };
        server.interfaces.push(newInterface);
        addInterfaceWidget(newInterface);
    }
    
    function onServerAddressChange() {
        server.address = serverAddress.val();
    }
    
    function onServerIdChange() {
        server.serverId = serverId.val();
    }    
    
    function onServerPublicKeyChange() {
        var json;
        try {
            json = JSON.parse(publicKey.val());
        } catch (e) {
            json = undefined;
        }
        if ($.isPlainObject(json) && "string" === $.type(json.format)) {
            server.publicKey = json;
        } else {
            publicKey.val(vkbeautify.json(JSON.stringify(server.publicKey)));
        }
    }
    
    function addTextInput(form, labelText, inputId, value, changeCallback) {
        var controlGroupDiv = $('<div class="form-group"></div>'); 
        form.append(controlGroupDiv);
        var label = $('<label class="col-sm-2 control-label"></label>').attr('for', inputId).text(labelText);
        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="col-sm-3"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<input type="text" class="form-control input-sm">').attr('id', inputId);
        input.val(value);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }  
   
    function addTextAreaInput(form, labelText, inputId, value, changeCallback) {
        var controlGroupDiv = $('<div class=""></div>'); 
        form.append(controlGroupDiv);
        var label = $('<label class="control-label"></label>').attr('for', inputId);
        label.text(labelText);
        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="controls"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<textarea class="form-control">').attr('id', inputId);
        input.val(value);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }     
    
    constructor();
}

ServerEditorWidget.count = 0;