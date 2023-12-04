(function(){
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var EncryptionUtil = cnri.util.EncryptionUtil = {};
    
EncryptionUtil.KEY_ENCODING_DSA_PRIVATE    = cnri.util.Encoder.Utf8.bytes("DSA_PRIV_KEY");
EncryptionUtil.KEY_ENCODING_RSA_PRIVATE    = cnri.util.Encoder.Utf8.bytes("RSA_PRIV_KEY");
EncryptionUtil.KEY_ENCODING_RSACRT_PRIVATE = cnri.util.Encoder.Utf8.bytes("RSA_PRIVCRT_KEY");

EncryptionUtil.KEY_ENCODING_DSA_PUBLIC     = cnri.util.Encoder.Utf8.bytes("DSA_PUB_KEY");
EncryptionUtil.KEY_ENCODING_RSA_PUBLIC     = cnri.util.Encoder.Utf8.bytes("RSA_PUB_KEY");
EncryptionUtil.KEY_ENCODING_DH_PUBLIC      = cnri.util.Encoder.Utf8.bytes("DH_PUB_KEY");

EncryptionUtil.DEFAULT_E = new Uint8Array([1, 0, 1]);

EncryptionUtil.ENCRYPT_DES_ECB_PKCS5 = 0;   // DES with ECB and PKCS5 padding
EncryptionUtil.ENCRYPT_NONE          = 1;   // no encryption
EncryptionUtil.ENCRYPT_DES_CBC_PKCS5 = 2;   // DES with CBC and PKCS5 padding
EncryptionUtil.ENCRYPT_AES_CBC_PKCS5 = 4;   // AES with CBC and PKCS5 padding

EncryptionUtil.getPrivateKeyFromBytes = function (pkBuf, offset) {
    if (!offset) offset = 0;
    var privateKey = {};
    var view = new DataView(pkBuf.buffer, pkBuf.byteOffset, pkBuf.byteLength);
    var bytesAndOffset = readBytes(view, offset);
    var keyType = bytesAndOffset.bytes;

    if (compareArrays(keyType, EncryptionUtil.KEY_ENCODING_DSA_PRIVATE)) {
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var x = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var p = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var q = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var g = bytesAndOffset.bytes;
//        privateKey.x = x;
//        privateKey.p = p;
//        privateKey.q = q;
//        privateKey.g = g;
        privateKey.x = cnri.util.Encoder.Base64Url.string(unsigned(x));
        privateKey.p = cnri.util.Encoder.Base64Url.string(unsigned(p));
        privateKey.q = cnri.util.Encoder.Base64Url.string(unsigned(q));
        privateKey.g = cnri.util.Encoder.Base64Url.string(unsigned(g));
        privateKey.kty = "DSA";
    } else if (compareArrays(keyType, EncryptionUtil.KEY_ENCODING_RSA_PRIVATE)) {
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var m = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var exp = readBytes(view, bytesAndOffset.offset);
//        privateKey.n = m;
//        privateKey.d = exp;
//        privateKey.e = EncryptionUtil.DEFAULT_E;
        privateKey.n = cnri.util.Encoder.Base64Url.string(unsigned(m));
        privateKey.d = cnri.util.Encoder.Base64Url.string(unsigned(exp));
        privateKey.e = cnri.util.Encoder.Base64Url.string(EncryptionUtil.DEFAULT_E);        
        privateKey.kty = "RSA";
    } else if (compareArrays(keyType, EncryptionUtil.KEY_ENCODING_RSACRT_PRIVATE)) { 
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var n = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var pubEx = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var ex = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var p = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var q = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var exP = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var exQ = bytesAndOffset.bytes;   
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var coeff = bytesAndOffset.bytes;     
//        privateKey.n = n;
//        privateKey.d = ex;
//        privateKey.e = pubEx;
        privateKey.n = cnri.util.Encoder.Base64Url.string(unsigned(n));
        privateKey.d = cnri.util.Encoder.Base64Url.string(unsigned(ex));
        privateKey.e = cnri.util.Encoder.Base64Url.string(unsigned(pubEx));
        privateKey.kty = "RSA";
    } 
    return privateKey;
};

EncryptionUtil.getPublicKeyFromBytes = function (pkBuf, offset) {
    if (!offset) offset = 0;
    var publicKey = {};
    var view = new DataView(pkBuf.buffer, pkBuf.byteOffset, pkBuf.byteLength);
    var bytesAndOffset = readBytes(view, offset);
    var keyType = bytesAndOffset.bytes;
    bytesAndOffset.offset = bytesAndOffset.offset + 2; //skip unused flags
    if (compareArrays(keyType, EncryptionUtil.KEY_ENCODING_DSA_PUBLIC)) {
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var q = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var p = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var g = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var y = bytesAndOffset.bytes;
//        publicKey.q = q;
//        publicKey.p = p;
//        publicKey.g = g;
//        publicKey.y = y;
        publicKey.q = cnri.util.Encoder.Base64Url.string(unsigned(q));
        publicKey.p = cnri.util.Encoder.Base64Url.string(unsigned(p));
        publicKey.g = cnri.util.Encoder.Base64Url.string(unsigned(g));
        publicKey.y = cnri.util.Encoder.Base64Url.string(unsigned(y));
        publicKey.kty = "DSA";
    } else if (compareArrays(keyType, EncryptionUtil.KEY_ENCODING_RSA_PUBLIC)) {
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var ex = bytesAndOffset.bytes;
        bytesAndOffset = readBytes(view, bytesAndOffset.offset);
        var m = bytesAndOffset.bytes;

//        publicKey.n = m;
//        publicKey.e = ex;        
        publicKey.n = cnri.util.Encoder.Base64Url.string(unsigned(m));
        publicKey.e = cnri.util.Encoder.Base64Url.string(unsigned(ex));
        publicKey.kty = "RSA";
    } else if (compareArrays(keyType, EncryptionUtil.KEY_ENCODING_DH_PUBLIC)) { 
        throw { name : "EncryptionError", message : "KEY_ENCODING_DH_PUBLIC key type not supported" };
    } 
    return publicKey;
};

EncryptionUtil.signRsaSha256 = function (privateKey, data) {
    var n = unsigned(cnri.util.Encoder.Base64Url.bytes(privateKey.n));
    var e = unsigned(cnri.util.Encoder.Base64Url.bytes(privateKey.e));
    var d = unsigned(cnri.util.Encoder.Base64Url.bytes(privateKey.d));
    var signature = libpolycrypt.sign_pkcs1_sha256(n, e, d, data);
    return signature;
};

EncryptionUtil.signRsaSha1 = function (privateKey, data) {
    var n = unsigned(cnri.util.Encoder.Base64Url.bytes(privateKey.n));
    var e = unsigned(cnri.util.Encoder.Base64Url.bytes(privateKey.e));
    var d = unsigned(cnri.util.Encoder.Base64Url.bytes(privateKey.d));
    var signature = libpolycrypt.sign_pkcs1_sha1(n, e, d, data);
    return signature;
};

EncryptionUtil.verifyRsaSha256 = function (publicKey, data, signature) {
    // note: same code whether SHA1 or SHA256
    var n = unsigned(cnri.util.Encoder.Base64Url.bytes(publicKey.n));
    var e = unsigned(cnri.util.Encoder.Base64Url.bytes(publicKey.e));
    return libpolycrypt.verify_pkcs1(n, e, data, signature);
};

EncryptionUtil.verifyRsaSha1 = function (publicKey, data, signature) {
    // note: same code whether SHA1 or SHA256
    var n = unsigned(cnri.util.Encoder.Base64Url.bytes(publicKey.n));
    var e = unsigned(cnri.util.Encoder.Base64Url.bytes(publicKey.e));
    return libpolycrypt.verify_pkcs1(n, e, data, signature);
};

EncryptionUtil.signDsaSha1 = function (privateDsaKey, data) {
    var hash = libpolycrypt.sha1(data);
    var hashHex = cnri.util.Encoder.Hex.string(hash);
    var hashBigInt = new BigInteger(hashHex, 16);
    var dsaKey = new DSAKey();
    var p = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.p)));
    var q = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.q)));
    var g = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.g)));
    var y = "0";
    var x = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.x)));
    dsaKey.setPrivate(p, q, g, y, x);
    var signature = dsaKey.sign(hashBigInt);
    var r = signature[0];
    var rHex = r.toString(16);
    var rBytes = cnri.util.Encoder.Hex.bytes(rHex);
    var s = signature[1];
    var sHex = s.toString(16);
    var sBytes = cnri.util.Encoder.Hex.bytes(sHex);
//    var k = signature[2];
//    var kHex = k.toString(16);
//    console.log("k = " + kHex);
    var signatureBytes = asn1DsaSignature(rBytes, sBytes);
    return signatureBytes;
}; 

EncryptionUtil.verifyDsaSha1 = function (publicDsaKey, data, signature) {
    var hash = libpolycrypt.sha1(data);
    return verifyDsa(hash, publicDsaKey, signature);
};

function verifyDsa(hash, publicDsaKey, signature) {
    var hashHex = cnri.util.Encoder.Hex.string(hash);
    var hashBigInt = new BigInteger(hashHex, 16);
    var dsaKey = new DSAKey();
    var p = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(publicDsaKey.p)));
    var q = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(publicDsaKey.q)));
    var g = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(publicDsaKey.g)));
    var y = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(publicDsaKey.y)));
    dsaKey.setPublic(p, q, g, y);
    var decodedSignature = decodeAsn1DsaSignature(signature);
    var rBytes = decodedSignature.r;
    var sBytes = decodedSignature.s;
    var rHex = cnri.util.Encoder.Hex.string(rBytes);
    var sHex = cnri.util.Encoder.Hex.string(sBytes);
    var rBigInteger = new BigInteger(rHex, 16);
    var sBigInteger = new BigInteger(sHex, 16);
    var rAndS = [rBigInteger, sBigInteger];
    var result = dsaKey.verify(hashBigInt, rAndS);
    return result;
}

EncryptionUtil.verifyDsaSha256 = function (publicDsaKey, data, signature) {
    var hash = libpolycrypt.sha256(data);
    hash = hash.subarray(0, 20);
    return verifyDsa(hash, publicDsaKey, signature);
};

EncryptionUtil.signDsaSha1WithK = function (privateDsaKey, data, K) {
    K = new BigInteger(K);
    var hash = libpolycrypt.sha1(data);
    var hashHex = cnri.util.Encoder.Hex.string(hash);
    var hashBigInt = new BigInteger(hashHex, 16);
    var dsaKey = new DSAKey();
    var p = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.p)));
    var q = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.q)));
    var g = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.g)));
    var y = "0";
    var x = cnri.util.Encoder.Hex.string(unsigned(cnri.util.Encoder.Base64Url.bytes(privateDsaKey.x)));
    dsaKey.setPrivate(p, q, g, y, x);
    var signature = dsaKey.sign(hashBigInt, K);
    var r = signature[0];
    var rHex = r.toString(16);
    var rBytes = cnri.util.Encoder.Hex.bytes(rHex);
    var s = signature[1];
    var sHex = s.toString(16);
    var sBytes = cnri.util.Encoder.Hex.bytes(sHex);
    var response = {
            rBytes : rBytes,
            sBytes : sBytes,
            signature : asn1DsaSignature(rBytes, sBytes)
    };
    return response.signature;
}; 

EncryptionUtil.digestSha1 = function (data) {
    var hash = libpolycrypt.sha1(data);
    return hash;
};

EncryptionUtil.digestSha256 = function (data) {
    var hash = libpolycrypt.sha256(data);
    return hash;
};

EncryptionUtil.requiresSecretKey = function (ciphertext) {
    var encryptionType = readInt(ciphertext, 0);
    if(encryptionType == EncryptionUtil.ENCRYPT_NONE) {
        return false;
    } else {
        return true;
    }
};

EncryptionUtil.decrypt = function (data, key) {
    var encryptionType = readInt(data, 0);
    if (encryptionType == EncryptionUtil.ENCRYPT_NONE) {
        return EncryptionUtil.stripContainerFromUnencryptedData(data);
    } else if (encryptionType == EncryptionUtil.ENCRYPT_DES_ECB_PKCS5) {
        return EncryptionUtil.decryptDesEcb(data, key);
    } else if (encryptionType == EncryptionUtil.ENCRYPT_DES_CBC_PKCS5) {
        return EncryptionUtil.decryptDes(data, key);
    } else if (encryptionType == EncryptionUtil.ENCRYPT_AES_CBC_PKCS5) {
        return EncryptionUtil.decryptAes(data, key);
    }
};

EncryptionUtil.stripContainerFromUnencryptedData = function (data) {
    return data.subarray(4);
};

EncryptionUtil.decryptDesEcb = function (data, key) {
    var ciphertext = data.subarray(4, data.length);
    //printBytes(key);
    //printBytes(ciphertext);
    
    var ciphertext_wa = util.abv2wa(ciphertext);
    var keyhash_wa = CryptoJS.MD5(key);
        
    var cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext_wa
    });
    var decryptedData = CryptoJS.DES.decrypt(cipherParams, keyhash_wa, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7});
    var resultBytes = util.wa2abv(decryptedData);
    return resultBytes;
};

EncryptionUtil.decryptDes = function (data, key) {
    var iv = data.subarray(4, 12);
    var ciphertext = data.subarray(12, data.length);
    
    //printBytes(key);
    //printBytes(iv);
    //printBytes(ciphertext);
    
    var iv_wa   = util.abv2wa(iv);
    var ciphertext_wa = util.abv2wa(ciphertext);
    var keyhash_wa = CryptoJS.MD5(key);
        
    var cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext_wa,
        iv: iv_wa
    });
    var decryptedData = CryptoJS.DES.decrypt(cipherParams, keyhash_wa, { iv: iv_wa, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
    var resultBytes = util.wa2abv(decryptedData);
    return resultBytes;
};

EncryptionUtil.decryptAes = function (data, secretKey) {
    var INT_SIZE = 4;
    var offset = 4;
    var view = new DataView(data.buffer, data.byteOffset, data.byteLength);
    var bytesAndOffset = readBytes(view, offset);
    var salt = bytesAndOffset.bytes;
    offset = offset + INT_SIZE + salt.length;

    var iterations = view.getInt32(offset);
    offset = offset + INT_SIZE;
    
    var keyLength = view.getInt32(offset);
    offset = offset + INT_SIZE;
    
    var derivedSecretkey = EncryptionUtil.PBKDF2(secretKey, salt, iterations, keyLength);
    
    bytesAndOffset = readBytes(view, offset);
    var iv = bytesAndOffset.bytes;
    offset = offset + INT_SIZE + iv.length;
    
    bytesAndOffset = readBytes(view, offset);
    var ciphertext = bytesAndOffset.bytes;
    
    
    var iv_wa   = util.abv2wa(iv);
    var ciphertext_wa = util.abv2wa(ciphertext);
    var derivedSecretkey_wa = util.abv2wa(derivedSecretkey);
    
    var cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext_wa, 
        iv: iv_wa
    });

    var decryptedData = CryptoJS.AES.decrypt(cipherParams, derivedSecretkey_wa, { iv: iv_wa, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
    var resultBytes = util.wa2abv(decryptedData);
    return resultBytes;
};

EncryptionUtil.PBKDF2 = function (secretKey, salt, iterations, keyLength) {
    var salt_wa = util.abv2wa(salt);
    var derivedKey_wa = CryptoJS.PBKDF2(secretKey, salt_wa, { keySize: keyLength/32, iterations: iterations });
    var derivedKeyUint8Array = util.wa2abv(derivedKey_wa);
    return derivedKeyUint8Array;
};

//EncryptionUtil.decryptAesOld = function (data, key) {
//    var iv = data.subarray(4, 20);
//    var ciphertext = data.subarray(20, data.length);
//    
//    printBytes(key);
//    printBytes(iv);
//    printBytes(ciphertext);
//    
//    var iv_wa   = util.abv2wa(iv);
//    var ciphertext_wa = util.abv2wa(ciphertext);
//    var keyhash_wa = CryptoJS.MD5(key);
//    
//    var cipherParams = CryptoJS.lib.CipherParams.create({
//        ciphertext: ciphertext_wa, 
//        iv: iv_wa
//    });
//
//    var decryptedData = CryptoJS.AES.decrypt(cipherParams, keyhash_wa, { iv: iv_wa, mode: CryptoJS.mode.CBC, padding: CryptoJS.pad.Pkcs7});
//    var resultBytes = util.wa2abv(decryptedData);
//    return resultBytes;
//};

function printBytes(bytes) {
    var string = "";
    for (var i = 0; i < bytes.length; i++) {
        var out = 0;
        var b = bytes[i];
        if (b >= 128) {
            out = b -256;
        } else {
            out = b;
        }
        string = string + out + " ";
    }
    console.log(string);
}

function asn1DsaSignature(r, s) {
    r = positiveByteArray(r);
    s = positiveByteArray(s);
    var res = [48, r.length + s.length + 4, 2, r.length];
    res = res.concat(r);
    res.push(2);
    res.push(s.length);
    res = res.concat(s);
    return new Uint8Array(res);
}

function decodeAsn1DsaSignature(signature) {
    var rLength = signature[3];
    var r = signature.subarray(4, 4 + rLength);
    var sLength = signature[5 + rLength];
    var s = signature.subarray(6 + rLength, 6 + rLength + sLength);
    var result = { r : r, s : s };
    return result;
}

function positiveByteArray(uint8Array) {
    var arr = Array.apply([], uint8Array);
    while(arr.length > 1 && arr[0] === 0) arr.shift();
    if(arr[0] >= 0x80) arr.unshift(0);
    return arr;
}

function compareArrays(a, b) {
    if (!b) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
        if (a[i] != b[i]) return false;
    }
    return true;
}
    
function readBytes(view, offset) {
    var len = view.getInt32(offset);
    if(len < 0 || offset + 4 + len  > view.byteLength) throw { name : "HsEncoderError", message : "bad string length" };
    var arr = new Uint8Array(view.buffer, view.byteOffset + offset + 4, len);
    return { offset : offset + 4 + len, bytes : arr };
}

function readInt(buf, offset) { //Note that buf is a Uint8Array not a DataView
    return buf[offset] << 24 | 
    (0x00ff & buf[offset+1]) << 16 |  
    (0x00ff & buf[offset+2]) << 8  |
    (0x00ff & buf[offset+3]);
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

/*end*/})();
