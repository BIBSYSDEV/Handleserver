(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

var callbacksToPromiseWithArgs = cnri.util.FunctionUtil.callbacksToPromiseWithArgs;

function LocalAuthenticator(authInfo, client) {
    var HS_PUBKEY = "HS_PUBKEY";
    var HS_SECKEY = "HS_SECKEY";
    
    var self = this;
    var id = null;
    var privateKey = null;

    function constructor() { 
        privateKey = authInfo.privateKey;
    }
    
    function authenticate(useGlobalForId, onAuthenticateSuccessCallbackParam, onAuthenticateErrorCallbackParam) {
        self.onAuthenticateSuccessCallbackParam = onAuthenticateSuccessCallbackParam;
        self.onAuthenticateErrorCallbackParam = onAuthenticateErrorCallbackParam;
        if (authInfo.mode === HS_SECKEY) {
            var response = {
                    msg : "Cannot do local authentication of secret key."
            };
            onAuthenticateErrorCallbackParam(response);
        } else {
            id = parseId(authInfo.id);
            if (useGlobalForId === undefined || useGlobalForId === null || useGlobalForId === true) {
                client.getGlobally(id.handle, onGetIdHandleSuccess, onGetIdHandleError);
            } else {
                client.get(id.handle, onGetIdHandleSuccess, onGetIdHandleError);
            }
        }
    }
    self.authenticate = callbacksToPromiseWithArgs(1, authenticate);
    
    function onGetIdHandleSuccess(handleRecord) {
        var index = parseInt(id.index);
        if (index !== 0) {
            verifyPublicKeyInHandleRecordWithKnownIndex(index, handleRecord);
        } else {
            verifyPublicKeyInHandleRecordWithoutKnownIndex(handleRecord);
        }
    } 
    
    function verifyPublicKeyInHandleRecordWithKnownIndex(index, handleRecord) {
        var publicKeyHandleValue = getIndexFromHandleRecord(index, handleRecord);
        if (publicKeyHandleValue == null) {
            var response = {
                    msg : "Handle " + handleRecord.handle + " does not have a value at index " + id.index
            };
            self.onAuthenticateErrorCallbackParam(response);
        } else if (publicKeyHandleValue.type !== HS_PUBKEY) {
            var response = {
                    msg :  id.index + ":" + handleRecord.handle + " is not of type HS_PUBKEY"
            };
            self.onAuthenticateErrorCallbackParam(response);
        } else {
            //var publicKey = cnri.util.HandleUtil.publicKeyFromHandleValue(publicKeyHandleValue);
            var publicKey = publicKeyHandleValue.data.value;
            var keyPairVerifier = new KeyPairVerifier(publicKey, privateKey);
            keyPairVerifier.testKeyPair(onVerifyCompleteCallback);
        }
    }
    
    function verifyPublicKeyInHandleRecordWithoutKnownIndex(handleRecord) {
        var publicKeysArray = getPublicKeysFromHandleRecord(handleRecord);
        if (publicKeysArray.length === 0) {
            var response = {
                    isVerified : false,
                    msg : "No public key found in handle."
            };
            self.onAuthenticateErrorCallbackParam(response);
        }
        var keyListVerifier = new KeyListVerifier(publicKeysArray, privateKey);
        keyListVerifier.testKeyList(onVerifyCompleteCallback);
    }
    
    function onVerifyCompleteCallback(response) {
        if (response.isVerified) {
            self.onAuthenticateSuccessCallbackParam();
        } else {
            self.onAuthenticateErrorCallbackParam(response);
        }
    }
    
    function onGetIdHandleError(response) {
        self.onAuthenticateErrorCallbackParam(response);
    }
    
    function getPublicKeysFromHandleRecord(handleRecord) {
        handleRecord.values.sort(cnri.util.HandleUtil.indexComparator);
        var publicKeysArray = new Array();
        for (var i = 0; i < handleRecord.values.length; i++) {
            var value = handleRecord.values[i];
            if (value.type === "HS_PUBKEY") {
                //var publicKey = cnri.util.HandleUtil.publicKeyFromHandleValue(value);
                var publicKey = value.data.value;
                publicKeysArray.push(publicKey);
            }
        }
        return publicKeysArray;
    }
    
    function getIndexFromHandleRecord(index, handleRecord) {
        for (var i = 0; i < handleRecord.values.length; i++) {
            var value = handleRecord.values[i];
            if (value.index === index) {
                return value;
            }
        }
        return null;
    }
    
    function parseId(id) {
        var tokens = id.split(":");
        var result = {
                index : tokens[0],
                handle : tokens[1]
        };
        return result;
    } 
    
    constructor();
}
cnri.hdl.util.LocalAuthenticator = LocalAuthenticator;
/*end*/})();