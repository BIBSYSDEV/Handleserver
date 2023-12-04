(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

var callbacksToPromiseWithArgs = cnri.util.FunctionUtil.callbacksToPromiseWithArgs;

function Session(authInfo, serverInfo, sessionTracker) {
    var HS_PUBKEY = "HS_PUBKEY";
    var HS_SECKEY = "HS_SECKEY";
    
    var self = this;
    var serverNonceString = null;
    var serverNonceBytes = null;
    var clientNonceBytes = null;
    var clientNonceString = null;
    var combinedNonceBytes = null;
    var signatureBytes = null;

    var onAuthenticateSuccessCallback = null;
    var onAuthenticateErrorCallback = null;
    var onSignOutSuccessCallback = null;
    var onSignOutErrorCallback = null;
    
    var authorizationHeaderString = null;
    
    function constructor() {
        self.serverInfo = serverInfo;
        self.authInfo = authInfo;
    }
    
    function authenticate(onAuthenticateSuccessCallbackParam, onAuthenticateErrorCallbackParam) {
        onAuthenticateSuccessCallback = onAuthenticateSuccessCallbackParam;
        onAuthenticateErrorCallback = onAuthenticateErrorCallbackParam;
        clientNonceBytes = generateClientNonceBytes();
        clientNonceString = cnri.util.Encoder.Base64.string(clientNonceBytes);
        startSession();
    }
    self.authenticate = callbacksToPromiseWithArgs(0, authenticate);
    
    function startSession() {
        var initialAuthorizationHeaderString = getInitialAuthorizationString();
        var url = serverInfo.url + "/api/sessions";
        $.ajax({
            type: "POST",
            dataType : "json",
            url : url,
            beforeSend: function (xhr){ 
                if (serverInfo.server) {
                    xhr.setRequestHeader('Authorization', initialAuthorizationHeaderString); 
                }
            },
            success : onStartSessionSuccess, 
            error : onStartSessionError,
            timeout: 3000
        });
    }
    
    function onStartSessionSuccess(response) {
        if (serverInfo.server) {
            var isServerVerified = verifyServerSignature(response);
            if (!isServerVerified) {
                // TODO Prefer not calling app.notifications here. Call the onAuthenticateErrorCallback instead
                app.notifications.alertWarning("The server's signature could not be verified with its public key.");
            }
        }
        serverNonceString = response.nonce;
        self.sessionId = response.sessionId;
        serverNonceBytes = cnri.util.Encoder.Base64.bytes(serverNonceString);
        if (authInfo.mode === HS_PUBKEY) {
            combinedNonceBytes = concatBytes(serverNonceBytes, clientNonceBytes);
            if (authInfo.privateKey.kty === "DSA") {
                cnri.util.EncryptionAsync.signDsaSha1(authInfo.privateKey, combinedNonceBytes, onSignedSuccess, onSignedError);
            } else {
                cnri.util.EncryptionAsync.signRsaSha1(authInfo.privateKey, combinedNonceBytes, onSignedSuccess, onSignedError);
            }
        } else if (authInfo.mode === HS_SECKEY) {
            var secretKeyBytes = cnri.util.Encoder.Utf8.bytes(authInfo.secretKey);
            var bytesToDigest = concatBytes4(secretKeyBytes, serverNonceBytes, clientNonceBytes, secretKeyBytes); 
            cnri.util.EncryptionAsync.digestSha1(bytesToDigest, onDigestedSuccess, onDigestedError);
        }
    }      
    
    function verifyServerSignature(response) {
        var serversSignature = response.serverSignature;
        if (serversSignature == undefined) {
            return false;
        } 
        var serversSignatureBytes = cnri.util.Encoder.Base64.bytes(serversSignature);
        var serverNonceBase64String = response.nonce;
        var serverNonceBytes = cnri.util.Encoder.Base64.bytes(serverNonceBase64String);
        var serversPublicKey = cnri.util.HandleUtil.publicKeyFromData(serverInfo.server.publicKey);
        var data = concatBytes(serverNonceBytes, clientNonceBytes);
        var isVerified = false;
        if (serversPublicKey.kty === "DSA") {
            if (response.serverAlg === "SHA-256" || response.serverAlg === "SHA256") {
                isVerified = cnri.util.EncryptionUtil.verifyDsaSha256(serversPublicKey, data, serversSignatureBytes);
            } else {
                isVerified = cnri.util.EncryptionUtil.verifyDsaSha1(serversPublicKey, data, serversSignatureBytes);
            }
        } else if (serversPublicKey.kty === "RSA") {
            if (response.serverAlg === "SHA-256" || response.serverAlg === "SHA256") {
                isVerified = cnri.util.EncryptionUtil.verifyRsaSha256(serversPublicKey, data, serversSignatureBytes);
            } else {
                isVerified = cnri.util.EncryptionUtil.verifyRsaSha1(serversPublicKey, data, serversSignatureBytes);
            }
        } else {
            throw "Servers public key is of unknown type.";
        }
        return isVerified; 
    }
    
    function isAuthenticated(successCallback, errorCallback) {
        var url = serverInfo.url + "/api/sessions/this";
        $.ajax({
            type: "POST",
            dataType : "json",
            url : url,
            success : function (response) {
                if (response.authenticated === true) {
                    self.id = response.id;
                    self.sessionId = response.sessionId;
                    if (self.authInfo == null) {
                        self.authInfo = {
                            id : response.id
                        };
                    }
                }
                response.session = self;
                successCallback(response); 
            },
            error : errorCallback
        });
    }
    self.isAuthenticated = callbacksToPromiseWithArgs(0, isAuthenticated);
    
    function onDigestedSuccess(response) {
        var digestBytes = response.digest;
        var digestString = cnri.util.Encoder.Base64.string(digestBytes);
        //console.log(digestString);
        sendAuthentication(digestString, HS_SECKEY);
    } 
    
    function onDigestedError(response) {
        console.log("onDigestedError");
    }
    
    function onSignedSuccess(response) {
        signatureBytes = response.signature;
        var signatureString = cnri.util.Encoder.Base64.string(signatureBytes);
        //console.log(signatureString);
        sendAuthentication(signatureString, HS_PUBKEY);
    }
    
    function signOut(onSignOutSuccessCallbackParam, onSignOutErrorCallbackParam) {
        onSignOutSuccessCallback = onSignOutSuccessCallbackParam;
        onSignOutErrorCallback = onSignOutErrorCallbackParam;
        var authorizationHeaderString = getMinimalAuthorizationString();
        var url = serverInfo.url + "/api/sessions/this";
        var promise = $.ajax({
            type: "DELETE",
            url: url,
            dataType : "json",
            beforeSend: function (xhr){ 
                xhr.setRequestHeader('Authorization', authorizationHeaderString); 
            },
            success: onSignOutSuccess,
            error: onSignOutError
        });
        return promise;
    }
    self.signOut = callbacksToPromiseWithArgs(0, signOut);
    
    function onSignOutSuccess(response) {
        if (onSignOutSuccessCallback !== null && onSignOutSuccessCallback !== undefined) {
            onSignOutSuccessCallback();
        }
    }
    
    function onSignOutError(response) {
        if (onSignOutErrorCallback !== null && onSignOutErrorCallback !== undefined) {
            onSignOutErrorCallback();
        }
    }
    
    function sendAuthentication(signatureString, type) {
        authorizationHeaderString = getAuthorizationString(signatureString, type);
        var url = serverInfo.url + "/api/sessions/this";
        $.ajax({
            type: "POST",
            url: url,
            dataType : "json",
            beforeSend: function (xhr){ 
                xhr.setRequestHeader('Authorization', authorizationHeaderString); 
            },
            success: onAuthenticateSuccess,
            error: onAuthenticateError
        });
    }
    
    function onAuthenticateSuccess(response) {
        response.session = self;
        if (response.authenticated === true && response.id === authInfo.id) {
            onAuthenticateSuccessCallback(response);
        } else {
            onAuthenticateErrorCallback(response);
        }
    }
    
    function onAuthenticateError(response) {
        response.session = self;
        onAuthenticateErrorCallback(response);
    }    
    
    function getAuthorizationString(signatureString, type) {
        var result =    'Handle ' +
                        'version="0", ' +
                        'sessionId="' + self.sessionId + '", ' +
                        'cnonce="' + clientNonceString + '", ' + 
                        'id="' + authInfo.id + '", ' + 
                        'type="' + type + '", ' + 
                        'alg="SHA1", ' + 
                        'signature="' + signatureString + '"';
        return result;
    }


    function getExistingSessionAuthorizationString() {
        return authorizationHeaderString;
    }
    self.getExistingSessionAuthorizationString = getExistingSessionAuthorizationString;
    
    function getMinimalAuthorizationString() {
        var result =    'Handle ' +
                        'version="0", ' +
                        'sessionId="' + self.sessionId + '"';
        return result;
    }
    self.getMinimalAuthorizationString = getMinimalAuthorizationString;
    
    function getInitialAuthorizationString() {
        var result =    'Handle ' +
                        'version="0", ' +
                        'cnonce="' + clientNonceString + '"';
        return result;
    }
    
    function onSignedError(response) {
        console.log("Signing error");
    }
    
    function onStartSessionError(response) {
        console.log("onStartSessionError");
        onAuthenticateErrorCallback(response);
    }
    
    function generateClientNonceBytes() {
        return libpolycrypt.random(16);
    }
    
    function concatBytes(a, b) {
        var result = new Uint8Array(a.byteLength + b.byteLength);
        result.set(new Uint8Array(a), 0); //TEST without new
        result.set(new Uint8Array(b), a.byteLength);
        return result;
    }
    
    function concatBytes4(a, b, c, d) {
        var result = new Uint8Array(a.byteLength + b.byteLength + c.byteLength + d.byteLength);
        result.set(new Uint8Array(a), 0);
        result.set(new Uint8Array(b), a.byteLength);
        result.set(new Uint8Array(c), a.byteLength + b.byteLength);
        result.set(new Uint8Array(d), a.byteLength + b.byteLength + c.byteLength);
        return result;
    }
    
    constructor();
}
cnri.hdl.util.Session = Session;
/*end*/})();