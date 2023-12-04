(function () {
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var callbacksToPromiseWithArgs = cnri.util.FunctionUtil.callbacksToPromiseWithArgs;

var HandleSignatureUtil = cnri.util.HandleSignatureUtil = {};

var digestSha1 = cnri.util.EncryptionAsync.digestSha1;
var digestSha256 = cnri.util.EncryptionAsync.digestSha256;

HandleSignatureUtil.digest = callbacksToPromiseWithArgs(3, function (handle, values, hashAlg, onSuccess, onFailure) {
    var promises = $.map(values, function (value) {
        var bytesToDigest = cnri.util.HsEncoder.Value.bytes(value).subarray(8);
        if (hashAlg === 'SHA-1' || hashAlg === 'SHA1') return digestSha1(bytesToDigest);
        else if (hashAlg === 'SHA-256' || hashAlg === 'SHA256') return digestSha256(bytesToDigest);
        else return $.Deferred().reject("Unknown algorithm " + alg);
    });
    $.when.apply($, promises).done(function (/*arguments*/) {
        var digestValues = [];
        for (var i = 0; i < values.length; i++) {
            var digestValue = {
                index : values[i].index,
                digest : cnri.util.Encoder.Base64.string(arguments[i].digest)
            };
            digestValues.push(digestValue);
        }
        onSuccess({
            alg : hashAlg,
            digests : digestValues
        });
    }).fail(onFailure);
});

function handleValueIndexCompare(a, b) {
    return a.index - b.index;
}

function addPromisesForVerifyDigest(promises, alg, value, digestValue) {
    var bytesToDigest = cnri.util.HsEncoder.Value.bytes(value).subarray(8);
    if (alg === 'SHA-256' || alg === 'SHA256') {
        promises.push(digestSha256(bytesToDigest).done(function (digest) {
            if (digestValue.verified === false) return;
            digestValue.verified = digestValue.digest === cnri.util.Encoder.Base64.string(digest.digest);
        }));
    } else if (alg === 'SHA-1' || alg === 'SHA1') {
        promises.push(digestSha1(bytesToDigest).done(function (digest) {
            if (digestValue.verified === false) return;
            digestValue.verified = digestValue.digest === cnri.util.Encoder.Base64.string(digest.digest);
        }));
    } else {
        promises.push($.Deferred().reject("Unknown algorithm " + alg));
    }
}

function getPromisesForVerifyDigest(alg, sortedValues, sortedDigestValues) {
    var promises = [];
    var valuesLoc = 0;
    var value = null;
    for (var i = 0; i < sortedDigestValues.length; i++) {
        var digestValueObj = sortedDigestValues[i];
        while ((value == null || value.index < digestValueObj.index) && valuesLoc < sortedValues.length) {
            value = sortedValues[valuesLoc];
            valuesLoc++;
        }
        if (value == null || value.index !== digestValueObj.index) {
            digestValueObj.verified = false;
        } else {
            addPromisesForVerifyDigest(promises, alg, value, digestValueObj);
        }
    }
    return promises;
}

/**
 * This function takes a handle, the values of a handle record, and an object describing a "digests".  
 * Note: The digests object is modified in-place to add "verified" boolean properties at each index. 
 */
HandleSignatureUtil.verifyDigests = callbacksToPromiseWithArgs(3, function (handle, values, digestsObj, onSuccess, onFailure) {
    var digestValuesCopy = digestsObj.digests.slice(); // copy in case client expects it to remain the same
    digestValuesCopy.sort(handleValueIndexCompare);
    var valuesCopy = values.slice();
    valuesCopy.sort(handleValueIndexCompare);
    var promises = getPromisesForVerifyDigest(digestsObj.alg, valuesCopy, digestValuesCopy);
    $.when.apply($, promises).done(function () { onSuccess(digestsObj); }).fail(onFailure);
});

function methodNameFragmentFromAlg(alg) {
    if (alg === 'SHA1withDSA') return 'DsaSha1';
    if (alg === 'SHA1withRSA') return 'RsaSha1';
    if (alg === 'SHA256withRSA') return 'RsaSha256';
    throw { name : 'HandleSignatureUtilError', message : 'Algorithm ' + alg + ' not supported' };
}

HandleSignatureUtil.sign = callbacksToPromiseWithArgs(6, function (handle, values, signer, signerIndex, privateKey, hashAlg, onSuccess, onFailure) {
    HandleSignatureUtil.digest(handle, values, hashAlg)
    .fail(onFailure)
    .then(function (digests) {
        var alg = null;
        var header = null;
        if (hashAlg === 'SHA-1' || hashAlg === 'SHA1') {
            alg = 'SHA1with' + privateKey.kty;
            header = '{"alg":"' + privateKey.kty.substring(0,2) + '160"}';
        } else if (hashAlg === 'SHA-256' || hashAlg === 'SHA256') {
            alg = 'SHA256with' + privateKey.kty;
            header = '{"alg":"' + privateKey.kty.substring(0,2) + '256"}';
        }
        try {
            var methodName = 'sign' + methodNameFragmentFromAlg(alg);
        } catch (e) {
            onFailure({ msg : e.message });
            return;
        }
        var headerBase64 = cnri.util.Encoder.Base64Url.string(cnri.util.Encoder.Utf8.bytes(header));
        var payload = {};
        payload.digests = digests;
        payload.iss = signerIndex + ':' + signer;
        payload.sub = handle;
        payload.iat = Math.floor(new Date().getTime() / 1000);
        payload.nbf = payload.iat;
        payload.exp = payload.iat + (2 * 365 * 24 * 60 * 60);
        var payloadBase64 = cnri.util.Encoder.Base64Url.string(cnri.util.Encoder.Utf8.bytes(JSON.stringify(payload)));
        var bytesToSign = cnri.util.Encoder.Utf8.bytes(headerBase64 + '.' + payloadBase64);
        cnri.util.EncryptionAsync[methodName](privateKey, bytesToSign)
        .fail(onFailure)
        .done(function (sig) {
            var sigBase64 = cnri.util.Encoder.Base64Url.string(sig.signature);
            onSuccess(headerBase64 + '.' + payloadBase64 + '.' + sigBase64); 
        });
    });
});

/**
 * This function takes a public key, and an object describing an HS_SIGNATURE signature handle value.  
 * Note: The signature object is modified in-place to add "verified" boolean property. 
 */
HandleSignatureUtil.verifySignature = callbacksToPromiseWithArgs(2, function (publicKey, signatureObj, onSuccess, onFailure) {
    var alg = HandleSignatureUtil.algFromJws(signatureObj.jws);
    try {
        var methodName = 'verify' + methodNameFragmentFromAlg(alg);
    } catch (e) {
        onFailure({ msg : e.message });
        return;
    }    
    var parts = signatureObj.jws.split('.');
    if (parts.length != 3) {
        onFailure("Unable to parse signature");
        return;
    }
    var bytesToVerify = cnri.util.HsEncoder.Utf8.bytes(parts[0] + '.' + parts[1]);
    cnri.util.EncryptionAsync[methodName](publicKey, bytesToVerify, cnri.util.Encoder.Base64Url.bytes(parts[2]))
    .fail(onFailure)
    .done(function (response) {
        signatureObj.verified = response.isVerified;
        onSuccess(signatureObj);
    });
});

HandleSignatureUtil.algFromJws = function(jws) {
    var parts = jws.split('.');
    if (parts.length != 3) {
        throw { name : 'HandleSignatureUtilError', message : 'Unable to parse signature' };
    }
    var headerPart = parts[0];
    var headerBytes = cnri.util.Encoder.Base64.bytes(headerPart);
    var headerString = cnri.util.Encoder.Utf8.string(headerBytes);
    var header = JSON.parse(headerString);
    var alg = header.alg;
    if (alg === 'DS160' || alg === 'DS128' || alg === 'DS' || alg === 'DSA') return 'SHA1withDSA';
    if (alg === 'RS160') return 'SHA1withRSA';
    if (alg === 'RS256') return 'SHA256withRSA';
    throw { name : 'HandleSignatureUtilError', message : 'Algorithm ' + alg + ' not supported' };
};

HandleSignatureUtil.payloadFromJws = function (jws) {
    var parts = jws.split('.');
    if (parts.length != 3) {
        throw { name : 'HandleSignatureUtilError', message : 'Unable to parse signature' };
    }
    var payloadPart = parts[1];
    var payloadBytes = cnri.util.Encoder.Base64.bytes(payloadPart);
    var payloadString = cnri.util.Encoder.Utf8.string(payloadBytes);
    return JSON.parse(payloadString);
};

/*end*/})();
