//Provide an authInfo to the client
//Create 10 new handles with the prefix cnri.test.ben
//Get the siteinfo from the service handle
//list handles for cnri.test.ben and verify that the count is indeed 10
//Clean up by deleting all handles with prefix cnri.test.ben and sign out.

(function(){
"use strict";
    
module("cnri.hdl.util.HandleClient");

var client = cnri.util.TestUtil.client;
var authInfo = cnri.util.TestUtil.authInfo;
var testHandleString = cnri.util.TestUtil.TEST_PREFIX+"/qunit-"; 
var createHandleCount = 0;
var numHandlesToCreate = 10;

test("Create 10 handles and then call list handles", function() {
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
    var handleRecord = cnri.util.TestUtil.createHandleJavaScriptObject(authInfo.id, testHandleString + createHandleCount);
    client.create(handleRecord, onCreateSuccess, onCreateError);
}

function onCreateSuccess(handle) {
    ok(true, "Create success");
    createHandleCount = createHandleCount +1;
    if (createHandleCount < numHandlesToCreate) {
        createHandle();
    } else {
        var siteRetriever = new cnri.hdl.util.SiteRetriever(client, "0.NA/" + cnri.util.TestUtil.TEST_PREFIX, null, true, onGetSiteSuccess, onGetSiteError);
        siteRetriever.retrieve();
    }
}

function onGetSiteSuccess(site) {
    listHandles(site);
}

function onGetSiteError() {
    ok(false, "Could not retrieve site info");
    cleanUp();
}

function listHandles(site) {
    client.listHandlesAtSite(cnri.util.TestUtil.TEST_PREFIX, site, 0, 100, listHandlesSuccessCallback,  listHandlesErrorCallback);
}

function listHandlesSuccessCallback(response) {
    var handles = response.handles;
    ok(handles.length === 10, "List handles success");
    cleanUp();
}

function listHandlesErrorCallback(e) {
    ok(false, "List handles error");
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