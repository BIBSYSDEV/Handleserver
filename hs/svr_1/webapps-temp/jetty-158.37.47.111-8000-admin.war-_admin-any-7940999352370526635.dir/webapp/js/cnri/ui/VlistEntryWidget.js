function VlistEntryWidget(container, vListEntry, vListArray) {
	var self = this;
	var indexInput = null;
	var handleInput = null;
	
	function constructor() {
		var form = $('<form class="form-inline" role="form"></form>');
		form.submit(function(e) {return false;}); 
		container.append(form);
		indexInput = $('<input type="text" class="form-control input-sm vlistIndex index-input" placeholder="Index">'); 
		indexInput.val(vListEntry.index);
		indexInput.change(onIndexChanged);
		form.append(indexInput);
		form.append(" : ");
		handleInput = $('<input type="text" class="form-control input-sm vlistHandle" placeholder="Handle">');
		handleInput.val(vListEntry.handle);
		handleInput.change(onHandleChanged);
		form.append(handleInput);
		form.append(" ");
		var deleteButton = $('<button type="submit" class="btn btn-sm btn-danger">Delete</button>');
		form.append(deleteButton);
		deleteButton.click(onDeleteClick);
	}
	
	function onHandleChanged() {
		vListEntry.handle = handleInput.val();
	}
	
	function onIndexChanged() {
		vListEntry.index = indexInput.val();
	}
	
	function onDeleteClick() {
		var index = vListArray.indexOf(vListEntry);
		vListArray.splice(index, 1);
		container.remove();
		return false;
	}
	
	constructor();
}