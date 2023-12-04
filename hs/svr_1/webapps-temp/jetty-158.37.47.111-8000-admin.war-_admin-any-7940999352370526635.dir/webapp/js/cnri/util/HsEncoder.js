(function(){
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var HsEncoder = cnri.util.HsEncoder = {};

HsEncoder.Testing = {};  // private functions will go in here for unit testing

function clone(obj) {
    var res = {};
    for(var key in obj) {
        if(obj.hasOwnProperty(key)) res[key] = obj[key];
    }
    return res;
}

function isArray(obj) {
    if(Array.isArray) return Array.isArray(obj);
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function readString(view, offset) {
    var len = view.getInt32(offset);
    if(len < 0 || offset + 4 + len  > view.byteLength) throw { name : "HsEncoderError", message : "bad string length" };
    var arr = new Uint8Array(view.buffer, view.byteOffset + offset + 4, len);
    return { offset : offset + 4 + len, string : HsEncoder.Utf8.string(arr) };
}

function writeString(view, offset, string) {
    var len = HsEncoder.Utf8.calcNumBytes(string);
    view.setInt32(offset, len);
    var arr = new Uint8Array(view.buffer, view.byteOffset + offset + 4, len);
    arr.set(HsEncoder.Utf8.bytes(string));
    return offset + 4 + len;
}

function readBytes(view, offset) {
    var len = view.getInt32(offset);
    if(len < 0 || offset + 4 + len  > view.byteLength) throw { name : "HsEncoderError", message : "bad string length" };
    var arr = new Uint8Array(view.buffer, view.byteOffset + offset + 4, len);
    return { offset : offset + 4 + len, bytes : arr };
}

function writeBytes(view, offset, arr) {
    var len = arr.length;
    view.setInt32(offset, len);
    var viewArr = new Uint8Array(view.buffer, view.byteOffset + offset + 4, len);
    viewArr.set(arr);
    return offset + 4 + len;
}

HsEncoder.Util = {
    readString : readString,
    writeString : writeString,
    readBytes : readBytes,
    writeBytes : writeBytes
};

HsEncoder.Utf8 = clone(cnri.util.Encoder.Utf8);
HsEncoder.Base64 = clone(cnri.util.Encoder.Base64);
HsEncoder.Base64Url = clone(cnri.util.Encoder.Base64Url);
HsEncoder.Hex = clone(cnri.util.Encoder.Hex);

HsEncoder.Utf8.json = HsEncoder.Utf8.string;
HsEncoder.Base64.json = HsEncoder.Base64.string;
HsEncoder.Hex.json = HsEncoder.Hex.string;

HsEncoder.Admin = {};

HsEncoder.Admin.json = function(arr) {
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var permissions = view.getUint16(0);
    var stringAndNewOffset = readString(view,2);
    var index = view.getInt32(stringAndNewOffset.offset);
    var legacyByteLength = stringAndNewOffset.offset + 4 + 2 == arr.byteLength;
    var result = {
        permissions : pad(permissions.toString(2), 12),
        handle : stringAndNewOffset.string,
        index : index
    };
    if (legacyByteLength) result.legacyByteLength = true;
    return result;
};

function pad(s, n) {
    while(s.length < n) {
        s = '0' + s;
    }
    return s;
}

HsEncoder.Admin.calcNumBytes = function(json) {
    var handleBytes = HsEncoder.Utf8.bytes(json.handle);
    var result = 10 + handleBytes.length;
    if (json.legacyByteLength) result += 2;
    return result;
};

function getPermissions(json, len, allTrueValue) {
    if(json==='*') return allTrueValue;
    if(typeof json === 'string') return parseInt(json,2);
    if(typeof json === 'number') return json;
    if(json===true) return allTrueValue;
    if(isArray(json)) {
        var res = 0;
        for(var i = 0; i < len; i++) {
            if(json[i]) res |= 1 << i;
        }
        return res;
    }
    return 0;
}

HsEncoder.Admin.bytes = function(json) {
    var handleBytes = HsEncoder.Utf8.bytes(json.handle);
    var len = 10 + handleBytes.length;
    if (json.legacyByteLength) len += 2;
    var view = new DataView(new ArrayBuffer(len));
    view.setUint16(0, getPermissions(json.permissions, 12, 0x0FFF));
    view.setInt32(2, handleBytes.length);
    new Uint8Array(view.buffer, view.byteOffset).set(handleBytes, 6);
    view.setInt32(6 + handleBytes.length, json.index);
    if (json.legacyByteLength) view.setInt16(10 + handleBytes.length, 0);
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);    
};

HsEncoder.Admin.looksLikeAdmin = function(arr) {
    if(arr.length < 10) return false;
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var handleLength = view.getInt32(2);
    var len = 10 + handleLength;
    if(arr.length === len) return true;
    if(arr.length === len + 2 && 0 === view.getInt16(len)) return true;
    return false;
};

HsEncoder.Vlist = {};

HsEncoder.Vlist.json = function(arr) {
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var len = view.getInt32(0);
    if(len < 0) throw { name : "HsEncoderError", message : "bad vlist length" };
    var res = [];
    var offset = 4;
    for(var i = 0; i < len; i++) {
        var stringAndNewOffset = readString(view,offset);
        var handle = stringAndNewOffset.string;
        var index = view.getInt32(stringAndNewOffset.offset);
        res.push({ handle:handle, index:index });
        offset = stringAndNewOffset.offset + 4;
    }
    return res;
};

HsEncoder.Vlist.calcNumBytes = function(json) {
    var offset = 4;
    for(var i = 0; i < json.length; i++) {
        offset += 8 + HsEncoder.Utf8.calcNumBytes(json[i].handle);
    }
    return offset;
};

HsEncoder.Vlist.bytes = function(json) {
    var view = new DataView(new ArrayBuffer(HsEncoder.Vlist.calcNumBytes(json)));
    view.setInt32(0, json.length);
    var offset = 4;
    for(var i = 0; i < json.length; i++) {
        offset = writeString(view, offset, json[i].handle);
        view.setInt32(offset, json[i].index);
        offset += 4;
    }
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);    
};

HsEncoder.Vlist.looksLikeVlist = function(arr) {
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    if(view.byteLength < 4) return false;
    var len = view.getInt32(0);
    if(len < 0) return false;
    var offset = 4;
    for(var i = 0; i < len; i++) {
        if(offset + 8 > view.byteLength) return false;
        var handleLen = view.getInt32(offset);
        if(handleLen < 0) return false;
        offset = offset + 8 + handleLen; 
    }
    return offset === view.byteLength;
};

HsEncoder.Site = {};

function readInterfaces(view, offset) {
    var intfsLen = view.getInt32(offset);
    if(intfsLen < 0) throw { name : "HsEncoderError", message : "bad site interfaces length" };
    var intfs = [];
    offset = offset + 4;
    for(var j = 0; j < intfsLen; j++) {
        var type = view.getUint8(offset);
        var protocolInt = view.getUint8(offset + 1);
        var protocolJson = protocolInt;
        if(protocolInt===0) protocolJson = "UDP";
        else if(protocolInt===1) protocolJson = "TCP";
        else if(protocolInt===2) protocolJson = "HTTP";
        var port = view.getInt32(offset + 2);
        offset += 6;
        intfs.push({
            query : (type & 2) !== 0,
            admin : (type & 1) != 0,
            protocol : protocolJson,
            port : port
        });
    }
    return { interfaces : intfs, offset : offset };
}

function ipAddressBytes(view, offset, address) {
    if(address.indexOf('.') >= 0) {
        var fields = address.split('.');
        for(var i = 0; i < 12; i++) {
            view.setUint8(offset + i, 0);
        }
        for(var i = 0; i < 4; i++) {
            view.setUint8(offset + 12 + i, parseInt(fields[i],10));
        }
    } else {
        var fields = address.split(':');
        if(fields.length < 8) {
            var blank = -1;
            for(var i = 0; i < fields.length; i++) {
                if(fields[i]==='') {
                    blank = i;
                    break;
                }
            }
            var args = [blank, 1];
            for(var i = 0; i < 8 - fields.length; i++) {
                args.push('0');
            }
            fields.splice.apply(fields,args);
        }
        for(var i = 0; i < 8; i++) {
            var pair = parseInt(fields[i], 16);
            view.setUint8(offset++, pair >> 8);
            view.setUint8(offset++, pair & 0xFF);
        }
    }
}

function getIpAddress(view, offset) {
    var bytes = new Uint8Array(view.buffer, view.byteOffset + offset, 16);
    var ipv6 = false;
    for(var i = 0; i < 12; i++) {
        if(bytes[i]!=0) {
            ipv6 = true;
            break;
        }
    }
    if(ipv6) {
        var longestZeroStart = -1;
        var longestZeroLen = -1;
        var zeroStart = -1;
        var zeroLen = -1;
        var fields = [];
        var fieldCount = 0;
        for(var i = 0; i < 16; i+=2) {
            var field = ((bytes[i] << 8) | bytes[i+1]).toString(16);
            fields.push(field);
            if(field==='0') {
                if(zeroStart < 0) {
                    zeroStart = fieldCount;
                    zeroLen = 1;
                } else {
                    zeroLen++;
                }
            } else {
                if(zeroStart >= 0) {
                    if(longestZeroLen < zeroLen) {
                        longestZeroStart = zeroStart;
                        longestZeroLen = zeroLen;
                    }
                    zeroStart = -1;
                }
            }
            fieldCount++;
        }
        if(zeroStart >= 0) {
            if(longestZeroLen < zeroLen) {
                longestZeroStart = zeroStart;
                longestZeroLen = zeroLen;
            }
            zeroStart = -1;
        }
        if(longestZeroLen > 1) {
            fields.splice(longestZeroStart, longestZeroLen, '');
            if(longestZeroStart===0) fields.unshift('');
            else if(longestZeroStart + longestZeroLen === 8) fields.push('');
        }
        return fields.join(':');
    } else {
        return '' + bytes[12] + '.' + bytes[13] + '.' + bytes[14] + '.' + bytes[15];
    }
}
HsEncoder.Testing.getIpAddress = getIpAddress;

function readServers(view, offset) {
    var serversLen = view.getInt32(offset);
    if(serversLen < 0) throw { name : "HsEncoderError", message : "bad site servers length" };
    var servers = [];
    offset = offset + 4;
    for(var i = 0; i < serversLen; i++) {
        var serverId = view.getInt32(offset);
        var ipAddress = getIpAddress(view, offset + 4);
        var bytesAndOffset = readBytes(view, offset + 20);
        var publicKey = HsEncoder.Data.json(bytesAndOffset.bytes);
        offset = bytesAndOffset.offset;
        
        var interfacesAndOffset = readInterfaces(view, offset);
        offset = interfacesAndOffset.offset;
        
        servers.push({
            serverId : serverId,
            address : ipAddress,
            publicKey : publicKey,
            interfaces : interfacesAndOffset.interfaces
        });
    }
    return { servers:servers, offset:offset };
}

HsEncoder.Site.json = function(arr) {
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var version = view.getInt16(0);
    var majorProtocolVersion = view.getUint8(2);
    var minorProtocolVersion = view.getUint8(3);
    var serialNumber = view.getInt16(4);
    var primaryMask = view.getUint8(6);
    var hashOption = view.getUint8(7);
    var stringAndOffset = readString(view, 8);
    var hashFilter = stringAndOffset.string;
    var offset = stringAndOffset.offset;
    
    var attsLen = view.getInt32(offset);
    if(attsLen < 0) throw { name : "HsEncoderError", message : "bad site attributes length" };
    offset = offset + 4;
    var atts = [];
    for(var i = 0; i < attsLen; i++) {
        var keyAndOffset = readString(view, offset);
        var valueAndOffset = readString(view, keyAndOffset.offset);
        atts.push({ name : keyAndOffset.string, value : valueAndOffset.string });
        offset = valueAndOffset.offset;
    }
    var servers = readServers(view, offset).servers;
    var site = {
        version : version,
        protocolVersion : '' + majorProtocolVersion + '.' + minorProtocolVersion,
        serialNumber : serialNumber,
        primarySite : (primaryMask & 0x80) != 0,
        multiPrimary : (primaryMask & 0x40) != 0
    };
    if(hashOption != 2) site.hashOption = hashOption;
    if(hashFilter) site.hashFilter = hashFilter;
    if(attsLen > 0) site.attributes = atts;
    if(servers.length > 0) site.servers = servers;
    return site;
};

HsEncoder.Site.calcNumBytes = function(json) {
    var offset = 8;
    var hashFilter = json.hashFilter;
    if(!hashFilter) hashFilter = "";
    offset += 4 + HsEncoder.Utf8.calcNumBytes(hashFilter);
    offset += 4;
    if(!json.attributes) {
        // no attributes
    } else if(isArray(json.attributes)) {
        for(var i = 0; i < json.attributes.length; i++) {
            offset += 8 + HsEncoder.Utf8.calcNumBytes(json.attributes[i].name) + HsEncoder.Utf8.calcNumBytes(json.attributes[i].value);
        }
    } else {
        for(var key in json.attributes) {
            if(json.attributes.hasOwnProperty(key)) {
                offset += 8 + HsEncoder.Utf8.calcNumBytes(key) + HsEncoder.Utf8.calcNumBytes(json.attributes[key]);
            }
        }
    }
    offset += 4;
    if(json.servers) {
        for(var i = 0; i < json.servers.length; i++) {
            offset += serverCalcNumBytes(json.servers[i]);
        }
    }
    return offset;
};

function serverCalcNumBytes(json) {
    var len = 28;
    len += HsEncoder.Data.calcNumBytes(json.publicKey);
    if(json.interfaces) {
        len += 6 * json.interfaces.length;
    }
    return len;
}

HsEncoder.Site.bytes = function(json) {
    var view = new DataView(new ArrayBuffer(HsEncoder.Site.calcNumBytes(json)));
    if(json.version) view.setInt16(0,json.version);
    else view.set16(0, 1); // default version is 1
    if(json.protocolVersion) {
        var point = json.protocolVersion.indexOf('.');
        view.setUint8(2, parseInt(json.protocolVersion.substring(0,point), 10));
        view.setUint8(3, parseInt(json.protocolVersion.substring(point + 1), 10));
    }
    if(json.serialNumber) view.setInt16(4, json.serialNumber);
    var primaryMask = 0;
    if(json.primarySite) primaryMask |= 0x80;
    if(json.multiPrimary) primaryMask |= 0x40;
    view.setUint8(6, primaryMask);
    if(json.hashOption!==undefined) { 
        view.setUint8(7, json.hashOption);
    } else {
        view.setUint8(7, 2);
    }
    var offset = 8;
    if(json.hashFilter) {
        offset = writeString(view, offset, json.hashFilter);
    } else {
        view.setInt32(offset, 0);
        offset += 4;
    }
    if(!json.attributes) {
        view.setInt32(offset, 0);
        offset += 4;
    } else if(isArray(json.attributes)) {
        view.setInt32(offset, json.attributes.length);
        offset += 4;
        for(var i = 0; i < json.attributes.length; i++) {
            offset = writeString(view, offset, json.attributes[i].name);
            offset = writeString(view, offset, json.attributes[i].value);
        }
    } else {
        var keys = [];
        for(var key in json.attributes) {
            if(json.attributes.hasOwnProperty(key)) {
                keys.push(key);
            }
        }
        view.setInt32(offset, keys.length);
        offset += 4;
        for(var i = 0; i < keys.length; i++) {
            var key = keys[i];
            offset = writeString(view, offset, key);
            offset = writeString(view, offset, json.attributes[key]);
        }
    }
    if(!json.servers) {
        view.setInt32(offset, 0);
        return new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
    } 
    view.setInt32(offset, json.servers.length);
    offset += 4;
    for(var i = 0; i < json.servers.length; i++) {
        offset = serverBytes(view, offset, json.servers[i]);
    }
    return new Uint8Array(view.buffer, view.byteOffset, offset);
};

function serverBytes(view, offset, json) {
    if(json.serverId) view.setInt32(offset, json.serverId);
    offset += 4;
    if(json.address) ipAddressBytes(view, offset, json.address);
    offset += 16;
    if(json.publicKey) {
        offset = writeBytes(view, offset, HsEncoder.Data.bytes(json.publicKey));
    } else {
        view.setInt32(offset, 0);
        offset += 4;
    }
    if(!json.interfaces) {
        view.setInt32(offset, 0);
        offset += 4;
        return offset;
    }
    view.setInt32(offset, json.interfaces.length);
    offset += 4;
    for(var i = 0; i < json.interfaces.length; i++) {
        var intf = json.interfaces[i];
        var type = 0;
        if(intf.query) type |= 2;
        if(intf.admin) type |= 1;
        view.setUint8(offset, type);
        offset++;
        
        var protocol = intf.protocol;
        if(!protocol) protocol = 0;
        if(protocol==="UDP") protocol = 0;
        if(protocol==="TCP") protocol = 1;
        if(protocol==="HTTP") protocol = 2;
        view.setUint8(offset, protocol);
        offset++;
        
        if(intf.port) view.setInt32(offset, intf.port);
        offset += 4;
    }
    return offset;
}

HsEncoder.Site.looksLikeSite = function(arr) {
    if(arr.length < 20) return false;
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var hashFilterLen = view.getInt32(8);
    if(hashFilterLen < 0 || 20 + hashFilterLen > arr.length) return false;
    var offset = 12 + hashFilterLen;
    var attsLen = view.getInt32(offset);
    if(attsLen < 0 || offset + 8 + attsLen*8 > arr.length) return false;
    offset += 4;
    for(var i = 0; i < attsLen; i++) {
        var nameLen = view.getInt32(offset);
        if(nameLen < 0) return false;
        offset += nameLen;
        offset += 4;
        if(offset + 4 > arr.length) return false;

        var valueLen = view.getInt32(offset);
        if(valueLen < 0) return false;
        offset += valueLen;
        offset += 4;
        if(offset + 4 > arr.length) return false;
    }
    var serversLen = view.getInt32(offset);
    offset += 4;
    if(serversLen < 0 || offset + 28*serversLen > arr.length) return false;
    for(var i = 0; i < serversLen; i++) {
        offset += 20;
        var len = view.getInt32(offset);
        offset += 4;
        if(len < 0) return false;
        offset += len;
        if(offset + 4 > arr.length) return false;
        var len = view.getInt32(offset);
        offset += 4;
        if(len < 0) return false;
        offset += 6*len;
        if(offset > arr.length) return false;
    }
    return offset === arr.length;
};

HsEncoder.Key = {};

HsEncoder.Key.KEY_ENCODING_DSA_PUBLIC = HsEncoder.Utf8.bytes("DSA_PUB_KEY");
HsEncoder.Key.KEY_ENCODING_RSA_PUBLIC = HsEncoder.Utf8.bytes("RSA_PUB_KEY");

function compareArrays(a, b) {
    if (!b) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

function unsigned(arr) {
	if (arr.length === 0) return new Uint8Array(1);
	var zeros = 0;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i] === 0) zeros++;
		else break;
	}
	if (zeros === arr.length) zeros--;
	if (zeros === 0) return arr;
	return new Uint8Array(arr.buffer, arr.byteOffset + zeros, arr.length - zeros);
}

HsEncoder.Key.json = function (arr) {
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var bytesAndOffset = readBytes(view, 0);
    var keyType = bytesAndOffset.bytes;
    bytesAndOffset.offset = bytesAndOffset.offset + 2; //skip unused flags
    var json = {};
    if (compareArrays(keyType, HsEncoder.Key.KEY_ENCODING_DSA_PUBLIC)) {
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var q = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var p = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var g = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var y = bytesAndOffset.bytes;
        json.kty = "DSA";
        json.y = HsEncoder.Base64Url.string(unsigned(y));
        json.p = HsEncoder.Base64Url.string(unsigned(p));
        json.q = HsEncoder.Base64Url.string(unsigned(q));
        json.g = HsEncoder.Base64Url.string(unsigned(g));
    } else if (compareArrays(keyType, HsEncoder.Key.KEY_ENCODING_RSA_PUBLIC)) {
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var e = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var n = bytesAndOffset.bytes;
        json.kty = "RSA";
        json.n = HsEncoder.Base64Url.string(unsigned(n));
        json.e = HsEncoder.Base64Url.string(unsigned(e));
    } else {
        throw { name : "HsEncoderError", message : "Key type not supported" };
    } 
    return json;
};

HsEncoder.Key.looksLikeKey = function (arr) {
    if (arr.length < 29) return false;
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    var keyTypeLength = view.getInt32(0);
    if (keyTypeLength != 11) return false;
    var keyType = arr.subarray(4, 15);
    var offset = 17;
    var len = view.getInt32(offset);
    offset += 4;
    if (len <= 0) return false;
    if (compareArrays(keyType, HsEncoder.Key.KEY_ENCODING_DSA_PUBLIC)) {
        if (offset + len + 12 > view.byteLength) return false;
    	if (!appropriateZeroPadding(view, offset, len)) return false;
        offset += len;
        len = view.getInt32(offset);
        offset += 4;
        if (len <= 0) return false;
        if (offset + len + 8 > view.byteLength) return false;
    	if (!appropriateZeroPadding(view, offset, len)) return false;
        offset += len;
        len = view.getInt32(offset);
        offset += 4;
        if (len <= 0) return false;
        if (offset + len + 4 > view.byteLength) return false;
    	if (!appropriateZeroPadding(view, offset, len)) return false;
        offset += len;
        len = view.getInt32(offset);
        offset += 4;
        if (len <= 0) return false;
        if (offset + len !== view.byteLength) return false;
    	if (!appropriateZeroPadding(view, offset, len)) return false;
        return true;
    } else if (compareArrays(keyType, HsEncoder.Key.KEY_ENCODING_RSA_PUBLIC)) {
        if (offset + len + 8 > view.byteLength) return false;
    	if (!appropriateZeroPadding(view, offset, len)) return false;
        offset += len;
        len = view.getInt32(offset);
        offset += 4;
        if (len <= 0) return false;
        if (offset + len + 4 !== view.byteLength) return false;
    	if (!appropriateZeroPadding(view, offset, len)) return false;
        offset += len;
        var trailer = view.getInt32(offset);
        if (trailer !== 0) return false;
        return true;
    } else {
        return false;
    } 
};

function appropriateZeroPadding(view, offset, len) {
	if (len <= 0) return false;
	if (len == 1) return view.getUint8(offset) <= 127;
	var first = view.getUint8(offset);
	if (first > 0 && first <= 127) return true;
	if (first >= 128) return false;
	var second = view.getUint8(offset + 1);
	if (second <= 127) return false;
	return true;
}

function needsPadding(s) {
	if (s.length === 0) return true;
	var ch = s.charAt(0);
	if (ch >= 'A' && ch <= 'Z') return false;
	if (ch >= 'a' && ch <= 'f') return false;
	return true;
}

HsEncoder.Key.calcNumBytes = function (json) {
    var len = 17;
    if (json.kty === 'RSA') {
        len += 12;
        len += HsEncoder.Base64.calcNumBytes(json.n);
        len += HsEncoder.Base64.calcNumBytes(json.e);
        if (needsPadding(json.n)) len++;
        if (needsPadding(json.e)) len++;
    } else if (json.kty === 'DSA') {
        len += 16;
        len += HsEncoder.Base64.calcNumBytes(json.y);
        len += HsEncoder.Base64.calcNumBytes(json.p);
        len += HsEncoder.Base64.calcNumBytes(json.q);
        len += HsEncoder.Base64.calcNumBytes(json.g);
        if (needsPadding(json.y)) len++;
        if (needsPadding(json.p)) len++;
        if (needsPadding(json.q)) len++;
        if (needsPadding(json.g)) len++;
    } else {
        throw { name : "HsEncoderError", message : "Key type not supported" };
    }
    return len;
};

HsEncoder.Key.bytes = function (json) {
    var view = new DataView(new ArrayBuffer(HsEncoder.Key.calcNumBytes(json)));
    var offset = 0;
    if (json.kty === 'RSA') {
        offset = writeBytes(view, offset, HsEncoder.Key.KEY_ENCODING_RSA_PUBLIC);
        offset += 2;
        if (needsPadding(json.e)) view.setUint8(offset++, 0);
        offset = writeBytes(view, offset, HsEncoder.Base64.bytes(json.e));
        if (needsPadding(json.n)) view.setUint8(offset++, 0);
        offset = writeBytes(view, offset, HsEncoder.Base64.bytes(json.n));
        view.setInt32(offset, 0); // random handle encoding zero at end of RSA key
        offset += 4;
    } else if (json.kty === 'DSA') {
        offset = writeBytes(view, offset, HsEncoder.Key.KEY_ENCODING_DSA_PUBLIC);
        offset += 2;
        if (needsPadding(json.q)) view.setUint8(offset++, 0);
        offset = writeBytes(view, offset, HsEncoder.Base64.bytes(json.q));
        if (needsPadding(json.p)) view.setUint8(offset++, 0);
        offset = writeBytes(view, offset, HsEncoder.Base64.bytes(json.p));
        if (needsPadding(json.g)) view.setUint8(offset++, 0);
        offset = writeBytes(view, offset, HsEncoder.Base64.bytes(json.g));
        if (needsPadding(json.y)) view.setUint8(offset++, 0);
        offset = writeBytes(view, offset, HsEncoder.Base64.bytes(json.y));
    } else {
        throw { name : "HsEncoderError", message : "Key type not supported" };
    }
    return new Uint8Array(view.buffer, view.byteOffset, offset);
};

function encoderFromFormat(format) {
    if(format==='string') return HsEncoder.Utf8;
    if(format==='base64') return HsEncoder.Base64;
    if(format==='hex') return HsEncoder.Hex;
    if(format==='admin') return HsEncoder.Admin;
    if(format==='vlist') return HsEncoder.Vlist;
    if(format==='site') return HsEncoder.Site;
    if(format==='key') return HsEncoder.Key;
    throw { name:'HsEncoderError', message : 'Unknown format ' + format };
}

HsEncoder.Data = {};

HsEncoder.Data.calcNumBytes = function(json) {
    if(typeof json === 'string') return HsEncoder.Utf8.calcNumBytes(json);
    return encoderFromFormat(json.format).calcNumBytes(json.value);
};

HsEncoder.Data.bytes = function(json) {
    if(typeof json === 'string') return HsEncoder.Utf8.bytes(json);
    return encoderFromFormat(json.format).bytes(json.value);
};

HsEncoder.Data.json = function(arr) {
    if(HsEncoder.Key.looksLikeKey(arr)) {
        return { format:"key", value: HsEncoder.Key.json(arr) };
    } else if(HsEncoder.Admin.looksLikeAdmin(arr)) {
        return { format:"admin", value: HsEncoder.Admin.json(arr) };
    } else if(HsEncoder.Vlist.looksLikeVlist(arr)) {
        return { format:"vlist", value: HsEncoder.Vlist.json(arr) };
    } else if(HsEncoder.Site.looksLikeSite(arr)) {
        return { format:"site", value: HsEncoder.Site.json(arr) };
    } else if(HsEncoder.Utf8.looksLikeBinary(arr)) {
        return { format:"base64", value: HsEncoder.Base64.json(arr) };
    } else {
        return { format:"string", value: HsEncoder.Utf8.string(arr) };
    }
};

HsEncoder.Value = {};

HsEncoder.Value.calcNumBytes = function(json) {
    var res = 22 + HsEncoder.Utf8.calcNumBytes(json.type) + HsEncoder.Data.calcNumBytes(json.data);
    res += 4;
    if (json.references) {
        for (var i = 0; i < json.references.length; i++) {
            res += 8 + HsEncoder.Utf8.calcNumBytes(json.references[i].handle);
        }
    }
    return res;
};

HsEncoder.Value.bytes = function(json) {
    var view = new DataView(new ArrayBuffer(HsEncoder.Value.calcNumBytes(json)));
    view.setInt32(0, json.index);
    if (json.timestamp) view.setInt32(4, Date.parse(json.timestamp)/1000);
    else view.setInt32(4, 0);
    var ttl = json.ttl;
    if (ttl === undefined) ttl = 86400;
    if (typeof ttl === 'number') {
        view.setUint8(8, 0);
        view.setInt32(9, ttl);
    } else {
        view.setUint8(8, 1);
        view.setInt32(9, Date.parse(ttl)/1000);
    }
    if (json.permissions) {
        view.setUint8(13, getPermissions(json.permissions, 4, 0x0F));
    } else {
        view.setUint8(13, 0x0E);
    }
    var offset = writeString(view, 14, json.type);
    offset = writeBytes(view, offset, HsEncoder.Data.bytes(json.data));
    if (json.references) {
        view.setInt32(offset, json.references.length);
        offset += 4;
        for (var i = 0; i < json.references.length; i++) {
            offset = writeString(view, offset, json.references[i].handle);
            view.setInt32(offset, json.references[i].index);
            offset += 4;
        }
    } else {
        view.setInt32(offset, 0);
        offset += 4;
    }
    return new Uint8Array(view.buffer, view.byteOffset, offset);
};

function formatSeconds(seconds) {
    return new Date(seconds*1000).toISOString().replace(".000","");
}

HsEncoder.Value.json = function(arr) {
    var view = new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    return HsEncoder.Value.readJson(view, 0).json;
};

HsEncoder.Value.readJson = function(view, offset) {
    var index = view.getInt32(offset);
    var timestamp = view.getInt32(offset + 4);
    var ttlType = view.getUint8(offset + 8);
    var ttl = view.getInt32(offset + 9);
    var permissions = view.getUint8(offset + 13);
    var stringAndOffset = readString(view, offset + 14);
    var type = stringAndOffset.string;
    offset = stringAndOffset.offset;
    var dataAndOffset = readBytes(view, offset);
    var data = HsEncoder.Data.json(dataAndOffset.bytes);
    offset = dataAndOffset.offset;
    var referencesLen = view.getInt32(offset);
    offset += 4;
    if (referencesLen < 0) throw { name : "HsEncoderError", message : "bad references length" };
    var references = [];
    for(var i = 0; i < referencesLen; i++) {
        var stringAndNewOffset = readString(view, offset);
        var refHandle = stringAndNewOffset.string;
        var refIndex = view.getInt32(stringAndNewOffset.offset);
        references.push({ handle:refHandle, index:refIndex });
        offset = stringAndNewOffset.offset + 4;
    }
    var json = {
        index: index,
        type: type,
        data: data
    };
    if (ttlType === 0) {
        json.ttl = ttl;
    } else {
        json.ttl = formatSeconds(ttl);
    }
    json.timestamp = formatSeconds(timestamp);
    if (permissions !== 0x0E) {
        json.permissions = pad(permissions.toString(2), 4);
    }
    if (references.length > 0) {
        json.references = references;
    }
    return { json : json, offset : offset};
};

/*end*/})();
