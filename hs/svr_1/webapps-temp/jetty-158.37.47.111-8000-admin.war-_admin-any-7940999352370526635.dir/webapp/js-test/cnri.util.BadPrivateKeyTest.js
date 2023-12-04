//Provide a bad authInfo to the client
//Attempt to create a handle and assert that the create fails.

(function(){
"use strict";
    
module("cnri.hdl.util.HandleClient");

var client = cnri.util.TestUtil.client;
var badAuthInfo = cnri.util.TestUtil.badAuthInfo;
var authInfo = cnri.util.TestUtil.authInfo;
var testHandleString = cnri.util.TestUtil.TEST_PREFIX+"/qunit-1"; 

test("Test fail of create with bad key", function() {
    stop(); //Tells the qUnit framework to wait until it gets the start command
    init();
});

function init() {
    notDeepEqual(badAuthInfo, authInfo, "Auth infos are different");
    client.setAuthInfo(authInfo);
    cnri.util.TestUtil.cleanUp(cnri.util.TestUtil.TEST_PREFIX, onInitComplete);
}

function onInitComplete() {
    client.signOut(onInitialSignOutSuccess, onInitialSignOutError);
}

function onInitialSignOutSuccess() {
    client.setAuthInfo(badAuthInfo);
    createHandle();
}

function onInitialSignOutError() {
    client.setAuthInfo(badAuthInfo);
    createHandle();
}

function createHandle() {
    var handleRecord = cnri.util.TestUtil.createHandleJavaScriptObject(badAuthInfo.id, testHandleString);
    client.create(handleRecord, onCreateSuccess, onCreateError);
}

function onCreateSuccess(handle) {
    ok(false, "Should not have been able to create with bad auth info");
    cleanUp();
}

function onCreateError(response) {
    ok(true, "Server regects create when using bad auth info");
    cleanUp();
}

function cleanUp() {
    cnri.util.TestUtil.cleanUp(cnri.util.TestUtil.TEST_PREFIX, onCleanUpComplete);
}

function onCleanUpComplete() {
    client.signOut(onSignOutSuccess, onSignOutError);
}

function onSignOutSuccess() {
    ok(true, "onSignOutSuccess");
    start(); //now that the chain of callbacks has finished tell the qUnit framework to resume with the tests.
}

function onSignOutError() {
    ok(true, "onSignOutError");
    start(); //now that the chain of callbacks has finished tell the qUnit framework to resume with the tests.
}

/*end*/})();