function BlankDataEditorWidget(containerDiv, handleValue) {
    var self = this;
    var dataInput = null;
    var widgetId = null;
    
    function constructor() {
        widgetId = BlankDataEditorWidget.count++;
        var form = $('<form class=""></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
        dataInput = self.addTextInput(form, "Data", "inputData-"+widgetId, handleValue.data.value, onDataInputValueChange);
    }
    
    function isObject(o) { return Object.prototype.toString.call(o) == '[object Object]'; }
    function isArray(o) { return Object.prototype.toString.call(o) == '[object Array]'; }
    function isBoolean(o) { return Object.prototype.toString.call(o) == '[object Boolean]'; }
    function isNumber(o) { return Object.prototype.toString.call(o) == '[object Number]'; }
    function isString(o) { return Object.prototype.toString.call(o) == '[object String]'; }
    
    function onDataInputValueChange(e) {
        updateHandle();
    }

    function updateHandle() {
        handleValue.data.value = dataInput.val();
    }
    
    function addTextInput(form, labelText, inputId, value, changeCallback) {
        var valueString = value;
        var controlGroupDiv = $('<div class=""></div>'); 
        form.append(controlGroupDiv);
//        var label = $('<label class="control-label"></label>').attr('for', inputId);
//        label.text(labelText);
//        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="controls"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<textarea class="form-control">').attr('id', inputId).attr('placeholder', labelText);
        input.val(valueString);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }
    
    self.addTextInput = addTextInput;
    
    constructor();
}
BlankDataEditorWidget.count = 0;