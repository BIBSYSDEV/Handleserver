function EmailDataEditorWidget(containerDiv, handleValue) {
	var self = this;
	var emailInput = null;
	var widgetId = null;
	
	function constructor() {
	    widgetId = EmailDataEditorWidget.count++;
		var form = $('<form class="form-horizontal"></form>');
		form.submit(function(e) {return false;}); 
		containerDiv.append(form);
		emailInput = self.addTextInput(form, "EMAIL", "inputEmail-"+widgetId, handleValue.data.value, onEmailInputValueChange);
	}
	
    function isObject(o) { return Object.prototype.toString.call(o) == '[object Object]'; }
    function isArray(o) { return Object.prototype.toString.call(o) == '[object Array]'; }
    function isBoolean(o) { return Object.prototype.toString.call(o) == '[object Boolean]'; }
    function isNumber(o) { return Object.prototype.toString.call(o) == '[object Number]'; }
    function isString(o) { return Object.prototype.toString.call(o) == '[object String]'; }
	
	function onEmailInputValueChange(e) {
        if (isObject(handleValue.data.value) || isArray(handleValue.data.value)) {
            handleValue.data.value = JSON.parse(emailInput.val());
        } else {
            handleValue.data.value = emailInput.val();
        }
	}
	
//	function addTextInput(form, labelText, inputId, value, changeCallback) {
//	    var valueString = "";
//	    if (isObject(value) || isArray(value)) {
//	        valueString = JSON.stringify(value);
//	    } else {
//	        valueString = value;
//	    }
//        var controlGroupDiv = $('<div class="form-group"></div>'); 
//        form.append(controlGroupDiv);
//        var label = $('<label class="col-sm-2 control-label"></label>').attr('for', inputId).text(labelText);
//        controlGroupDiv.append(label);
//        var controlsDiv = $('<div class="col-sm-3"></div>');
//        controlGroupDiv.append(controlsDiv);
//        var input = $('<input type="text" class="form-control input-sm">').attr('id', inputId);
//		input.val(valueString);
//		controlsDiv.append(input);
//		input.change(changeCallback);
//		return input;
//	}
	
    function addTextInput(form, labelText, inputId, value, changeCallback) {
        var valueString = "";
        if (isObject(value) || isArray(value)) {
            valueString = JSON.stringify(value);
        } else {
            valueString = value;
        }
        var controlGroupDiv = $('<div class=""></div>'); 
        form.append(controlGroupDiv);
//        var label = $('<label class="control-label"></label>').attr('for', inputId);
//        label.text(labelText);
//        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="controls"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<input type="text" class="form-control">').attr('id', inputId).attr('placeholder', labelText);
        input.val(valueString);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }   	
	
	self.addTextInput = addTextInput;	
	
	constructor();
}
EmailDataEditorWidget.count = 0;