(function(){
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

var HandleValueSummary = cnri.hdl.util.HandleValueSummary = {};

HandleValueSummary.toString = function(handleValue) {
    var result = "";
    try {
        var type = handleValue.type;
        if (type === "HS_ADMIN") {
            result = getHsAdminString(handleValue);
        } else if (type === "DESC") {
            result =  getDescString(handleValue);
        } else if (type === "HS_SITE") {
            result =  getHsSiteString(handleValue);
        } else if (type === "EMAIL") {
            result =  getEmailString(handleValue);
        } else if (type === "URL") {
            result =  getUrlString(handleValue);
        } else if (type === "HS_SERV") {
            result =  getHsServString(handleValue);
        } else if (type === "HS_VLIST") {
            result =  getHsVlistString(handleValue);
        } else if (handleValue.data.format === "string") {
            result = getString(handleValue);
        } else if (handleValue.data.format == undefined) {
            result = handleValue.data;
        }
    } catch (err) {
        console.log("Could not create summary for handle value. " + JSON.stringify(handleValue));
    }
    if (hasUnusualPermissions(handleValue)) {
        result = handleValue.permissions +" "+ result;
    } 
    return result;
};

function hasUnusualPermissions(handleValue) {
    if (handleValue.permissions != undefined) {
        if (handleValue.permissions !== "1110") {
            return true;
        }
    } 
    return false;
}


function getString(handleValue) {
    return handleValue.data.value;
}

function getUrlString(handleValue) {
    var url = handleValue.data.value;
    return url;
}

function getEmailString(handleValue) {
    var email = handleValue.data.value;
    return email;
}

function getHsServString(handleValue) {
    var serviceHandle = handleValue.data.value;
    var result = serviceHandle;
    return result;
}

function getHsAdminString(handleValue) {
    //TODO consider adding permission string
    var adminHandle = handleValue.data.value.handle;
    var adminIndex = handleValue.data.value.index;
    return "handle=" + adminHandle + "; index=" + adminIndex; 
}

function getDescString(handleValue) {
    var description = handleValue.data.value;
    return description;
}

function getHsVlistString(handleValue) {
    var result = "";
    var vlist = handleValue.data.value;
    for (var i = 0; i < vlist.length; i++) {
        var id = vlist[i];
        result += id.index + ":" + id.handle;
        if (i != vlist.length -1) {
            result += ", ";
        }
    }
    return result;
}

function getHsSiteString(handleValue) {
    var site = handleValue.data.value;
    return getSiteString(site);
}

function getSiteString(site) {
    var isPrimary = site.primarySite;
    var result = "";
    var description = getSiteDescriptionAttribute(site);
    if (description !== null) {
        result += description + " ";
    }
    
    if (isPrimary) {
        result += "primary:y";
    } else {
        result += "primary:n";
    }
    var servers = site.servers;
    for (var i = 0; i < servers.length; i++) {
        var serverInfo = servers[i];
        result += " " + getServerString(serverInfo);
    }
    return result;
}
HandleValueSummary.getSiteString = getSiteString;

function getSiteDescriptionAttribute(site) {
    var attributes = site.attributes;
    if (attributes === undefined) {
        return null;
    }
    for (var i = 0; i < attributes.length; i++) {
        var attribute = attributes[i];
        if (attribute.name === "desc") {
            return attribute.value;
        }
    }
    return null;
}

function getServerString(serverInfo) {
    var result = "[";
    result += serverInfo.address;
    var interfaces = serverInfo.interfaces;
    for (var i = 0; i < interfaces.length; i++) {
        var interfaceInfo = interfaces[i];
        result += " " + interfaceInfo.protocol + "/"+interfaceInfo.port;
    }
    result += "]";
    return result;
}

/*end*/})();