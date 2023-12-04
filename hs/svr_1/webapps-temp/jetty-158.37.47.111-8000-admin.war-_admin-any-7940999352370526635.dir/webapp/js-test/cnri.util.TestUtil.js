(function(){
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var TestUtil = cnri.util.TestUtil = {};

cnri.util.EncryptionAsync.setPathToEncryptionWorker("../js/EncryptionWorker.js");

TestUtil.TEST_PREFIX = "11043";
//TestUtil.TEST_PREFIX = "cnri.test.handleserver";
//TestUtil.TEST_PREFIX = "cnri.test.ben";

var defaultClientConfig = {
        useProxyAsRoot : false,
        proxyUrl : "https://hdl.handle.net", 
        rootUrls : ["https://132.151.1.179:8000"] //root server running HSv8 with an https interface. Add other roots when they support v8 and https.
    };

var privateKeyInHex = "000000010000000C4453415F505249565F4B455900000015008B857CFEB8F59084488C2D176B39E6E9989D2C280000008100FD7F53811D75122952DF4A9C2EECE4E7F611B7523CEF4400C31E3F80B6512669455D402251FB593D8D58FABFC5F5BA30F6CB9B556CD7813B801D346FF26660B76B9950A5A49F9FE8047B1022C24FBBA9D7FEB7C61BF83B57E7C6A8A6150F04FB83F6D3C51EC3023554135A169132F675F3AE2B61D72AEFF22203199DD14801C700000015009760508F15230BCCB292B982A2EB840BF0581CF50000008100F7E1A085D69B3DDECBBCAB5C36B857B97994AFBBFA3AEA82F9574C0B3D0782675159578EBAD4594FE67107108180B449167123E84C281613B7CF09328CC8A6E13C167A8B547C8D28E0A3AE1E2BB3A675916EA37F0BFA213562F1FB627A01243BCCA4F1BEA8519089A883DFE15AE59F06928B665E807B552564014C3BFECF492A";
var privateKeyBytes = cnri.util.Encoder.Hex.bytes(privateKeyInHex);
var privateKey = cnri.util.EncryptionUtil.getPrivateKeyFromBytes(privateKeyBytes, 4);

var badPrivateKeyInHex = "000000010000000C4453415F505249565F4B455900000015008B857CFEB8F59084488C2D176B39E6E9989D2C280000008100FD7F53811D75122952DF4A9C2EECE4E7F611B7523CEF4400C31E3F80B6512669455D402251FB593D8D58FABFC5F5BA30F6CB9B556CD7813B801D346FF26660B76B9950A5A49F9FE8047B1022C24FBBA9D7FEB7C61BF83B57E7C6A8A6150F04FB83F6D3C51EC3023554135A169132F675F3AE2B61D72AEFF22203199DD14801C700000015009760508F15230BCCB292B982A2EB840BF0581CF50000008100F7E1A085D69B3DDECBBCAB5C36B857B97994AFBBFA3AEA82F9574C0B3D0782675159578EBAD4594FE67107108180B449167123E84C281613B7CF09328CC8A6E13C167A8B547C8D28E0A3AE1E2BB3A675916EA37F0BFA213562F1FB627A01243BCCA4F1BEA8519089A883DFE15AE59F06928B665E807B552564014C3BFECF4920";
var badPrivateKeyBytes = cnri.util.Encoder.Hex.bytes(badPrivateKeyInHex);
var badPrivateKey = cnri.util.EncryptionUtil.getPrivateKeyFromBytes(badPrivateKeyBytes, 4);

var authInfo = {
        id : "300:0.na/"+TestUtil.TEST_PREFIX, 
        mode : "HS_PUBKEY",
        privateKey : privateKey
};

var badAuthInfo = {
        id : "300:0.na/"+TestUtil.TEST_PREFIX, 
        mode : "HS_PUBKEY",
        privateKey : badPrivateKey
};

var secretKeyAuthInfo = {
        id : "501:0.na/"+TestUtil.TEST_PREFIX,
        mode : "HS_SECKEY",
        secretKey : "hello"
};

var basicAuthInfo = {
        id : "501:0.na/"+TestUtil.TEST_PREFIX,
        mode : "BASIC",
        secretKey : "hello"
};

var client = new cnri.hdl.util.HandleClient(defaultClientConfig);

TestUtil.badAuthInfo = badAuthInfo;
TestUtil.authInfo = authInfo;
TestUtil.secretKeyAuthInfo = secretKeyAuthInfo;
TestUtil.client = client;

TestUtil.deleteHandles = function (handlesArray, onAllHandlesDeleted) {
    var deferreds = [];
    for (var i = 0; i < handlesArray.length; i++) {
        var handleString = handlesArray[i];
        var deferred = deferredOfDel(handleString);
        deferreds.push(deferred);
    }
    $.when.apply(null, deferreds).always(onAllHandlesDeleted);
};

function deferredOfDel(handleString) {
    var deferred = new $.Deferred();
    client.del(handleString, function() { deferred.resolve(); }, function() { deferred.reject(); });
    return deferred;
}

function onDelSuccess() {}

function onDelError() {}

//Deletes all handles under a particular prefix
TestUtil.cleanUp = function (prefix, onCleanUpComplete) {
    var host = window.location.host;
    var url = "https://"+host;
    var maxHandlesToDelete = 1000;
    
    var onListHandlesCleanupSuccess = function (response) {
        var handlesArray = response.handles;
        TestUtil.deleteHandles(handlesArray, onCleanUpComplete);
        console.log(JSON.stringify(response));
    };

    function onListHandlesCleanupError(e) {
        console.log('error listing handles');
        onCleanUpComplete();
    }
    
    client.listHandlesAtUrl(prefix, url, 0, maxHandlesToDelete, onListHandlesCleanupSuccess, onListHandlesCleanupError);
};

TestUtil.createInitialHandles = function () {
    
};

TestUtil.createHandleJavaScriptObject = function (userId, handleString) {
    var idTokens = userId.split(":");
    var userIndex = idTokens[0];
    var userHandle = idTokens[1];
    var handleRecord = {
        "handle":handleString,
        "values":[
        {
            "index":100,
            "type":"HS_ADMIN",
            "data":{
                "format":"admin",
                "value":{
                    "handle":userHandle,
                    "index":userIndex,
                    "permissions":"111111111111"
                }
            },
        }
    ]
    };
    return handleRecord;
};

/*end*/})();