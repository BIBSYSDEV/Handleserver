(function () {
"use strict";

function isObject(o) { return Object.prototype.toString.call(o) == '[object Object]'; }
function isString(o) { return Object.prototype.toString.call(o) == '[object String]'; }

function KeyDataEditorWidget(containerDiv, handleValue) {
    var self = this;
    
    var widgetId = null;
    var keyInput = null;
        
    function constructor() {
        widgetId = KeyDataEditorWidget.count++;
        var form = $('<form class=""></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
        keyInput = addTextInput(form, "Key", "inputKey-"+widgetId, vkbeautify.json(JSON.stringify(handleValue.data.value)), onKeyInputValueChange);
    }
    
    function addTextInput(form, labelText, inputId, value, changeCallback) {
        var valueString = value;
        var controlGroupDiv = $('<div class=""></div>'); 
        form.append(controlGroupDiv);
        var controlsDiv = $('<div class="controls"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<textarea class="form-control">').attr('id', inputId).attr('placeholder', labelText);
        input.val(valueString);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }

    function onKeyInputValueChange(e) {
        var json;
        try {
            json = JSON.parse(keyInput.val());
        } catch (e) {
            json = undefined;
        }
        if (isObject(json) && isString(json.kty)) {
            handleValue.data.value = json;
        } else {
            keyInput.val(vkbeautify.json(JSON.stringify(handleValue.data.value)));
        }
    }

    constructor();
}
window.KeyDataEditorWidget = KeyDataEditorWidget;

KeyDataEditorWidget.count = 0;

})();