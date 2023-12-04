//Test the local authenticator by providing it with a private key in an authInfo

(function(){
"use strict";
    
module("cnri.hdl.util.HandleClient");

var client = cnri.util.TestUtil.client;
var authInfo = cnri.util.TestUtil.authInfo;

test("LocalAuthenticator HS_PUBKEY", function() {
    stop(); //Tells the qUnit framework to wait until it gets the start command
    init();
});

function init() {
    cnri.util.TestUtil.cleanUp(cnri.util.TestUtil.TEST_PREFIX, onInitComplete);
}

function onInitComplete() {
    var localAuthenticator = new cnri.hdl.util.LocalAuthenticator(authInfo, client);
    localAuthenticator.authenticate(true, onLocalAuthenticateSuccess, onLocalAuthenticateError);
}

function onLocalAuthenticateSuccess() {
    ok(true, "LocalAuthenticator success");
    cleanUp();
}

function onLocalAuthenticateError(e) {
    ok(false);
    cleanUp();
}

function cleanUp() {
    cnri.util.TestUtil.cleanUp(cnri.util.TestUtil.TEST_PREFIX, onCleanUpComplete);
}

function onCleanUpComplete() {
    start(); //now that the chain of callbacks has finished tell the qUnit framework to resume with the tests.
}


/*end*/})();