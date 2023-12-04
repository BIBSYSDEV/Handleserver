(function(window){
//"use strict";

window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var callbacksToPromiseWithArgs = cnri.util.FunctionUtil.callbacksToPromiseWithArgs;

var EncryptionAsync = cnri.util.EncryptionAsync = {};

var encryptionWorker = null;

var callbacks = new Array();

function startWorkerThread() {
    encryptionWorker = new Worker(getPathToEncryptionWorker());
    encryptionWorker.onmessage = handleWorkerResponse;
    encryptionWorker.onerror = handleWorkerError;
}

function getPathToEncryptionWorker() {
    if (cnri.util.EncryptionAsync.pathToEncryptionWorker !== undefined) {
        return cnri.util.EncryptionAsync.pathToEncryptionWorker;
    } else {
        return "js/EncryptionWorker.js";
    }
}

function setPathToEncryptionWorker(path) {
    cnri.util.EncryptionAsync.pathToEncryptionWorker = path;
}
cnri.util.EncryptionAsync.setPathToEncryptionWorker = setPathToEncryptionWorker;

function handleWorkerResponse(e) {
    if(e.data.log) {
        console.log(e.data.log);
    } else {
        var responseCallBacks = callbacks.pop();
        responseCallBacks.onComplete(e.data);
    }
} 

function handleWorkerError(e) {
    var responseCallBacks = callbacks.pop();
    responseCallBacks.onError(e);
}

function storeCallBacks(onComplete, onError) {
    var responseCallBacks = {
            onComplete : onComplete,
            onError : onError
    };
    callbacks.unshift(responseCallBacks);
}

function postMessage(message) {
    if (encryptionWorker === null) {
        startWorkerThread();
    }
    encryptionWorker.postMessage(message);
}

EncryptionAsync.digestSha1 = callbacksToPromiseWithArgs(1, function (data, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "digestSha1",
            data : data
    };
    postMessage(message);
});

EncryptionAsync.digestSha256 = callbacksToPromiseWithArgs(1, function (data, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "digestSha256",
            data : data
    };
    postMessage(message);
});

EncryptionAsync.signRsaSha1 = callbacksToPromiseWithArgs(2, function (privateKey, data, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "signRsaSha1",
            privateKey : privateKey,
            data : data
    };
    postMessage(message);
});

EncryptionAsync.signDsaSha1 = callbacksToPromiseWithArgs(2, function (privateKey, data, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "signDsaSha1",
            privateKey : privateKey,
            data : data
    };
    postMessage(message);
});

EncryptionAsync.signDsaSha1WithK = callbacksToPromiseWithArgs(3, function (privateKey, data, K, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "signDsaSha1WithK",
            privateKey : privateKey,
            data : data, 
            K : K
    };
    postMessage(message);
});

EncryptionAsync.signRsaSha256 = callbacksToPromiseWithArgs(2, function (privateKey, data, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "signRsaSha256",
            privateKey : privateKey,
            data : data
    };
    postMessage(message);
});

EncryptionAsync.verifyRsaSha256 = callbacksToPromiseWithArgs(3, function (publicKey, data, signature, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "verifyRsaSha256",
            publicKey : publicKey,
            data : data, 
            signature : signature
    };
    postMessage(message);
});

EncryptionAsync.verifyRsaSha1 = callbacksToPromiseWithArgs(3, function (publicKey, data, signature, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "verifyRsaSha1",
            publicKey : publicKey,
            data : data, 
            signature : signature
    };
    postMessage(message);
});

EncryptionAsync.verifyDsaSha1 = callbacksToPromiseWithArgs(3, function (publicKey, data, signature, onComplete, onError) {
    storeCallBacks(onComplete, onError);
    var message = {
            cmd : "verifyDsaSha1",
            publicKey : publicKey,
            data : data, 
            signature : signature
    };
    postMessage(message);
});

/*end*/})(this);