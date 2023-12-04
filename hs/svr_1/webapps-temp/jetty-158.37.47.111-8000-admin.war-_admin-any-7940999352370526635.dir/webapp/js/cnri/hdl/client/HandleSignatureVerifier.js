(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function HandleSignatureVerifier(client, handleRecord) {
    var self = this;
    var signatures = null;
    var clientVerificationCompleteCallback = null;
    var verificationResults = null;
    
    function constructor() {
        verificationResults = {
                signatureErrors : {},
                signedValuesResults : {} 
        };
    }
    
    function verify(onVerificationCompleteCallback) {
        try {
            clientVerificationCompleteCallback = onVerificationCompleteCallback;
            var signatureHandleValues = cnri.util.HandleUtil.getHandleValuesByType(handleRecord, "HS_SIGNATURE");
            signatures = parseSignatureHandleValues(signatureHandleValues);
            detectMissingHandleValues();
            verifyAllDigests();
        } catch (err) {
            if (err.message) verificationResults.errorMessage = err.message;
            else verificationResults.errorMessage = err;
            clientVerificationCompleteCallback(verificationResults);
        }
    }
    self.verify = verify;
    
    function detectMissingHandleValues() {
        for (var i = 0; i < signatures.length; i++) {
            var signature = signatures[i];
            var digests = null;
            if (signature && signature.digests) digests = signature.digests.digests;
            if (digests) {
                for (var j = 0; j < digests.length; j++) {
                    var digestIndex = digests[j].index;
                    var handleValue = cnri.util.HandleUtil.getHandleValueAtIndex(handleRecord, digestIndex);
                    if (handleValue === null) {
                        //A signature references a digest that references a missing handle value
                        var signatureErrors = getOrCreateSignatureErrorsFor(signature.handleValueIndex);
                        signatureErrors.missingHandleValues[digestIndex] = true;
                    }
                }
            }
        }
    }

    function getOrCreateSignatureErrorsFor(signatureHandleValueIndex) {
        var signatureErrors = verificationResults.signatureErrors[signatureHandleValueIndex];
        if (signatureErrors === undefined) {
            signatureErrors = {
                    signatureHandleValueIndex : signatureHandleValueIndex,
                    missingHandleValues : {},
                    signatureNotOfCurrentHandleRecord : false,
                    payloadError : false
            };
            verificationResults.signatureErrors[signatureHandleValueIndex] = signatureErrors;
        }
        return signatureErrors;
    } 
    
    function verifyAllDigests() {
        var promises = $.map(signatures, function (signature) {
            var promiseToVerifyDigestsObject = cnri.util.HandleSignatureUtil.verifyDigests(handleRecord.handle, handleRecord.values, signature.digests);
            return promiseToVerifyDigestsObject;
        });
        
        $.when.apply($, promises).done(function (/*arguments*/) {
            getAllNeededPublicKeys();
        }).fail(function (err) {
            verificationResults.errorMessage = "Error verifying digests: " + err;
            clientVerificationCompleteCallback(verificationResults);
        });
    }
    
    function getAllNeededPublicKeys() {
        var neededPublicKeyIdentities = getAllNeededPublicKeyIdentities(signatures);
        var promises = $.map(neededPublicKeyIdentities, function (neededPublicKey) {
            var signerHandle = neededPublicKey.signerHandle;
            var promiseToReturnHandleRecord = client.getGlobally(signerHandle);
            promiseToReturnHandleRecord.done(function (signerHandleRecord) {
                var publicKeyHandleValue = cnri.util.HandleUtil.getHandleValueAtIndex(signerHandleRecord, neededPublicKey.signerIndex);
                neededPublicKey.publicKeyHandleValue = publicKeyHandleValue;
                var publicKey = cnri.util.HandleUtil.publicKeyFromHandleValue(publicKeyHandleValue);
                neededPublicKey.publicKey = publicKey;
            });
            return promiseToReturnHandleRecord;
        });
        $.when.apply($, promises).done(function (/*arguments*/) {
            verifyAllSignatures(neededPublicKeyIdentities);
        }).fail(function (response) {
            verificationResults.errorMessage = "Error getting public key: " + response;
            clientVerificationCompleteCallback(verificationResults);
        });
    }
    
    function verifyAllSignatures(neededPublicKeyIdentities) {
        var sigObjectToVerify = []; //Sig objects that need to be verified
        var publicKeyMap = neededPublicKeysToMap(neededPublicKeyIdentities);
        for (var i = 0; i < signatures.length; i++) {
            var signature = signatures[i];
            if (signature.sub === handleRecord.handle) { //don't add sig to sigObjectToVerify if the hdl on the signature object is not the handle on this handleRecord
                var sigIdentityString = signature.iss;
                var publicKey = publicKeyMap[sigIdentityString];
                signature.publicKey = publicKey;
                sigObjectToVerify.push(signature);
            } else {
                var signatureErrors = getOrCreateSignatureErrorsFor(signature.handleValueIndex);
                signatureErrors.signatureNotOfCurrentHandleRecord = true;
            }
        }
        var promises = $.map(sigObjectToVerify, function (sig) {
            var promiseToVerifySignature = cnri.util.HandleSignatureUtil.verifySignature(sig.publicKey, sig);
            return promiseToVerifySignature;
        });
        $.when.apply($, promises).done(function (/*arguments*/) {
            onAllSignaturesVerified(sigObjectToVerify);
        }).fail(function (err) {
            console.log(err);
            verificationResults.errorMessage = "Error verifying signature: " + err;
            clientVerificationCompleteCallback(verificationResults);
        });
    }
    
    function onAllSignaturesVerified(sigObjectToVerify) {
        for (var i = 0; i < sigObjectToVerify.length; i++) {
            var sig = sigObjectToVerify[i];
            var sigIdentityString = sig.iss;
            var digestsForSig = sig.digests;
            for (var j = 0; j < digestsForSig.digests.length; j++) {
                var digest = digestsForSig.digests[j];
                var digestForValueIndex = digest.index;
                var verificationResult = verificationResults.signedValuesResults[digestForValueIndex];
                if (verificationResult === undefined) {
                    verificationResult = {
                            verifiedSigners : [],
                            problemSigners : []
                    };
                    verificationResults.signedValuesResults[digestForValueIndex] = verificationResult;
                }
                if (digest.verified === false || sig.verified === false) {
                    verificationResult.problemSigners.push(sigIdentityString);
                } else {
                    verificationResult.verifiedSigners.push(sigIdentityString);
                }
            }
        }
        clientVerificationCompleteCallback(verificationResults);
    }
    
    function neededPublicKeysToMap(neededPublicKeyIdenties) {
        var publicKeyMap = {};
        for (var i = 0; i < neededPublicKeyIdenties.length; i++) {
            var neededPublicKey = neededPublicKeyIdenties[i];
            var identityString = neededPublicKey.signerIndex + ":" + neededPublicKey.signerHandle;
            publicKeyMap[identityString] = neededPublicKey.publicKey;
        }
        return publicKeyMap;
    }
    
    function getAllNeededPublicKeyIdentities(signatures) {
        var neededPublicKeys = [];
        for (var j = 0; j < signatures.length; j++) {
            var sig = signatures[j];
            var parts = sig.iss.split(':');
            if (parts.length != 2) {
                throw { name : 'HandleSignatureVerifierError', message : 'Unable to parse issuer' };
            }
            var signerHandle = parts[1];
            var signerIndex = parseInt(parts[0], 10);
            var neededPublicKey = {
                    signerIndex : signerIndex,
                    signerHandle : signerHandle
            };
            neededPublicKeys.push(neededPublicKey);
        }
        return neededPublicKeys;
    }
    
    function parseSignatureHandleValues(signatureHandleValues) {
        var signatures = [];
        for (var i = 0; i < signatureHandleValues.length; i++) {
            var signatureHandleValue = signatureHandleValues[i];
            var signatureJws = signatureHandleValue.data.value;
            try {
                var signature = cnri.util.HandleSignatureUtil.payloadFromJws(signatureJws);
                signature.handleValueIndex = signatureHandleValue.index;
                signature.jws = signatureJws;
                signatures.push(signature);
            } catch (err) {
                var signatureErrors = getOrCreateSignatureErrorsFor(signatureHandleValue.index, null);
                signatureErrors.payloadError = true;
            } 
        }
        return signatures;
    }
    
    constructor();
}

cnri.hdl.util.HandleSignatureVerifier = HandleSignatureVerifier;
/*end*/})();