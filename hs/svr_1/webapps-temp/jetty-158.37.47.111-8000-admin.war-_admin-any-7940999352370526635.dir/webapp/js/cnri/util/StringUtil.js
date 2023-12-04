(function () {
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var StringUtil = cnri.util.StringUtil = {};

var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;'
};

StringUtil.escapeHtml = function (string) {
    return String(string).replace(/[&<>"']/g, function (s) {
        return entityMap[s];
    });
};

StringUtil.reverseEscapeHtml = function (string) {
    return String(string).replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&quot;/g,'"').replace(/&#39;/g,"'");
};

/*end*/})();
