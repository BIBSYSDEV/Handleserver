//Provide an authInfo to the client
//Create a new handle called cnri.test.ben/qunit-1
//Resolve the newly created handle
//Modify cnri.test.ben/qunit-1
//Resolve cnri.test.ben/qunit-1 and assert that the modification persisted
//Clean up by deleting all handles with prefix cnri.test.ben and sign out.

(function(){
"use strict";
    
module("cnri.hdl.util.HandleClient");

var client = cnri.util.TestUtil.client;
var authInfo = cnri.util.TestUtil.authInfo;
var testHandleString = cnri.util.TestUtil.TEST_PREFIX+"/qunit-1"; 

test("Create a handle and then modify it", function() {
    stop(); //Tells the qUnit framework to wait until it gets the start command
    init();
});

function init() {
    client.setAuthInfo(authInfo);
    cnri.util.TestUtil.cleanUp(cnri.util.TestUtil.TEST_PREFIX, onInitComplete);
}

function onInitComplete() {
    createHandle();
}

function createHandle() {
    var handleRecord = cnri.util.TestUtil.createHandleJavaScriptObject(authInfo.id, testHandleString);
    client.create(handleRecord, onCreateSuccess, onCreateError);
}

function onCreateSuccess(handle) {
    ok(true, "Create success");
    resolveNewCreation();
}

function resolveNewCreation() {
    client.get(testHandleString, onGet1Success, onGetError);
}

function onGet1Success(handleRecord) {
    modifyHandle(handleRecord);
}

function modifyHandle(handleRecord) {
    var urlHandleValue = {
            "index": 101,
            "type": "URL",
            "data": {
                "format": "string",
                "value": "http://www.example.com"
            }
    };
    handleRecord.values.push(urlHandleValue);
    client.put(handleRecord, function () { onModifySuccess(handleRecord); }, onModifyError);
}

function onModifySuccess(handleRecord) {
    ok(true, "Modify success");
    modifyHandleAgain(handleRecord);
}

function modifyHandleAgain(handleRecord) {
    handleRecord = {handle: handleRecord.handle, values : [handleRecord.values[0]]};
    client.putIndex(handleRecord, handleRecord.values[0].index, onModifySuccessAgain, onModifyError);
}

function onModifySuccessAgain() {
    ok(true, "Modify success again");
    resolveHandle();
}

function onModifyError() {
    ok(false, "Modify error");
    cleanUp();
}

function resolveHandle() {
    client.get(testHandleString, onGet2Success, onGetError);
}

function onGet2Success(handleRecord) {
    ok(handleRecord.handle === testHandleString, "Get success");
    ok(handleRecord.values.length === 2, "handle contains new handle value");
    var urlHandleValue = handleRecord.values[1];
    ok(urlHandleValue.data === "http://www.example.com" || urlHandleValue.data.value === "http://www.example.com", "handle value contains correct data");
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