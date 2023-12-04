"use strict";
function DataEditorWidget(containerDiv, handleValue, NA) {
    var self = this;
    
    var originalData = null;
    var originalBytes = null;
    var convertedOriginalData = null;
    var allowedFormats = null;
    var buttonDiv = null;
    var editorDiv = null;
    
    var isShowingAdvanced = false;
    var advancedEditor = null;
    var advancedButton = null;
    
    function constructor() {
        setOriginalData();
        
        //buttonDiv = $('<div style="margin-bottom:0.5em"/>');
        buttonDiv = $('<div/>');
        editorDiv = $('<div/>');
        var advancedDiv = $('<div style="display:none;"><div/>');
        containerDiv.append(editorDiv," ",buttonDiv," ",advancedDiv);
        advancedEditor = new HandleValueAdvancedEditorWidget(advancedDiv, handleValue);
        if (handleValue.type === 'HS_SECKEY') {
            isShowingAdvanced = true;
            advancedEditor.show();
        }
        setUpButtons(handleValue.type);
        createDataEditorFor(handleValue.data.format);
    }
    
    function setOriginalData() {
        if(isString(handleValue.data)) handleValue.data = { format:"string", value:handleValue.data };
        originalData = handleValue.data;
        originalBytes = cnri.util.HsEncoder.Data.bytes(originalData);
        convertedOriginalData = originalData;
        if(originalData.format !== "base64" && originalData.format !== "hex") return;
        if(cnri.util.HsEncoder.Key.looksLikeKey(originalBytes)) {
            convertedOriginalData = { format:"key", value: cnri.util.HsEncoder.Key.json(originalBytes) };
            handleValue.data = convertedOriginalData;
        } else if(cnri.util.HsEncoder.Admin.looksLikeAdmin(originalBytes)) {
            convertedOriginalData = { format:"admin", value: cnri.util.HsEncoder.Admin.json(originalBytes) };
            handleValue.data = convertedOriginalData;
        } else if(cnri.util.HsEncoder.Vlist.looksLikeVlist(originalBytes)) {
            convertedOriginalData = { format:"vlist", value: cnri.util.HsEncoder.Vlist.json(originalBytes) };
            handleValue.data = convertedOriginalData;
        } else if(cnri.util.HsEncoder.Site.looksLikeSite(originalBytes)) {
            convertedOriginalData = { format:"site", value: cnri.util.HsEncoder.Site.json(originalBytes) };
            handleValue.data = convertedOriginalData;
        }
    }
    
    function setUpButtons(type) {
        buttonDiv.empty();
        advancedButton = $('<button type="button" class="btn btn-sm btn-default do-not-disable" data-toggle="button">Advanced</button>'); //TODO consider right justify
        advancedButton.focus(function () { this.blur(); });
        if (isShowingAdvanced) {
            advancedButton.addClass("active");
        }
        buttonDiv.append(advancedButton);
        advancedButton.click(onAdvancedClick); 
        
        allowedFormats = getAllowedFormats(type);
        if(allowedFormats.length>1) {
            buttonDiv.append($('<span style="padding-left:1em"></span>'));
            buttonDiv.append(createFormatButtonGroup());     
        }
    }
    
    function onAdvancedClick() {
        if (isShowingAdvanced) {
            advancedEditor.hide();
            isShowingAdvanced = false;
        } else {
            advancedEditor.show();
            isShowingAdvanced = true;
        }
    }
    
    function onHandleSaveClick() {
        if(originalData===handleValue.data) return;
        setOriginalData();
        setUpButtons(handleValue.type);
    }
    self.onHandleSaveClick = onHandleSaveClick;
    
    function defaultFormatForType(type) {
        if(type==="HS_PUBKEY") return "key";
        if(type==="HS_ADMIN") return "admin";
        if(type==="HS_VLIST") return "vlist";
        if(type==="HS_SITE") return "site";
        if(type==="URL" || type==="EMAIL") return "string";
        return convertedOriginalData.format;
    }
    
    function getAllowedFormats(type) {
        var res = [];
        if(type==="HS_PUBKEY") {
            res.push("key");
            res.push("base64");
        } else if(type==="HS_ADMIN") res.push("admin");
        else if(type==="HS_SITE") res.push("site");
        else if(type==="HS_VLIST") res.push("vlist");
        else if(type==="URL" || type==="EMAIL") res.push("string");
        else {
            res.push("string");
            res.push("base64");
        }
        
        if(res.indexOf(originalData.format)<0) res.push(originalData.format);
        if(res.indexOf(convertedOriginalData.format)<0) res.push(convertedOriginalData.format);
        return res;
    }
    
    function createFormatButtonGroup() {
        var buttonGroup = $('<div class="btn-group"></div>');
        for(var i = 0; i < allowedFormats.length; i++) {
            addFormatButton(buttonGroup,allowedFormats[i]);
        }
        return buttonGroup;
    }

    function addFormatButton(buttonGroup,format) {
        var button = $('<button type="button" class="btn btn-sm btn-default"></button>');
        button.focus(function () { this.blur(); });
        button.text(format);
        if(format===handleValue.data.format) button.addClass('active');
        button.click(function () { $(this).addClass("active").siblings().removeClass("active"); });
        buttonGroup.append(button);
        button.click(function() { onFormatButtonClick(format); });
    }
    
    function refreshFormatButtonsAndEditor(format) {
        refreshEditor(format);
        setUpButtons(handleValue.type);
    }

    function refreshEditor(format) {
        editorDiv.empty();
        handleValue.data = getDataForFormat(format);
        createDataEditorFor(format);
    }
    
    function onTypeInputChanged(type) {
        refreshFormatButtonsAndEditor(defaultFormatForType(handleValue.type));
        if (handleValue.type === 'HS_SECKEY') {
            advancedEditor.setPermission(advancedEditor.PUBLIC_READ, false);
            advancedEditor.show();
            advancedButton.addClass('active');
            isShowingAdvanced = true;
        }
    }
    self.onTypeInputChanged = onTypeInputChanged;
    
    function onFormatButtonClick(format) {
        if(format===handleValue.data.format) return;
        refreshEditor(format);
    }
    
    function getDataForFormat(format) {
        if(format===originalData.format) return originalData;
        if(format===convertedOriginalData.format) return convertedOriginalData;
        if(format==="base64") return { format:format, value : cnri.util.HsEncoder.Base64.json(originalBytes) };
        else if(format==="hex") return { format:format, value : cnri.util.HsEncoder.Hex.json(originalBytes) };
        else if(format==="string") return { format:format, value : cnri.util.HsEncoder.Utf8.json(originalBytes) };
        else return blankDataForFormat(format);
    }
    
    function blankDataForFormat(format) {
        var value = "";
        if(format==="key") {
            value = {
                    "kty": "RSA",
                    "n": "",
                    "e": "AQAB"
            };
        } else if(format==="admin") {
            value = {
                    "handle": NA,
                    "index": 200,
                    "permissions": "011111111111"
                 };
        } else if(format==="vlist") {
            value = [];
        } else if(format==="site") {
            value = {
                    "version": 1,
                    "protocolVersion": "2.10",
                    "serialNumber": 1,
                    "primarySite": true,
                    "multiPrimary": false,
                    "attributes": [],
                    "servers": []
            };
        }
        return {format:format, value:value};
    }
    
    function createDataEditorFor(dataFormat) {
        var dataEditorWidget = null;
        var type = handleValue.type;
        
        var addFileInput = false; 
        if (dataFormat === "key") {
            dataEditorWidget = new KeyDataEditorWidget(editorDiv, handleValue);
            addFileInput = true;
        } else if (dataFormat === "admin") {
            dataEditorWidget = new AdminDataEditorWidget(editorDiv, handleValue);
        } else if (dataFormat === "vlist") {
            dataEditorWidget = new VlistDataEditorWidget(editorDiv, handleValue);
        } else if (dataFormat === "site") {
            dataEditorWidget = new SiteDataEditorWidget(editorDiv, handleValue);
            addFileInput = true;
        } else if (dataFormat === "base64") {
            dataEditorWidget = new BlankDataEditorWidget(editorDiv, handleValue);
            addFileInput = true;
        } else if (dataFormat === "string") {
            if (type === "URL") {
                dataEditorWidget = new UrlDataEditorWidget(editorDiv, handleValue);
            } else if (type === "EMAIL") {
                dataEditorWidget = new EmailDataEditorWidget(editorDiv, handleValue);
            } else {
                dataEditorWidget = new BlankDataEditorWidget(editorDiv, handleValue);
                addFileInput = true;
            }
        } 
        
        if(addFileInput) {
            addFileInputToDiv(editorDiv, dataFormat);
            addFileSaverToDiv(editorDiv, dataFormat);
        }
    }

    function addFileInputToDiv(editorDiv, dataFormat) {
        var fileControlsDiv = $('<div style="display:inline-block"/>');
        new ClientSideFileWidget(fileControlsDiv, function(arr) { onFileRead(arr, dataFormat==='site'); }, false, "Load From File", true);
        editorDiv.prepend(fileControlsDiv);
    }
    
    function addFileSaverToDiv(editorDiv, dataFormat) {
        var saveButton = $('<button class="btn btn-sm btn-default do-not-disable">Save to file</button>');
        editorDiv.prepend(saveButton);
        saveButton.click(function() { onFileSave(dataFormat); });
    }
    
    function onFileSave(dataFormat) {
        var stringToSave = null;
        var fileName = "handlevalue.txt";
        if (dataFormat === 'site') {
            stringToSave = JSON.stringify(handleValue.data.value, null, "  ");
            fileName = "siteinfo.json";
            cnri.util.ClientSideFileSaver.saveAsUtf8String(stringToSave, fileName);
        } else if (dataFormat === 'key') {
            var key = handleValue.data.value;
            var bytes = cnri.util.HsEncoder.Key.bytes(key);
            stringToSave = cnri.util.HsEncoder.Base64.string(bytes);
            fileName = "pubkey.bin";
            cnri.util.ClientSideFileSaver.saveBase64StringAsBinary(stringToSave, fileName);
        } else if (dataFormat === 'base64') {
            stringToSave = handleValue.data.value;
            if (handleValue.type === 'HS_PUBKEY') {
                fileName = "pubkey.bin";
            } else if (handleValue.type === 'HS_SITE') {
                    fileName = "siteinfo.bin";
            } else {
                fileName = "handlevalue.bin";
            }
            cnri.util.ClientSideFileSaver.saveBase64StringAsBinary(stringToSave, fileName);
        } else {
            stringToSave = handleValue.data.value;
            cnri.util.ClientSideFileSaver.saveAsUtf8String(stringToSave, fileName);
        }
    }

    function onFileRead(arr, specialTreatmentForSiteJson) {
        if(cnri.util.HsEncoder.Utf8.looksLikeBinary(arr)) {
            if(cnri.util.HsEncoder.Key.looksLikeKey(arr)) {
                handleValue.data = { format:"key", value: cnri.util.HsEncoder.Key.json(arr) };
            } else if(cnri.util.HsEncoder.Admin.looksLikeAdmin(arr)) {
                handleValue.data = { format:"admin", value: cnri.util.HsEncoder.Admin.json(arr) };
            } else if(cnri.util.HsEncoder.Vlist.looksLikeVlist(arr)) {
                handleValue.data = { format:"vlist", value: cnri.util.HsEncoder.Vlist.json(arr) };
            } else if(cnri.util.HsEncoder.Site.looksLikeSite(arr)) {
                handleValue.data = { format:"site", value: cnri.util.HsEncoder.Site.json(arr) };
            } else {
                handleValue.data = { format:"base64", value: cnri.util.HsEncoder.Base64.json(arr) };
            }
        } else {
            var done = false;
            var text = cnri.util.HsEncoder.Utf8.json(arr);
            if(specialTreatmentForSiteJson) {
                try {
                    var maybeSiteJson = JSON.parse(text);
                    if(isObject(maybeSiteJson) && maybeSiteJson.servers) {
                        handleValue.data = { format:'site', value: maybeSiteJson };
                        done = true;
                    }
                } catch(e) {
                    // ignore
                }
            }
            if(!done) {
                handleValue.data = { format:"string", value: text };
            }
        }
        setOriginalData();
        refreshFormatButtonsAndEditor(handleValue.data.format);
    }
    
    function isObject(o) { return Object.prototype.toString.call(o) == '[object Object]'; }
    function isArray(o) { return Object.prototype.toString.call(o) == '[object Array]'; }
    function isBoolean(o) { return Object.prototype.toString.call(o) == '[object Boolean]'; }
    function isNumber(o) { return Object.prototype.toString.call(o) == '[object Number]'; }
    function isString(o) { return Object.prototype.toString.call(o) == '[object String]'; }
    
    constructor();
}