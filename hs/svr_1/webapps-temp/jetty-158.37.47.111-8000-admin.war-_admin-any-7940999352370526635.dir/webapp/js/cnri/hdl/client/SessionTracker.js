(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.hdl = cnri.hdl || {};
cnri.hdl.util = cnri.hdl.util || {};

var callbacksToPromiseWithArgs = cnri.util.FunctionUtil.callbacksToPromiseWithArgs;

/**
 * maintains a map userId->sessions
 * where sessions is map of serverUrl->Session object
 */
function SessionTracker() {
    var self = this;
    var users = null;
    var currentAuthInfo = null;
    
    function constructor() {
        users = {};
    }
    
    function authenticate(authInfo, serverInfo, clientSuccessCallback, clientErrorCallback) {
        currentAuthInfo = authInfo; 
        var session = new cnri.hdl.util.Session(authInfo, serverInfo, self);
        var wrappedClientSuccessCallback = function (response) {
            onAuthenticateSuccess(response);
            clientSuccessCallback(response);
        }; 
        var wrappedClientErrorCallback = function (response) {
            onAuthenticateError(response);
            clientErrorCallback(response);
        };
        session.authenticate(wrappedClientSuccessCallback, wrappedClientErrorCallback);
        return session; 
    }
    self.authenticate = callbacksToPromiseWithArgs(2, authenticate);
    
    function onAuthenticateSuccess(response) {
        var session = response.session;
        var id = response.id;
        if (id !== undefined) {
            var sessions = getSessionsForId(id);
            sessions[session.serverInfo.url] = session;
        }
    }
    
    function getSessionsForId(id) {
        var sessions = users[id];
        if (sessions == undefined) {
            sessions = {};
            users[id] = sessions;
        }
        return sessions;
    }
    
    function onAuthenticateError(response) {
        //no-op
    }
    
    //Checks the server to see if the the user is authenticated. Not used.
    function checkIfAlreadyAuthenticated(authInfo, serverInfo, successCallback, errorCallback) {
        var session = null;
        if (authInfo != null) {
            session = getOrCreateSession(authInfo, serverInfo);
            session.isAuthenticated(successCallback, errorCallback);
        } else {
            session = new cnri.hdl.util.Session(authInfo, serverInfo, self);
            var wrappedSuccessCallback = function (response) {
                var id = response.authenticatedId;
                var sessions = getSessionsForId(id);
                sessions[serverInfo.url] = session;
                currentAuthInfo = session.authInfo;
                successCallback(response);
            };
            session.isAuthenticated(wrappedSuccessCallback, errorCallback);
        }
    }
    self.checkIfAlreadyAuthenticated = callbacksToPromiseWithArgs(2, checkIfAlreadyAuthenticated);
    
    //Checks the local session storage to see if one exists for the auth on a given server
    function hasSession(authInfo, serverInfo) {
        var session = getSession(authInfo, serverInfo);
        if (session == null) return false;
        else return true;
    }
    self.hasSession = hasSession;
    
    function getOrCreateSession(authInfo, serverInfo) {
        var session = getSession(authInfo, serverInfo);
        if (session == undefined) {
            session = new cnri.hdl.util.Session(authInfo, serverInfo, self);
        }
        return session;
    }
    self.getOrCreateSession = getOrCreateSession;
    
    function getSession(authInfo, serverInfo) {
        if (authInfo === null) {
            return null;
        }
        var sessions = getSessionsForId(authInfo.id);
        if (sessions == undefined) {
            return null;
        }
        var session = sessions[serverInfo.url];
        if (session == undefined) {
            return null;
        }
        return session;
    } 
    self.getSession = getSession;
    
    function signOutCurrentAuthInfo(onSignOutSuccess, onSignOutError) {
        if (currentAuthInfo != null) {
            var sessions = getSessionsForId(currentAuthInfo.id);
            var signOutPromises = [];
            for (var prop in sessions) {
                var session = sessions[prop];
                var promise = session.signOut();
                signOutPromises.push(promise);
            }
            if (onSignOutSuccess != null && onSignOutSuccess != undefined) {
                $.when.apply(null, signOutPromises).done(onSignOutSuccess);
            }
            if (onSignOutError != null && onSignOutError != undefined) {
                $.when.apply(null, signOutPromises).fail(onSignOutError);
            }
            
            delete users[currentAuthInfo.id];
            currentAuthInfo = null;
        }
    }
    self.signOutCurrentAuthInfo = callbacksToPromiseWithArgs(0, signOutCurrentAuthInfo);
    
    function deleteSessionClientSideOnly(authInfo, serverInfo) {
        var sessions = getSessionsForId(authInfo.id);
        if (sessions !== undefined) {
            delete sessions[serverInfo.url];
        } 
        //var session = sessions[serverInfo.url];
    }
    self.deleteSessionClientSideOnly = deleteSessionClientSideOnly;
    
    
    function getAuthInfo() {
        return currentAuthInfo;
    }
    self.getAuthInfo = getAuthInfo;
    
    function setAuthInfo(authInfo) {
        currentAuthInfo = authInfo;
    }
    self.setAuthInfo = setAuthInfo;
    
    constructor();
}

cnri.hdl.util.SessionTracker = SessionTracker;
/*end*/})();