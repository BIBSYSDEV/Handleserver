function HandleValueEditorWidget(containerDiv, handleRecord, handleValue, NA, handleEditor, initialCollapse) {
    var self = this;
    var toggleButton = null;
    var toggleButtonIcon = null;
    var isDataDivHidden = false;
    var dataEditorWidget = null;    
    var verificationStatusWidget = null;
    var typeInput = null;
    var summarySpan = null;
    var deleteButton = null;
    var form = null;
    var typeInputComboBox = null;
    var typeLabel = null;
    var typeLabelValue = null;
    var indexLabelValue = null;
    var indexInput = null;
    
    function constructor() {
        
        containerDiv.addClass("handleValueEditor");
        form = $('<form class="form-inline handleValueEditorShortForm" style="overflow-x:hidden; overflow-y: visible; text-overflow: ellipsis; white-space: nowrap; line-height: 30px;"></form>');
        form.submit(function(e) { return false; }); 
        containerDiv.append(form);

        toggleButton = $('<button type="button" class="btn btn btn-sm btn-default active toggle-button" data-toggle="button"></button>');
        toggleButton.click(onToggleButtonClick);
        form.append(toggleButton);
        form.append(" ");
        toggleButtonIcon = $('<span class="glyphicon glyphicon-chevron-down"></span>');
        toggleButton.append(toggleButtonIcon);
        
        deleteButton = $('<button type="button" class="btn btn-sm btn-danger">Delete</button>');
        form.append(deleteButton);
        form.append(" ");
        deleteButton.click(onDeleteButtonClicked).append(" ");
        
        typeLabel = $('<label></label>');
        typeLabel.text("Type:");
        form.append(typeLabel).append(" ");

        typeLabelValue = $('<label style="display:inline-block; min-width:170px"></label>');
        typeLabelValue.text(handleValue.type);
        form.append(typeLabelValue);
        typeLabelValue.hide();

        buildValueTypeSelect(form);

        var indexLabel = $('<label style="margin-left: 10px;"></label>').text('Index:');
        form.append(indexLabel).append(" ");
        
        indexLabelValue = $('<label style="display:inline-block; min-width:4em"></label>');
        indexLabelValue.text(handleValue.index);
        indexLabelValue.hide();
        form.append(indexLabelValue);
        
        indexInput = $('<input type="text" class="form-control input-sm index-input"/>').val(handleValue.index);
        indexInput.change(onIndexInputChanged);
        form.append(indexInput);
        
        summarySpan = $('<div style="margin-left:15px; display:inline; overflow: hidden; line-height: 30px;"></div>');
        form.append(summarySpan);
        refreshSummary();
        
        var verificationStatusDiv = $('<div></div>');
        containerDiv.append(verificationStatusDiv);
        self.verificationStatusDiv = verificationStatusDiv;
        verificationStatusWidget = new VerificationStatusWidget(verificationStatusDiv, null);
        
        var dataDiv = $('<div></div>');
        containerDiv.append(dataDiv);
        self.dataDiv = dataDiv;
        dataEditorWidget = new DataEditorWidget(dataDiv, handleValue, NA);
        if (initialCollapse === true) {
            collapse();
        }
        
        amplify.subscribe(HandleEditorWidget.HANDLE_SAVE_CLICKED,dataEditorWidget.onHandleSaveClick);
    }
    
    function refreshSummary() {
        summarySpan.empty();
        var summary = cnri.hdl.util.HandleValueSummary.toString(handleValue);
        if (handleValue.type === "URL") {
            var link = $('<a>').attr('href', getStringDataFromHandleValue(handleValue)).attr('target', '_blank');
            link.text(handleValue.data.value);
            summarySpan.append(link);
        } else {
            summarySpan.text(summary);
        }
        
    }
    self.refreshSummary = refreshSummary;
    
    function getStringDataFromHandleValue(handleValue) {
        if (typeof handleValue.data === 'string') return handleValue.data;
        else return handleValue.data.value;
    }
    
    function buildValueTypeSelect(form) {
        typeInput = $('<input class="form-control input-sm" style="width:150px;" type="text"></input>');
        form.append(typeInput);
        typeInputComboBox = new cnri.ui.ComboBox(typeInput, ['URL','EMAIL','HS_ADMIN','HS_SITE','HS_VLIST']);
        typeInput.val(handleValue.type);
        typeInput.change(onTypeInputChanged);
    }

    function onTypeInputChanged(e) {
        var type = typeInput.val();
        handleValue.type = type;
        typeLabelValue.text(type);
        dataEditorWidget.onTypeInputChanged(type); 
    }
    
    function onIndexInputChanged(e) {
        var index = parseInt(indexInput.val(), 10);
        if (index === handleValue.index) {
            indexInput.val(index);
            return;
        }
        if (isNaN(index) || cnri.util.HandleUtil.containsIndex(handleRecord, index)) {
            index = handleValue.index;
            indexInput.val(index);
            return;
        }
        handleValue.index = index;
        indexInput.val(index);
        indexLabelValue.text(index);
    }
    
    function onToggleButtonClick(e) {
        $(this).css("outline", "none");
        if (isDataDivHidden) {
            self.dataDiv.show();
            isDataDivHidden = false;
            toggleButtonIcon.removeClass("glyphicon-chevron-right");
            toggleButtonIcon.addClass("glyphicon-chevron-down");
        } else {
            self.dataDiv.hide();
            isDataDivHidden = true;
            toggleButtonIcon.removeClass("glyphicon-chevron-down");
            toggleButtonIcon.addClass("glyphicon-chevron-right");
        }
    }
    
    function isSelected() {
        return containerDiv.hasClass("ui-selected");
    }
    self.isSelected = isSelected;
    
    function collapse() {
        self.dataDiv.hide();
        isDataDivHidden = true;
        toggleButtonIcon.removeClass("glyphicon-chevron-down");
        toggleButtonIcon.addClass("glyphicon-chevron-right");
        toggleButton.removeClass("active");
    }
    self.collapse = collapse;
    
    function disable() {
        form.find("*").not(".toggle-button").prop('disabled', true);
        self.dataDiv.find("*").not(".do-not-disable").prop('disabled', true);
        deleteButton.hide();
        typeInputComboBox.hide();
        typeLabelValue.css("display", "inline-block");
        indexInput.hide();
        indexLabelValue.css('display', 'inline-block');
    }
    self.disable = disable;
    
    function enable() {
        form.find("*").not(".toggle-button").prop('disabled', false);
        self.dataDiv.find("*").prop('disabled', false);
        deleteButton.show();
        typeInputComboBox.show();
        typeLabelValue.hide();
        indexInput.show();
        indexLabelValue.hide();
    }
    self.enable = enable;
    
    function updateVerificationStatus(verificationStatus) {
        verificationStatusWidget.updateStatus(verificationStatus);
    }
    self.updateVerificationStatus = updateVerificationStatus;
    
    function clearVerificationStatus() {
        verificationStatusWidget.clear();
    }
    self.clearVerificationStatus = clearVerificationStatus;

    function onDeleteButtonClicked() {
        amplify.unsubscribe(HandleEditorWidget.HANDLE_SAVE_CLICKED, dataEditorWidget.onHandleSaveClick);
        removeHandleValueFromValues();
        containerDiv.remove();
        handleEditor.removeValueEditor(self);
        return false;
    }

    function removeHandleValueFromValues() {
        var index = handleRecord.values.indexOf(handleValue);
        handleRecord.values.splice(index, 1);
    }
    
    function getIndex() {
        return handleValue.index;
    }
    self.getIndex = getIndex;
    
    function getDiv() {
        return containerDiv;
    }
    self.getDiv = getDiv;

    constructor();
}