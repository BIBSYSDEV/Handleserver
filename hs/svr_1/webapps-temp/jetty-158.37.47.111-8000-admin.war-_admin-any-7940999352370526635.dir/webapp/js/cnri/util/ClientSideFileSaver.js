(function(){
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var ClientSideFileSaver = cnri.util.ClientSideFileSaver = {};

ClientSideFileSaver.saveAsUtf8String = function (string, fileName) {
    var bytes = cnri.util.Encoder.Utf8.bytes(string);
    var base64String = cnri.util.Encoder.Base64.string(bytes);
    var dataUri = createBinaryDataUri(base64String);
    var link = createLink(dataUri, fileName);
    click(link);
};

ClientSideFileSaver.saveBase64StringAsBinary = function(base64String, fileName) {
    var dataUri = createBinaryDataUri(base64String);
    var link = createLink(dataUri, fileName);
    click(link);
};

function click(node) {
    var ev = document.createEvent("MouseEvents");
    ev.initMouseEvent("click", true, false, self, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    return node.dispatchEvent(ev);
}

function createBinaryDataUri(base64String) {
    return 'data:application/octet-stream;base64,' + base64String;
}

function createLink(dataUri, fileName) {
    var a = document.createElement('a');
    a.download = fileName;
    a.href = dataUri;
    return a;
}

/*end*/})();