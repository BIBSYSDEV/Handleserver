function AdminDataEditorWidget(containerDiv, handleValue) {
	var self = this;
	
    var widgetId = null;
	var adminHandleInput = null;
	var adminHandleIndexInput = null;
	var permissionInput = null;
	var bitMask = null;
	var ADD_HANDLE         = 0;
    var DELETE_HANDLE      = 1;
    var ADD_NAMING_AUTH    = 2;
    var DELETE_NAMING_AUTH = 3;
    var MODIFY_VALUE       = 4;
    var REMOVE_VALUE       = 5;
    var ADD_VALUE          = 6;
    var MODIFY_ADMIN       = 7;
    var REMOVE_ADMIN       = 8;
    var ADD_ADMIN          = 9;
    var READ_VALUE         = 10;
    var LIST_HANDLES       = 11;
        
	function constructor() {
		widgetId = AdminDataEditorWidget.count++;
		var format = handleValue.data.format;
		if (handleValue.data.value.permissions === "*") {
		    bitMask = new cnri.util.BitString("111111111111", true);
		} else {
		    bitMask = new cnri.util.BitString(handleValue.data.value.permissions, true);
		}
		if (format === "admin") {
			buildAdminEditor(handleValue.data);
		}
	}
	
	function buildAdminEditor(data) {
//		var form = $('<form class="form-horizontal" role="form"></form>');
//		form.submit(function(e) {return false;}); 
//		containerDiv.append(form);
//		adminHandleInput = self.addTextInput(form, "Admin Handle", "inputAdminHandle-"+widgetId, data.value.handle, onAdminHandleValueChange);
//		adminHandleIndexInput = self.addTextInput(form, "Admin Handle Index", "inputAdminHandleIndex-"+widgetId, data.value.index, onAdminHandleIndexValueChange);
		
		var form = $('<form class="form-inline" role="form"></form>');
		form.submit(function(e) {return false;}); 
		containerDiv.append(form);
		adminHandleIndexInput = $('<input type="text" class="form-control input-sm vlistIndex index-input" placeholder="Index">');
		adminHandleIndexInput.val(data.value.index);
		adminHandleIndexInput.on('input', onAdminHandleIndexValueChange);
		form.append(adminHandleIndexInput);
		form.append(" : ");
		adminHandleInput = $('<input type="text" class="form-control input-sm vlistHandle" placeholder="Admin Handle">');
		adminHandleInput.val(data.value.handle);
		adminHandleInput.on('input', onAdminHandleValueChange);
		form.append(adminHandleInput);
		
		
		
		var checkBoxForm = $('<form class="form-horizontal" role="form"></form>');
		checkBoxForm.submit(function(e) {return false;}); 
		containerDiv.append(checkBoxForm);
		buildPermissionsButtons(checkBoxForm);
	}
	
    function buildPermissionsButtons(form) {
        var row = $('<div class="row"></div>');
        form.append(row);
        var buttonGroup = $('<div class="btn-group col-md-12" data-toggle="buttons-checkbox" style="margin-left: 0px;"></div>');
        row.append(buttonGroup);
        
        addToggleButton(buttonGroup, "Create Handle",               bitMask.getBit(ADD_HANDLE),         onPermissionsButtonClicked, {bitPosition : ADD_HANDLE});
        addToggleButton(buttonGroup, "Delete Handle",               bitMask.getBit(DELETE_HANDLE),      onPermissionsButtonClicked, {bitPosition : DELETE_HANDLE});
        addToggleButton(buttonGroup, "Add Derived Prefix",          bitMask.getBit(ADD_NAMING_AUTH),    onPermissionsButtonClicked, {bitPosition : ADD_NAMING_AUTH});
        addToggleButton(buttonGroup, "Delete Derived Prefix",       bitMask.getBit(DELETE_NAMING_AUTH), onPermissionsButtonClicked, {bitPosition : DELETE_NAMING_AUTH});
       
        var buttonGroup2 = $('<div class="btn-group col-md-12" data-toggle="buttons-checkbox" style="margin-left: 0px;"></div>');
        row.append(buttonGroup2);
        addToggleButton(buttonGroup2, "Modify Value",  bitMask.getBit(MODIFY_VALUE),       onPermissionsButtonClicked, {bitPosition : MODIFY_VALUE});
        addToggleButton(buttonGroup2, "Remove Value",  bitMask.getBit(REMOVE_VALUE),       onPermissionsButtonClicked, {bitPosition : REMOVE_VALUE});
        addToggleButton(buttonGroup2, "Add Value",     bitMask.getBit(ADD_VALUE),          onPermissionsButtonClicked, {bitPosition : ADD_VALUE});
        addToggleButton(buttonGroup2, "Modify Admin",  bitMask.getBit(MODIFY_ADMIN),       onPermissionsButtonClicked, {bitPosition : MODIFY_ADMIN});
        
        var buttonGroup3 = $('<div class="btn-group col-md-12" data-toggle="buttons-checkbox" style="margin-left: 0px;"></div>');
        row.append(buttonGroup3);
        addToggleButton(buttonGroup3, "Remove Admin",  bitMask.getBit(REMOVE_ADMIN),       onPermissionsButtonClicked, {bitPosition : REMOVE_ADMIN});
        addToggleButton(buttonGroup3, "Add Admin",     bitMask.getBit(ADD_ADMIN),          onPermissionsButtonClicked, {bitPosition : ADD_ADMIN});
        addToggleButton(buttonGroup3, "Read Value",    bitMask.getBit(READ_VALUE),         onPermissionsButtonClicked, {bitPosition : READ_VALUE});
        addToggleButton(buttonGroup3, "List Handles",  bitMask.getBit(LIST_HANDLES),       onPermissionsButtonClicked, {bitPosition : LIST_HANDLES});
    }
	
    function addToggleButton(buttonGroup, text, isActive, clickCallback, data) {
        var button = $('<button type="button" class="btn btn-sm btn-default admin-permission-button col-md-3" ></button>');
        button.focus(function () { this.blur(); });
        button.text(text);
        if (isActive) {
            button.addClass("active");
        }
        button.click(clickCallback);
        if (data != undefined) {
            button.data("data", data);
        }
        buttonGroup.append(button);
    } 
    
    function onPermissionsButtonClicked(e) {
        var button = $(this);
        var wasActive = button.hasClass("active");
        var value = !wasActive;
        var data = button.data("data");
        if (data != undefined) {
            var bitPosition = data.bitPosition;
            bitMask.setBit(bitPosition, value);
            handleValue.data.value.permissions = bitMask.toString();
        }
    } 
	
	function onAdminHandleValueChange(e) {
		handleValue.data.value.handle = adminHandleInput.val();
	}
	
	function onAdminHandleIndexValueChange(e) {
		handleValue.data.value.index = adminHandleIndexInput.val();
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
	
	self.addTextInput = addTextInput;	
	
	constructor();
}

AdminDataEditorWidget.count = 0;