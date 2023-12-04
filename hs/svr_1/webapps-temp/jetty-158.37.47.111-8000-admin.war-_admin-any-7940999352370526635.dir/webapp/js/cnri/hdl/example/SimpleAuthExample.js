var serverUrl = "https://localhost:8000";
var idIndex = 310;
var idHandle = "0.NA/CNRI.TEST.BEN";
var privateKey = {
    "kty": "RSA",
    "n": "AMKgyDR6MW5lxwXt83oWKFKHJZ5A0aqnQyUCbF2Pj78U44vGACuZrkoZvc38CVTPrBWNbaW53fqpTsHZqdc2Cuk9RHrObv_ASj-Y3sBJgZ2swM-8Ll5LarM6gUnRzgtVUgpYFV6N-GegNujsM-qz17L2VcrajoxTkavU_hBUkmKx",
    "e": "AQAB",
    "d": "F_sNkAG6U3rw4dcm19UhFMIYLX6ZFujTCh1ZUtHciVO-kbtMzBJ8eh7f1yCF2dBYyLMLXo8fPcJctN_n4F-FSm7CO2vPlSZvX-baeq8tmxwITUYEYZKK6DuMOQT-DN4wjCA8wtUP7lLwbuXdq4DcYpfOje-MbjqlrbEvGumH4tE"
}; 
var handleToCreate = "TEST/12345";

var authInfo = {
    id : idIndex + ":" + idHandle,
    mode : "HS_PUBKEY",
    privateKey : privateKey
};

var handleRecordToCreate = {
    "handle": handleToCreate,
    "values":[
        {
            "index":100,
            "type":"HS_ADMIN",
            "data": {
                "format":"admin",
                "value": {
                    "handle": idHandle,
                    "index": idIndex,
                    "permissions":"111111111111"
                }
            }
        },
        {
            "index":1,
            "type":"URL",
            "data": {
                "format":"string",
                "value": "http://example.com"
            }
        }
    ]
};

/**
 * The main function.
 */
$(document).ready(function() {
    var clientNonceBytes = libpolycrypt.random(16); // 16 random bytes as a Uint8Array
    var clientNonceString = encodeBase64(clientNonceBytes);
    var sessionId;
    startSession(clientNonceString)
    .then(function (response) {
        sessionId = response.sessionId;
        var serverNonceString = response.nonce;
        return sendAuthenticationForSession(sessionId, serverNonceString, clientNonceString);
    }).then(function (response) {
        return createHandleRecord(sessionId, handleRecordToCreate);
    }).then(function (response) {
        console.log("Handle created.");
    }).fail(function (jqXHR, status, error) {
        console.log(status);
        if (error) console.log(error);
        if (jqXHR.responseText) console.log(jqXHR.responseText);
    });
});

function startSession(clientNonceString) {
    var initialAuthorizationHeaderString = 'Handle cnonce="' + clientNonceString + '"';
    var url = serverUrl + "/api/sessions";
    return $.ajax({
        type: "POST",
        dataType : "json",
        url : url,
        beforeSend: function (xhr) { 
            xhr.setRequestHeader('Authorization', initialAuthorizationHeaderString); 
        }
    });
}

function sendAuthenticationForSession(sessionId, serverNonceString, clientNonceString) {
    if (authInfo.mode === "HS_SECKEY") {
        console.log("HS_SECKEY is not supported in this example");
        return;
    }
    if (authInfo.privateKey.kty === "DSA") {
        console.log("DSA keys not supported in this example");
        return;
    }
    var serverNonceBytes = decodeBase64(serverNonceString);
    var clientNonceBytes = decodeBase64(clientNonceString);
    var combinedNonceBytes = concatBytes(serverNonceBytes, clientNonceBytes);
    var signatureBytes = signRsaSha1(authInfo.privateKey, combinedNonceBytes);
    var signatureString = encodeBase64(signatureBytes);
    var authorizationHeaderString = 'Handle ' +
        'sessionId="' + sessionId + '", ' +
        'cnonce="' + clientNonceString + '", ' + 
        'id="' + authInfo.id + '", ' + 
        'type="' + authInfo.mode + '", ' + 
        'alg="SHA1", ' + 
        'signature="' + signatureString + '"';
    var url = serverUrl + "/api/sessions/this";
    return $.ajax({
        type: "POST",
        url: url,
        dataType : "json",
        beforeSend: function (xhr){ 
            xhr.setRequestHeader('Authorization', authorizationHeaderString); 
        }
    });
}

function createHandleRecord(sessionId, handleRecord) {
    var authorizationString =  'Handle sessionId="' + sessionId + '"';
    var url = serverUrl + "/api/handles/" + handleRecord.handle;
    return $.ajax({
        url : url,
        type : "PUT",
        data : JSON.stringify(handleRecord),
        contentType : "application/json; charset=utf-8",
        dataType : "json",
        beforeSend: function (xhr){ 
            xhr.setRequestHeader('Authorization', authorizationString); 
        }
    });
}

function concatBytes(a, b) {
    var result = new Uint8Array(a.byteLength + b.byteLength);
    result.set(a, 0); 
    result.set(b, a.byteLength);
    return result;
}

function signRsaSha1(privateKey, data) {
    var n = decodeBase64(privateKey.n);
    var e = decodeBase64(privateKey.e);
    var d = decodeBase64(privateKey.d);
    var signature = libpolycrypt.sign_pkcs1_sha1(n, e, d, data);
    return signature;
}
