//Provide an authInfo to the client
//Create a new handle called cnri.test.ben/qunit-1
//Resolve cnri.test.ben/qunit-1
//Clean up by deleting all handles with prefix cnri.test.ben and sign out.

(function(){
"use strict";
    
module("cnri.hdl.util.HandleClient");

var client = cnri.util.TestUtil.client;
var basicAuthInfo = cnri.util.TestUtil.secretKeyAuthInfo;
var testHandleString = cnri.util.TestUtil.TEST_PREFIX+"/qunit-1"; 

test("Basic auth create and resolve", function() {
    stop(); //Tells the qUnit framework to wait until it gets the start command
    init();
});

function init() {
    client.setAuthInfo(basicAuthInfo);
    cnri.util.TestUtil.cleanUp(cnri.util.TestUtil.TEST_PREFIX, onInitComplete);
}

function onInitComplete() {
    createHandle();
}

function createHandle() {
    var handleRecord = cnri.util.TestUtil.createHandleJavaScriptObject(basicAuthInfo.id, testHandleString);
    client.create(handleRecord, onCreateSuccess, onCreateError);
}

function onCreateSuccess(handle) {
    ok(true, "Create success");
    resolveHandle();
}

function resolveHandle() {
    client.get(testHandleString, onGetSuccess, onGetError);
}

function onGetSuccess(handleRecord) {
    ok(handleRecord.handle === testHandleString, "Get success");
    cleanUp();
}

function onGetError(e) {
    ok(false, "Get error");
    cleanUp();
}

function onCreateError(response) {
    ok(false, "Create error");
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