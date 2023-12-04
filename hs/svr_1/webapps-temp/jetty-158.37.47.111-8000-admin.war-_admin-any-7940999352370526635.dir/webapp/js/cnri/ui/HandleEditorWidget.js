function HandleEditorWidget(containerDiv, handleRecord, client, NA, isDisabled) {
	var self = this;
	var sortSelect = null;
	var handleTitle = null;
	var needToSave = false;
	
	var addValueSelect = null;
	var saveButton = null;
	var deleteButton = null;
	var signatureButton = null;
	var verifyButton = null;
	var toolBar = null;
	var valuesContainerDiv = null;
	var valueEditors = [];
	var isCreateInitiatedByHuman = false;
	var proxyUrl = null;
	var signatureDialog = null;
	
	function constructor() {
	    var closeButton = $('<button class="btn btn-sm btn-default pull-right">Close</button>');
	    containerDiv.append(closeButton);
	    closeButton.click(onCloseClick);

	    handleTitle = $('<h4/>').text(handleRecord.handle);
	    containerDiv.append(handleTitle);

	    proxyUrl = "http://hdl.handle.net/" + encodeURIPath(handleRecord.handle);
	    var proxyLink = $('<a/>').attr('href', proxyUrl).text(proxyUrl).attr('target', '_blank');
	    containerDiv.append(proxyLink);

	    var authProxyUrl = proxyUrl + "?auth";
	    var authProxyLink = $('<a/>').attr('href', authProxyUrl).text('bypass proxy cache').attr('target', '_blank');
	    var authProxySpan = $('<span/>').append('(').append(authProxyLink).append(')');
	    authProxySpan.css('font-style', 'italic').css('font-size', 'smaller');
	    containerDiv.append(' &nbsp; ').append(authProxySpan);

	    toolBar = $('<form class="form-inline" role="form" style="margin-bottom: 5px;"></form>');
	    toolBar.submit(function(e) {return false;}); 
	    containerDiv.append(toolBar);
	    createAddValueSelect();
	    createSaveButton();
	    createDeleteButtonButton();
	    createRefreshButton();
	    createSortMenu();
	    createCollapseButton();
	    createQrCodeButton();
	    createSignatureButton();
	    createVerifyButton();

	    valuesContainerDiv = $('<ol id="selectable">');
	    //valuesContainerDiv.selectable(); //uncomment and include jqueryUI enable selection of handle values

	    containerDiv.append(valuesContainerDiv);
	    createValueEditors();

	    if (isDisabled) {
	        disable();
	    }

	    amplify.subscribe(HandleEvents.HANDLE_MODEL_CHANGED, onHandleModelChanged); //Used to indicate that the entire UI needs to have a complete redraw
	}
	
	function indicateNeedToSave(newNeedToSave) {
	    needToSave = newNeedToSave;
	    if (needToSave) {
	        handleTitle.text("* " + handleRecord.handle);
	        clearAllVerificationStatus();
	        resetSortSelect();
	    } else {
	        handleTitle.text(handleRecord.handle);
	    } 
	}
	self.indicateNeedToSave = indicateNeedToSave;
	
	function isNeedToSave() {
	    return needToSave;
	}
	self.isNeedToSave = isNeedToSave;
	
	function clearAllVerificationStatus() {
	    $.each(valueEditors, function (_, valueEditor) { valueEditor.clearVerificationStatus(); });
	}
	
	function onHandleModelChanged() {
	    rebuildAllValueEditors();
	} 
	
	function rebuildAllValueEditors() {
	    valuesContainerDiv.empty();
	    createValueEditors();
	}
	
	function encodeURIPath(path) {
	    return encodeURIComponent(path).replace(/%2F/gi, '/');
	}
	
    function onCloseClick() {
        hide();
    }
    
    function show() {
        containerDiv.show();
    }
    self.show = show;
    
    function hide() {
        containerDiv.hide();
    }
    self.hide = hide;
	
    function createAddValueSelect() {
        addValueSelect = $('<select style="width: 70px;" class="selectpicker"></select>');
        toolBar.append(addValueSelect);
        toolBar.append(" ");
        
        var createNewPlaceHolder = $('<option>Create new value</option>');
        addValueSelect.append(createNewPlaceHolder);
        
        var urlItem = $('<option>URL</option>');
        addValueSelect.append(urlItem); 

        var emailItem = $('<option>EMAIL</option>');
        addValueSelect.append(emailItem);
        
        var hsAdminItem = $('<option>HS_ADMIN</option>');
        addValueSelect.append(hsAdminItem);
        
        var pubkeyItem = $('<option>HS_PUBKEY</option>');
        addValueSelect.append(pubkeyItem);     
        
        var siteItem = $('<option>HS_SITE</option>');
        addValueSelect.append(siteItem);     
        
        var vlistItem = $('<option>HS_VLIST</option>');
        addValueSelect.append(vlistItem);   
        
        var blankTypeItem = $('<option>Other</option>');
        addValueSelect.append(blankTypeItem);
        
        addValueSelect.selectpicker({
            style : "btn-sm btn-default"
        });
        addValueSelect.change(onAddValueChange);
    }	
    
    function onAddValueChange() {
        var addValue = addValueSelect.val();
        if (addValue === 'Create new value') return;
        isCreateInitiatedByHuman = true;
        if (addValue === "HS_ADMIN") {
            onCreateHsAdminValueClick();
        } else if (addValue === "URL") {
            onCreateUrlValueClick();
        } else if (addValue === "EMAIL") {
            onCreateEmailValueClick();
        } else if (addValue === "HS_VLIST") {
            onCreateVlistValueClick();
        } else if (addValue === "HS_SITE") {
            onCreateSiteValueClick();
        } else if (addValue === "HS_PUBKEY") {
            onCreatePubKeyValueClick();
        } else if (addValue === "Other") {
            onCreateBlankValueClick();
        }
        setTimeout(function () { addValueSelect.selectpicker('val', "Create new value"); }, 1);
        return false;
    }    
    
	
	function createSaveButton() {
		saveButton = $('<button class="btn btn-sm btn-success saveHandleButton" data-loading-text="Wait...">Save handle</button>');
		toolBar.append(saveButton);
		saveButton.click(onSaveButtonClick);
		toolBar.append(" ");
	}
	
	function createCollapseButton() {
	    var collapseAllButton = $('<button class="btn btn-sm btn-default">Collapse all</button>');
	    toolBar.append(collapseAllButton);
	    collapseAllButton.click(onCollapseAllButtonClick);
	    toolBar.append(" ");
	}
	
	function createQrCodeButton() {
	    var qrCodeButton = $('<button class="btn btn-sm btn-default">QR Code</button>');
	    toolBar.append(qrCodeButton);
	    qrCodeButton.click(onQrCodeButtonClick);
	    toolBar.append(" ");
	}
	
	function createSignatureButton() {
	    signatureButton = $('<button class="btn btn-sm btn-default">Sign</button>');
	    toolBar.append(signatureButton);
	    signatureButton.click(onSignatureButtonClick);
	    toolBar.append(" ");
	}
	
    function createVerifyButton() {
        verifyButton = $('<button class="btn btn-sm btn-default" data-loading-text="Wait...">Verify</button>');
        toolBar.append(verifyButton);
        verifyButton.click(onVerifyButtonClick);
        toolBar.append(" ");
    }	
	
	function createDeleteButtonButton() {
		deleteButton = $('<button class="btn btn-sm btn-danger deleteHandleButton" data-loading-text="Wait...">Delete handle</button>');
		toolBar.append(deleteButton);
		deleteButton.click(onDeleteButtonClick);
		toolBar.append(" ");
	}
	
	function createRefreshButton() {
		var refreshButton = $('<button class="btn btn-sm btn-default">Refresh</button>');
		toolBar.append(refreshButton);
		refreshButton.click(onRefreshButtonClick);
		toolBar.append(" ");
	}	
	
	function createSortMenu() {
	    sortSelect = $('<select style="width: 70px;" class="selectpicker" data-width="130px"></select>');
	    toolBar.append(sortSelect);
	    
	    var byNoneOption = $('<option>Sort by none</option>');
	    sortSelect.append(byNoneOption);
	    
	    var byIndexOption = $('<option>Sort by index</option>');
	    sortSelect.append(byIndexOption); 

	    var byTypeOption = $('<option>Sort by type</option>');
	    sortSelect.append(byTypeOption);
	    sortSelect.selectpicker({
	        style : "btn-sm btn-default"
	    });
	    sortSelect.change(onSortByChange);
	    toolBar.append(" ");
	}
	
	function onSortByChange() {
	    var sortBy = sortSelect.val();
	    if (sortBy === "Sort by none") return;
	    if (sortBy === "Sort by index") {
	        handleRecord.values.sort(cnri.util.HandleUtil.indexComparator);
	    } else {
	        handleRecord.values.sort(cnri.util.HandleUtil.typeComparator);
	    }
	    reorderValueEditorDivsToMatchValuesOrder();
	    return false;
	}
	
	function resetSortSelect() {
            var sortBy = sortSelect.val();
            if (sortBy === "Sort by none") return;
            if (sortBy === "Sort by index") {
                var indices = handleRecord.values.map(function (val) { return val.index; });
                for (var i = 0; i < indices.length - 1; i++) {
                    if (indices[i] > indices[i+1]) {
                        sortSelect.selectpicker('val', 'Sort by none');
                        return;
                    }
                }
            } else {
                var types = handleRecord.values.map(function (val) { return val.type; });
                for (var i = 0; i < types.length - 1; i++) {
                    if (types[i] > types[i+1]) {
                        sortSelect.selectpicker('val', 'Sort by none');
                        return;
                    }
                }
            }
	}
	
	function reorderValueEditorDivsToMatchValuesOrder() {
	    detachAllEditorDivs();
	    sortValueEditors();
	    $.each(valueEditors, function (_, valueEditor) { 
                var valueEditorDiv = valueEditor.getDiv();
                valuesContainerDiv.append(valueEditorDiv);
	    });
	}
	
	function sortValueEditors() {
	    var indices = handleRecord.values.map(function (val) { return val.index; });
	    valueEditors.sort(function (a,b) { 
	        return indices.indexOf(a.getIndex()) - indices.indexOf(b.getIndex()); 
	    });
	}
	
	function detachAllEditorDivs() {
            $.each(valueEditors, function (_, valueEditor) { 
                var valueEditorDiv = valueEditor.getDiv();
                valueEditorDiv.detach();
            });
	}
	
//	function getSelectedValueEditors() {
//	    var result = [];
//	    for (index in valueEditorsMap) {
//	        var valueEditor = valueEditorsMap[index];
//	        if (valueEditor.isSelected) {
//	            result.push(valueEditor);
//	        }
//	    }
//	    return result;
//	}
	
	function getHandleRecord() {
	    return handleRecord;
	}
	self.getHandleRecord = getHandleRecord;
	
	function compareIndex(a, b) {
	    var aIndex = a.index;
	    var bIndex = b.index;
	    if (aIndex == null || aIndex == undefined) {
	        return -1;
	    } else if (bIndex === null || bIndex == undefined) {
	        return  1;
	    } else if (aIndex > bIndex) {
	        return 1;
	    } else if (aIndex < bIndex) {
	        return -1;
	    } else {
	        return 0;
	    }
	}
	
    function compareType(a, b) {
        var aType = a.type;
        var bType = b.type;
        if (aType == null || aType == undefined) {
            return -1;
        } else if (bType === null || bType == undefined) {
            return  1;
        } else if (aType > bType) {
            return 1;
        } else if (aType < bType) {
            return -1;
        } else {
            return 0;
        }
    }	
    
    function disable() {
        addValueSelect.selectpicker('hide');
        saveButton.hide();
        deleteButton.hide();
        signatureButton.hide();
        $.each(valueEditors, function (_, valueEditor) { valueEditor.disable(); }); 
    }
    self.disable = disable;
    
    function enable() {
        addValueSelect.selectpicker('show');
        saveButton.show();
        deleteButton.show();
        signatureButton.show();
        $.each(valueEditors, function (_, valueEditor) { valueEditor.enable(); }); 
    }
    self.enable = enable;
	
    function onCollapseAllButtonClick(e) {
        e.preventDefault();
        $.each(valueEditors, function (_, valueEditor) { valueEditor.collapse(); }); 
    }
    
    function onQrCodeButtonClick(e) {
        e.preventDefault();
        var qrCodeDialog = new ModalQrCodeDialog(proxyUrl);
        qrCodeDialog.show();
    } 
    
    function onSignatureButtonClick(e) {
        e.preventDefault();
        if (signatureDialog == null) {
            signatureDialog = new CreateHandleSignatureDialog(handleRecord);
        } else {
            signatureDialog.reset();
        }
        signatureDialog.show();
    }
    
    function onVerifyButtonClick(e) {
        e.preventDefault();
        app.notifications.clear();
        verifyButton.button("loading");
        var verifier = new cnri.hdl.util.HandleSignatureVerifier(client, handleRecord);
        verifier.verify(onGotVerificationResults);
    }
    
    function getValueEditorForIndex(index) {
        for (var i = 0; i < valueEditors.length; i++) {
            var valueEditor = valueEditors[i];
            if (valueEditor.getIndex() === index) return valueEditor;
        }
        return undefined;
    }
    
    function onGotVerificationResults(verificationResults) {
        console.log(JSON.stringify(verificationResults));
        for (var i = 0; i < handleRecord.values.length; i++) {
            var value = handleRecord.values[i];
            var valueEditor = getValueEditorForIndex(value.index);
            var valueVerificationResult = verificationResults.signedValuesResults[value.index];
            valueEditor.updateVerificationStatus(valueVerificationResult);
        }
        var numberOfSignatureErrors = Object.keys(verificationResults.signatureErrors).length;
        if (numberOfSignatureErrors !== 0 || verificationResults.errorMessage) {
            var signatureErrorsDiv = $("<div></div>");
            if (verificationResults.errorMessage) {
                var errorMessage = $('<label></label>');
                errorMessage.text("Error verifying: " + verificationResults.errorMessage);
                signatureErrorsDiv.append(errorMessage).append($('</br>'));
            }
            for (var index in verificationResults.signatureErrors) {
                var signatureErrors = verificationResults.signatureErrors[index];
                if (signatureErrors.payloadError == true) {
                    var errorMessage = $('<label></label>');
                    errorMessage.text("Signature at index: " + index + " had an payload error.");
                    signatureErrorsDiv.append(errorMessage).append($('</br>'));
                } else if (signatureErrors.signatureNotOfCurrentHandleRecord == true) {
                    var errorMessage = $('<label></label>');
                    errorMessage.text("Signature at index: " + index + " does not refer to the current handle record.");
                    signatureErrorsDiv.append(errorMessage).append($('</br>'));
                } else {
                    var numberMissingHandleValues = Object.keys(signatureErrors.missingHandleValues).length;
                    if (numberMissingHandleValues > 0) {
                        for (var missingIndex in signatureErrors.missingHandleValues) {
                            var errorMessage = $('<label></label>');
                            errorMessage.text("Signature at index: " + index + " refers to a missing handle value at index: " + missingIndex);
                            signatureErrorsDiv.append(errorMessage).append($('</br>'));
                        }
                    }
                }
            }
            app.notifications.alertErrorDiv(signatureErrorsDiv);
        }
        verifyButton.button("reset");
    }
    
	function onSaveButtonClick(e) {
	    e.preventDefault();
	    amplify.publish(HandleEditorWidget.HANDLE_SAVE_CLICKED);
	    client.put(handleRecord, onSaveHandleSuccess, onSaveHandleError);
	    saveButton.button("loading");
	} 
	
	function onSaveHandleSuccess(response) {
		amplify.publish(HandleEvents.HANDLE_SAVED_SUCCESS, response.handle);
		refreshHandleValueSummaries();
		saveButton.button("reset");
		indicateNeedToSave(false);
	}
	
	function refreshHandleValueSummaries() {
	    $.each(valueEditors, function (_, valueEditor) { valueEditor.refreshSummary(); }); 
	}
	
	function onSaveHandleError(error) {
	    amplify.publish(HandleEvents.HANDLE_SAVED_ERROR, error);
	    saveButton.button("reset");
	}
	
	function onDeleteButtonClick(e) {
	    e.preventDefault();
	    var msg = "Are you sure you want to delete handle " + handleRecord.handle + "? This operation cannot be undone.";
		var yesNoDialog = new ModalYesNoDialog(msg , onDeleteConfirm, onDeleteCancel, self);
	    yesNoDialog.show();
	    deleteButton.button("loading");
	}
	
	function onDeleteConfirm() {
	    client.del(handleRecord.handle, onDeleteHandleSuccess, onDeleteHandleError);
	}
	
    function onDeleteCancel() {
        deleteButton.button("reset");
    }	
	
	function onDeleteHandleSuccess(response) {
		containerDiv.empty();
		amplify.publish(HandleEvents.HANDLE_DELETED_SUCCESS, response.handle);
		deleteButton.button("reset");
		return false;
	}
	
	function onDeleteHandleError(error) {
        amplify.publish(HandleEvents.HANDLE_DELETED_ERROR, error);
        deleteButton.button("reset");
	}
	
	function onRefreshButtonClick(e) {
	    e.preventDefault();
		amplify.publish(HandleEvents.HANDLE_LOOKUP_REQUESTED, handleRecord.handle);
	}
	
	function onCreateHsAdminValueClick() {
	    //TODO consider what ideal default values could be
	    var hsAdminValue = 	{
				"index": cnri.util.HandleUtil.getNextAvailableIndex(handleRecord, 100),
				"type": "HS_ADMIN",
				"data":{
					"format": "admin",
				    "value":{
				    	"handle": NA,
				        "index": 200,
				        "permissions": "011111111111"
				    }
				}
			};
	    handleRecord.values.unshift(hsAdminValue);
		createValueEditorFor(hsAdminValue, false);
	}
	
	function onCreateUrlValueClick() {
		var urlHandleValue = {
			"index": cnri.util.HandleUtil.getNextAvailableIndex(handleRecord),
		    "type": "URL",
		    "data": "http://www.example.com"
		};
		handleRecord.values.unshift(urlHandleValue);
		createValueEditorFor(urlHandleValue, false);
		return false;
	}
	
	function onCreateEmailValueClick() {
		var emailHandleValue = {
				"index": cnri.util.HandleUtil.getNextAvailableIndex(handleRecord),
				"type": "EMAIL",
				"data": "email@example.com"
		};
		handleRecord.values.unshift(emailHandleValue);
		createValueEditorFor(emailHandleValue, false);	
		return false;
	}
	
        function onCreatePubKeyValueClick() {
            var pubKeyHandleValue = {
                     "index": cnri.util.HandleUtil.getNextAvailableIndex(handleRecord, 300),
                     "type": "HS_PUBKEY",
                     "data": {
                         format: "key",
                         value : {
                             "kty": "RSA",
                             "n": "",
                             "e": "AQAB"
                         }
                     }
             };
             handleRecord.values.unshift(pubKeyHandleValue);
             createValueEditorFor(pubKeyHandleValue, false); 
             return false;
        }

        function onCreateBlankValueClick() {
	       var blankHandleValue = {
	                "index": cnri.util.HandleUtil.getNextAvailableIndex(handleRecord),
	                "type": "",
	                "data": {
	                    format: "string",
	                    value : ""
	                }
	        };
	        handleRecord.values.unshift(blankHandleValue);
	        createValueEditorFor(blankHandleValue, false); 
	        return false;
	}
	
	function onCreateVlistValueClick() {
		var vlistHandleValue = {
			"index": cnri.util.HandleUtil.getNextAvailableIndex(handleRecord, 200),
		    "type": "HS_VLIST",
		    "data": {
		    	"format": "vlist",
			    "value": []
			}
		};
		handleRecord.values.unshift(vlistHandleValue);
		createValueEditorFor(vlistHandleValue, false);
		return false;
	}	
	
	function onCreateSiteValueClick() {
	    var siteHandleValue = {
	            index: cnri.util.HandleUtil.getNextAvailableIndex(handleRecord),
	            type: "HS_SITE",
	            data : {
	                "format": "site",
	                "value": {
	                    "version": 1,
	                    "protocolVersion": "2.10",
	                    "serialNumber": 1,
	                    "primarySite": true,
	                    "multiPrimary": false,
	                    "attributes": [],
	                    "servers": []
	                }
	            }
	    };
	    handleRecord.values.unshift(siteHandleValue);
	    createValueEditorFor(siteHandleValue, false);
	    return false;
	}
	
	function createValueEditors() {
	        valueEditors = [];
		for (var i = 0; i < handleRecord.values.length; i++) {
			var handleValue = handleRecord.values[i];
			createValueEditorFor(handleValue, true);
		}
	}
	
	function createValueEditorFor(handleValue, initialCollapse) {
	    //var handleValueDiv = $('<div class="well well-sm"></div>');
	    var handleValueDiv = $('<li class="ui-widget-content well well-sm"></li>');

	    if (isCreateInitiatedByHuman) {
	        valuesContainerDiv.prepend(handleValueDiv);
	        isCreateInitiatedByHuman = false;
	    } else {
	        valuesContainerDiv.append(handleValueDiv);
	    }

	    var handleValueEditorWidget = new HandleValueEditorWidget(handleValueDiv, handleRecord, handleValue, NA, self, initialCollapse);
	    valueEditors.push(handleValueEditorWidget);
	}
	self.createValueEditorFor = createValueEditorFor;
	
//	function removeValueEditorFor(handleValue) {
//	    
//	}
//	self.removeValueEditorFor = removeValueEditorFor;
	
	function removeValueEditor(valueEditor) {
	    valueEditors.splice($.inArray(valueEditor, valueEditors), 1);
	}
	self.removeValueEditor = removeValueEditor;
	
	constructor();
}

HandleEditorWidget.HANDLE_SAVE_CLICKED = "HandleEditorWidget.HANDLE_SAVE_CLICKED";
