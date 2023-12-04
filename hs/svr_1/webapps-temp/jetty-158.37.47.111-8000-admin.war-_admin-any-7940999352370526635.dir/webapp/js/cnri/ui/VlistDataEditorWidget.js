function VlistDataEditorWidget(containerDiv, handleValue) {
	var self = this;
	var widgetId = null;
	
	var indexInput = null;
	var handleInput = null;
	var addButton = null;
	
	function constructor() {
		widgetId = VlistDataEditorWidget.count++;
		buildAddVlistEntryWidget();
		buildVlistWidgets();
	}
	
	function buildAddVlistEntryWidget() {
		var vlistEntryDiv = $('<div></div>');
		containerDiv.append(vlistEntryDiv);
		var form = $('<form class="form-inline" role="form"></form>');
		form.submit(function(e) {return false;}); 
		vlistEntryDiv.append(form);
		indexInput = $('<input type="text" class="form-control input-sm vlistIndex index-input" placeholder="Index">');
		indexInput.on('input', onInputChanged);
		form.append(indexInput);
		form.append(" : ");
		handleInput = $('<input type="text" class="form-control input-sm vlistHandle" placeholder="Handle">');
		handleInput.on('input', onInputChanged);
		form.append(handleInput);
		form.append(" ");
		addButton = $('<button type="submit" class="btn btn-sm btn-default" disabled="disabled">Add</button>');
		form.append(addButton);
		addButton.click(onAddClick);
	}
	
	function onInputChanged() {
		var indexVal = indexInput.val();
		var handleVal = handleInput.val();
		if (indexVal !== "" && handleVal !== "") {
			addButton.prop("disabled", false);
		} else {
			addButton.prop("disabled", true);
		}
	}
	
	function onAddClick() {
		var newVlistEntry = {
				index :  indexInput.val(),
				handle : handleInput.val()
		};
		handleValue.data.value.push(newVlistEntry);
		var vlistEntryDiv = $('<div></div>');
		containerDiv.append(vlistEntryDiv);
		var vlistEntryWidget = new VlistEntryWidget(vlistEntryDiv, newVlistEntry, handleValue.data.value);
		indexInput.val("");
		handleInput.val("");
		addButton.prop("disabled", true);
		return false;
	}
	
	function buildVlistWidgets() {
		for (var i = 0; i < handleValue.data.value.length; i++) {
			var vlistEntry = handleValue.data.value[i];
			var vlistEntryDiv = $('<div></div>');
			containerDiv.append(vlistEntryDiv);
			var vlistEntryWidget = new VlistEntryWidget(vlistEntryDiv, vlistEntry, handleValue.data.value);
		}
	}
	
	constructor();
}

VlistDataEditorWidget.count = 0;