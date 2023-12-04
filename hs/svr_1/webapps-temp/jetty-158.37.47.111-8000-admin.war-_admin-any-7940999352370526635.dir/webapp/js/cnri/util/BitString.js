(function(window){
"use strict";

window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

function BitString(bitString, isBigEndian) {
    var self = this;
    var bitArray = null;
    
    function constructor() {
        bitArray = parseBitString(bitString);
    }
    
    function parseBitString(bitMask) {
        if (isBigEndian) {
            return parseBitStringBigEndian(bitMask);
        } else {
            return parseBitStringLittleEndian(bitMask);
        }
    }
    
    function parseBitStringLittleEndian(bitMask) {
        var length = bitMask.length;
        var result = new Array();
        for (var i = 0; i < length; i++) {
            var ch = bitMask.charAt(i);
            var boolValue = charToBool(ch);
            result[i] = boolValue;
        }
        return result;
    }
    
    function set(bitString) {
        bitArray = parseBitString(bitString);
    }
    self.set = set;
    
    function setNumber(num) {
        var numAsString = num.toString(2);
        bitArray = parseBitString(numAsString);
        if (!isBigEndian) {
            bitArray.reverse();
        }
    }
    self.setNumber = setNumber;
    
    function parseBitStringBigEndian(bitMask) {
        var length = bitMask.length;
        var arrayIndex = 0;
        var result = new Array();
        for (var i = length-1; i >= 0; i--) {
            var ch = bitMask.charAt(i);
            var boolValue = charToBool(ch);
            result[arrayIndex] = boolValue;
            arrayIndex++;
        }
        return result;
    }
    
    function charToBool(ch) {
        if (ch === "0") {
            return false;
        } else if (ch === null || ch == undefined) {
            return false;
        } else if (ch === "1") {
            return true;
        } else {
            throw { msg : "Invalid boolean char " + ch };
        }
    }
    
    function boolToChar(boolValue) {
        if (boolValue) {
            return "1";
        } else {
            return "0";
        }
    } 
    
    function getBit(index) {
        var boolValue = bitArray[index];
        if (boolValue == undefined) {
            boolValue = false;
        }
        return boolValue;
    }
    self.getBit = getBit;
    
    function setBit(index, boolValue) {
        bitArray[index] = boolValue;
    }
    self.setBit = setBit;
    
    function toString() {
        if (isBigEndian) {
            return toStringBigEndian();
        } else {
            return toStringLittleEndian();
        }
    }
    self.toString = toString;
    
    function toStringLittleEndian() {
        var result = "";
        for (var i = 0; i < bitArray.length; i++) {
            var boolValue = bitArray[i];
            var ch = boolToChar(boolValue);
            result = result + ch;
        }
        return result;
    }
    
    function toStringBigEndian() {
        var result = "";
        for (var i = 0; i < bitArray.length; i++) {
            var boolValue = bitArray[i];
            var ch = boolToChar(boolValue);
            result = ch + result;
        }
        return result;
    }
    
    constructor();
}

cnri.util.BitString = BitString;
/*end*/})(this);