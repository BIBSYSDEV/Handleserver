(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function ValueReference(string) {
    var self = this;
    var index = null;
    var handle = null;

    function constructor() {
        var colon = string.indexOf(":"); 
        var indexString = string.substr(0, colon);
        handle = string.substr(colon + 1);
        index = parseInt(indexString);
    }

    function getIndex() {
        return index;
    }
    self.getIndex = getIndex;

    function getHandle() {
        return handle;
    }
    self.getHandle = getHandle;
    
    constructor();
}

cnri.hdl.util.ValueReference = ValueReference;
/*end*/})();