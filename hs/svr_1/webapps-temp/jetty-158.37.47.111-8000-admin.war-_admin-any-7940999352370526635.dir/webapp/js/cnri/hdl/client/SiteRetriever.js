(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

function SiteRetriever(client, handleString, index, usePrimarySite, clientSuccessCallback, clientErrorCallback) {
    var self = this;
    
    var retrievedSite = null;
    
    function constructor() {}

    function retrieve() {
        client.getGlobally(handleString, onGetSiteHandleSuccess, onGetSiteHandleError);
    }
    self.retrieve = retrieve;
    
    function onGetSiteHandleSuccess(handleRecord) {
        var sites = getSites(handleRecord);
        var site = null;
        if (usePrimarySite) {
            site = getPrimarySite(sites);
        } else {
            site = getSiteWithIndex(sites, index);
        }
        if (site == null) {
            clientErrorCallback({ message : "Handle does not contain specified site."});
        } else {
            retrievedSite = site.data.value;
            retrievedSite.ttl = site.ttl;
            retrievedSite.retrievalTimestamp = getUnixTime();
            clientSuccessCallback(retrievedSite);
        }
    }
    
    function getUnixTime() {
        var now = new Date();
        var nowSeconds = Math.round(now.getTime() / 1000);
        return nowSeconds;
    }
    
    function getRetrievedSite() {
        return retrievedSite;
    }
    self.getRetrievedSite = getRetrievedSite;
    
    function getPrimarySite(sitesList) {
        for (var i = 0; i < sitesList.length; i++) {
            var site = sitesList[i];
            if (site.data.value.primarySite) {
                return site;
            }
        }
    }
   
    function getSites(handleRecord) {
        var sites = new Array();
        for (var i = 0; i < handleRecord.values.length; i++) {
            var handleValue = handleRecord.values[i];
            if (handleValue.type == "HS_SITE") {
                sites.push(handleValue);
            }
        }
        return sites;
    }
    
    function getSiteWithIndex(sites, index) {
        var result = null;
        for (var i = 0; i < sites.length; i++) {
            var site = sites[i];
            if (site.index === index) {
                result = site;
                break;
            }
        }
        return result;
    }
    
    function onGetSiteHandleError(response) {
        clientErrorCallback(response);
    }
    
    constructor();
}

cnri.hdl.util.SiteRetriever = SiteRetriever;
/*end*/})();