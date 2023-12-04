//Provide an authInfo to the client
//Get the siteinfo from the service handle
//home a prefix at that site
//verify that the prefix home correctly 
//unhome the prefix and verify the unhoming
//Clean up by deleting all handles with prefix cnri.test.ben and sign out.

(function(){
"use strict";
    
module("cnri.hdl.util.HandleClient");

var client = cnri.util.TestUtil.client;
var authInfo = cnri.util.TestUtil.authInfo;
var prefixToHome = cnri.util.TestUtil.TEST_PREFIX+"TEST"; 
var site = null;

test("Home and unhome prefix", function() {
    stop(); //Tells the qUnit framework to wait until it gets the start command
    init();
});

function init() {
    client.setAuthInfo(authInfo);
    cnri.util.TestUtil.cleanUp(cnri.util.TestUtil.TEST_PREFIX, onInitComplete);
}

function onInitComplete() {
    var siteRetriever = new cnri.hdl.util.SiteRetriever(client, "0.NA/" + cnri.util.TestUtil.TEST_PREFIX, null, true, onGetSiteSuccess, onGetSiteError);
    siteRetriever.retrieve();
}


function onGetSiteSuccess(retrievedSite) {
    site = retrievedSite;
    homePrefix();
}

function onGetSiteError() {
    ok(false, "Could not retrieve site info");
    cleanUp();
}

function homePrefix() {
    client.homePrefixAtSite(prefixToHome, site, homePrefixSuccessCallback,  homePrefixErrorCallback);
}

function homePrefixSuccessCallback(response) {
    ok(response.handle.toUpperCase() === prefixToHome.toUpperCase(), "Home prefix success");
    unhomePrefix();
}

function homePrefixErrorCallback(e) {
    ok(false, "Home prefix error");
    cleanUp();
}

function unhomePrefix() {
    client.unhomePrefixAtSite(prefixToHome, site, unhomePrefixSuccessCallback,  unhomePrefixErrorCallback);
}

function unhomePrefixSuccessCallback(response) {
    ok(true, "Unhome prefix success");
    cleanUp();
}

function unhomePrefixErrorCallback(response) {
    ok(false, "Unhome prefix error");
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