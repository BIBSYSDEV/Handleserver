function InterfaceEditorWidget(containerDiv, handleValue, server, thisInterface) {
    var self = this;
    var portInput = null;
    var admin = null;
    var query = null;
    var protocol = null;
    var widgetId = null;
    
    function constructor() {
        widgetId = InterfaceEditorWidget.count++;
        var form = $('<form class="form-inline" role="form"></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
        
        admin = addCheckBox(form, "Admin ", "interfaceWidgetAdmin-"+widgetId, thisInterface.admin, onAdminChange);
        form.append(" ");
        query = addCheckBox(form, "Query ", "interfaceWidgetQuery-"+widgetId, thisInterface.query, onQueryChange);
        form.append(" ");
        
        protocol = addProtocolSelect(form, thisInterface.protocol, onProtocolChange);
        form.append(" ");
        
        portInput = $('<input type="text" class="form-control input-sm" placeholder="port">');
        portInput.val(thisInterface.port);
        portInput.change(onPortChanged);
        form.append(portInput);
        form.append(" ");
        
        var deleteButton = $('<button type="submit" class="btn btn-sm btn-danger">Delete</button>');
        form.append(deleteButton);
        deleteButton.click(onDeleteClick);
    }
    
    function addProtocolSelect(form, value, changeCallback) {
        var select = $('<select id="interfaceProtocolSelect-'+ widgetId +'" class="selectpicker"></select>');
        form.append(select);

        var udp = $('<option value="UDP">UDP</option>');
        select.append(udp);
        var tcp = $('<option value="TCP">TCP</option>');
        select.append(tcp);
        var http = $('<option value="HTTP">HTTP</option>');
        select.append(http);
        
        select.selectpicker({'width':'100px'});
        select.selectpicker('val', value);
        select.change(changeCallback);
        return select;
    }
    
    function addCheckBox(form, labelText, inputId, value, changeCallback) {
        var label = $('<label class="checkbox inline"></label>').attr('for', inputId).text(labelText);
        form.append(label);
        form.append(" ");
        var input = $('<input class="checkbox" type="checkbox">').attr('id', inputId);
        input.prop('checked', value);
        label.append(input);
        input.change(changeCallback);
        return input;
    }
    
    function onProtocolChange() {
        thisInterface.protocol = protocol.val();
    }
    
    function onAdminChange() {
        thisInterface.admin = admin.is(':checked');
    }
    
    function onQueryChange() {
        thisInterface.query = query.is(':checked');
    }    
    
    function onPortChanged() {
        thisInterface.port = portInput.val();
    }
    
    function onDeleteClick() {
        var index = server.interfaces.indexOf(thisInterface);
        server.interfaces.splice(index, 1);
        containerDiv.remove();
        return false;
    }
    
    constructor();
}

InterfaceEditorWidget.count = 0;