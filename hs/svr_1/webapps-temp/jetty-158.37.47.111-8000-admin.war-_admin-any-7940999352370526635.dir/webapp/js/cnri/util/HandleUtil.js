(function () {
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var HandleUtil = cnri.util.HandleUtil = {};

HandleUtil.indexComparator = function (a, b) {
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
};

HandleUtil.typeComparator = function (a, b) {
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
};

HandleUtil.getNextAvailableIndex = function (handleRecord, start) { 
    if (!start) start = 1;
    var res = start;
    var indices = handleRecord.values.map(function (value) { return value.index; });
    indices = indices.sort(function (a,b) { return a - b; }); // JavaScript sort is lexicographic by default, even for numbers
    for (var i = 0; i < indices.length; i++) {
        if (res > indices[i]) continue;
        else if (res === indices[i]) res++;
        else /* if (res < indices[i]) */ return res;
    }
    return res;
};

HandleUtil.containsIndex = function (handleRecord, index) { 
    for (var i = 0; i < handleRecord.values.length; i++) {
        if (handleRecord.values[i].index === index) return true;
    }
    return false;
};

HandleUtil.deleteHandleValueAtIndex = function (handleRecord, index) {
    var handleValue = HandleUtil.getHandleValueAtIndex(handleRecord, index);
    var arrayIndex = handleRecord.values.indexOf(handleValue);
    handleRecord.values.splice(arrayIndex, 1);
}; 

HandleUtil.getHandleValueAtIndex = function (handleRecord, index) {
    for (var i = 0; i < handleRecord.values.length; i++) {
        var handleValue = handleRecord.values[i];
        if (handleValue.index === index) {
            return handleValue;
        }
    }
    return null;
};

HandleUtil.getHandleValuesByType = function (handleRecord, type) {
    var handleValues = new Array();
    for (var i = 0; i < handleRecord.values.length; i++) {
        var handleValue = handleRecord.values[i];
        if (handleValue.type === type) {
            handleValues.push(handleValue);
        }
    }
    return handleValues;
};

HandleUtil.getFirstHandleValueOfType = function (handleRecord, type) {
    for (var i = 0; i < handleRecord.values.length; i++) {
        var handleValue = handleRecord.values[i];
        if (handleValue.type === type) {
            return handleValue;
        }
    }
    return null;
};

HandleUtil.publicKeyFromHandleValue = function (handleValue) {
    return HandleUtil.publicKeyFromData(handleValue.data);
};
    
HandleUtil.publicKeyFromData = function (data) {
    if ("key" === data.format) {
        return data.value;
    } else if ("base64" === data.format) {
        var publicKeyBase64String = data.value;
        var publicKeyBytes = cnri.util.Encoder.Base64.bytes(publicKeyBase64String);
        var publicKey = cnri.util.EncryptionUtil.getPublicKeyFromBytes(publicKeyBytes, 0);
        return publicKey;
    } else {
        throw { name : "HandleError", message : "Unexpected format for public key " + data.format };
    }
};

/*end*/})();