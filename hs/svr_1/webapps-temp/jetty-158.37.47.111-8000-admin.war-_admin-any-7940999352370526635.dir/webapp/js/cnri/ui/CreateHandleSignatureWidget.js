function CreateHandleSignatureWidget(containerDiv, handleRecord) {
    var self = this;
    var selectedHandleValues = null;
    
    var signerIndexInput = null;
    var signerHandleInput = null;
    
    var fileReaderDiv = null;
    var privateKeyPassPhraseInput = null;
    var signValuesButton = null;
    var privateKeyBytes = null;
    var privateKey = null;
    var isEncryptedKey = false;
    
    var notifications = null;
    var valueSelectDiv = null;
    
    var oldSignatureHandleValue = null;
    
    function constructor() {
        selectedHandleValues = {};
        var dialogNotificationsDiv = $('<div></div>');
        containerDiv.append(dialogNotificationsDiv);
        notifications = new Notifications(dialogNotificationsDiv); 
        
        valueSelectDiv = $('<div></div>');
        containerDiv.append(valueSelectDiv);
        
        createIdentityKeyInput();
        addTableValues();
        addSignValuesButton();
    }
    
    function reset() {
        //keeps the private key and identity from last time but rebuilds the list of handle values.
        //This lets you reuse the dialog without the user having to enter their details again.
        notifications.clear();
        valueSelectDiv.empty();
        addTableValues();
    }
    self.reset = reset;
    
    function addTableValues() {
        var valueSelectTable = $('<table class="table" style="width:100%;table-layout:fixed"></table>');
        valueSelectDiv.append(valueSelectTable);
        var tbody = $('<tbody></tbody>');
        valueSelectTable.append(tbody);

        for (var i = 0; i < handleRecord.values.length; i++) {
            var handleValue = handleRecord.values[i];
            addTableRowForHandleValue(valueSelectTable, handleValue);
        }
    }
    
    function createIdentityKeyInput() {
        var indexHandleInputForm = $('<form class="form-inline" role="form" style="margin-bottom:5px;"></form>');
        signerIndexInput = $('<input type="text" class="form-control input-sm index-input" placeholder="Index">');
        indexHandleInputForm.append(signerIndexInput);
        indexHandleInputForm.append(" : ");
        signerHandleInput = $('<input type="text" class="form-control input-sm" style="min-width: 150px;" placeholder="Signer Handle">');
        indexHandleInputForm.append(signerHandleInput);
        containerDiv.append(indexHandleInputForm);
        
        var privateKeySelectDiv = $('<div></div>');
       
        containerDiv.append(privateKeySelectDiv);
        
        var privateKeyForm = $('<form class="form-inline" role="form"></form>');
        privateKeySelectDiv.append(privateKeyForm);
        
        var lastUsedIndexHandle = amplify.store("lastAuthIndexHandle");
        if (lastUsedIndexHandle != null && lastUsedIndexHandle != undefined) {
            setIndex(lastUsedIndexHandle.index);
            setHandle(lastUsedIndexHandle.handle);
        }
        
        fileReaderDiv = $('<div style="display: inline;"></div>');
        privateKeyForm.append(fileReaderDiv);
        var fileReader = new ClientSideFileWidget(fileReaderDiv, onPrivateKeySelected, false, "Select private key");
        privateKeyForm.append(" ");
        
        privateKeyPassPhraseInput = $('<input type="password" class="form-control input-sm" style="display:none;" placeholder="Passphrase">');
        privateKeyForm.append(privateKeyPassPhraseInput);
        privateKeyPassPhraseInput.keypress(function(event){
            if(event.keyCode == 13){
                event.preventDefault();
                onSignValuesButtonClick();
            }
        });
        privateKeyForm.append(" ");
        containerDiv.append($('</br>'));
    }
    
    function addSignValuesButton() {
        signValuesButton = $('<button type="button" class="btn btn-sm btn-primary" style="min-width: 130px;" data-loading-text="Signing...">Sign values</button>');
        containerDiv.append(signValuesButton);
        signValuesButton.click(onSignValuesButtonClick);
    }
    
    function onSignValuesButtonClick() {
        signValuesButton.button("loading");
        notifications.clear();
        privateKey = getPrivateKey();
        if (privateKey === null || privateKey === undefined) {
            signValuesButton.button("reset");
            return;
        }
        var valuesArray = []; 
        for (var index in selectedHandleValues){ 
            var handleValue = selectedHandleValues[index];
            valuesArray.push(handleValue);
        }
        oldSignatureHandleValue = signatureHandleValueToReplace();
        var signerHandle = signerHandleInput.val();
        var signerIndex = parseInt(signerIndexInput.val());
        var hashAlg = getHashAlgForPrivateKey(privateKey);
        cnri.util.HandleSignatureUtil.sign(handleRecord.handle, valuesArray, signerHandle, signerIndex, privateKey, hashAlg)
        .then(function (signature) {
            onSignSuccess(signature);
        }).fail(function (response) {
            notifications.alertError("There was an error signing the values. " + response.msg);
            signValuesButton.button("reset");
        });
    }
 
    function onSignSuccess(signature) {
        var signatureHandleValue = {
                "index": null,
                "type": "HS_SIGNATURE",
                "data": {
                    format: "string",
                    value : signature
                }
        };        
        if (oldSignatureHandleValue !== null) {
            signatureHandleValue.index = oldSignatureHandleValue.index;
            cnri.util.HandleUtil.deleteHandleValueAtIndex(handleRecord, oldSignatureHandleValue.index); //Delete the old signature
            handleRecord.values.push(signatureHandleValue);
            oldSignatureHandleValue = null;
        } else {
            handleRecord.values.push(signatureHandleValue);
            signatureHandleValue.index = cnri.util.HandleUtil.getNextAvailableIndex(handleRecord, 400);
        }
        amplify.publish(HandleEvents.HANDLE_MODEL_CHANGED);
        notifications.alertSuccess("Handle signature created successfully.");
        signValuesButton.button("reset");
    }
    
    function getPrivateKey() {
        if (isEncryptedKey) {
            var passPhrase = getPassPhrase();
            if (passPhrase === "") {
                notifications.alertError("The selected private key requires a passphrase to decrypt it.");
                return;
            }
            keyBytes = cnri.util.EncryptionUtil.decrypt(privateKeyBytes, passPhrase);
            if (keyBytes == undefined) {
                notifications.alertError("The selected private key could not be decrypted.");
                return;
            }
        } else {
            keyBytes = privateKeyBytes;
        }
        var key = parsePrivateKeyFile(keyBytes);
        return key;
    }
    
    function getHashAlgForPrivateKey(privateKey) {
        if (privateKey.kty === "DSA") {
            return "SHA-1";
        } else {
            return "SHA-256";
        }
    }
    
    function signatureHandleValueToReplace() {
        var signerHandle = signerHandleInput.val();
        var signerIndex = parseInt(signerIndexInput.val());
        for (var i = 0; i < handleRecord.values.length; i++) {
            var handleValue = handleRecord.values[i];
            if (handleValue.type === "HS_SIGNATURE") {
                var signatureJws = getStringDataFromHandleValue(handleValue);
                var signaturePayload = cnri.util.HandleSignatureUtil.payloadFromJws(signatureJws);
                if (signaturePayload && signaturePayload.iss && signaturePayload.iss === signerIndex + ":" + signerHandle) {
                    return handleValue;
                }
            }
        }
        return null;
    }
    
    function getStringDataFromHandleValue(handleValue) {
        if (typeof handleValue.data === 'string') return handleValue.data;
        else return handleValue.data.value;
    }
    
    function onPrivateKeySelected(keyBytes) {
        notifications.clear();
        isEncryptedKey = false;
        if (cnri.util.EncryptionUtil.requiresSecretKey(keyBytes)) {
            isEncryptedKey = true;
            privateKeyPassPhraseInput.show(400);
        } else {
            privateKeyPassPhraseInput.hide();
        }
        privateKeyBytes = keyBytes;
    }
    
    function parsePrivateKeyFile(keyBytes) {
        var key = null;
        try {
            var offset = 4;
            if (isEncryptedKey) offset = 0;
            key = cnri.util.EncryptionUtil.getPrivateKeyFromBytes(keyBytes, offset);
            notifications.clear();
        } catch (err) {
            notifications.alertError("Selected file could not be parsed as a private key.");
        }
        return key;
    }
    
    function getPassPhrase() {
        return privateKeyPassPhraseInput.val();
    }
    
    function setIndex(index) {
        if (index !== "0") {
            signerIndexInput.val(index);
        } 
    } 
    
    function setHandle(handle) {
        signerHandleInput.val(handle);
    }
    
    function addTableRowForHandleValue(table, handleValue) {
        var tr = $('<tr></tr>');
        table.append(tr);
        
        var checkBox = $('<input type="checkbox" id="checkbox_id" value="value">');
        checkBox.attr('name', handleValue.index);
        checkBox.change(selectValueCheckBoxChangeCallback);
        
        var tdCheckBox = $('<td style="width:10%;"></td>');
        tdCheckBox.append(checkBox);
        tr.append(tdCheckBox);
        
        var valueSummaryText = getLongSummary(handleValue);
        var td = $('<td style="width:90%;"></td>');
        tr.append(td);
        var summaryDiv = $('<div style="overflow:hidden; white-space: nowrap;"></div>');
        summaryDiv.text(valueSummaryText);
        td.append(summaryDiv);
        
        if (handleValue.type === "HS_SIGNATURE") {
            checkBox.attr("checked", false);
        } else {
            checkBox.attr("checked", true);
            selectedHandleValues[handleValue.index + ""] = handleValue;
        }
    }
    
    function getLongSummary(handleValue) {
        var result = "Type: " + handleValue.type + " Index: " + handleValue.index + " "; 
        result += cnri.hdl.util.HandleValueSummary.toString(handleValue);
        return result;
    }
    
    function selectValueCheckBoxChangeCallback(e) {
        checkBox = $(this);
        var index = checkBox.attr('name');
        var isChecked = checkBox.is(':checked');
        console.log("Index: " + index + " " + isChecked);
        var selectedValue = cnri.util.HandleUtil.getHandleValueAtIndex(handleRecord, parseInt(index));
        if (isChecked) {
            selectedHandleValues[index] = selectedValue;
        } else {
            delete selectedHandleValues[index];
        }
    }
    
    constructor();
}