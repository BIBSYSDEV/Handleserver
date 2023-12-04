(function () {
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var FunctionUtil = cnri.util.FunctionUtil = {};

// Expects a function whose arguments end with callbacks for success and (optionally) failure and (optionally) progress
// and returns a function not taking those arguments but returning a promise
FunctionUtil.callbacksToPromise = function (func) {
    return function() {
        var args = $.makeArray(arguments);

        var p = $.Deferred();
        args.push(p.resolve);
        args.push(p.reject);
        args.push(p.notify); 
        
        func.apply(this, args);

        return p.promise();
    };
};

// Like callbacksToPromise, but the resulting function can still take arguments ending with success, failure,
// and progress callbacks.  Thus it can continue to work exactly as before, or else be used promise-style.
// The number of arguments before the success callback must be passed in.
FunctionUtil.callbacksToPromiseWithArgs = function (numArgs, func) {
    return function() {
        var args = $.makeArray(arguments).slice(0, numArgs);

        var p = $.Deferred();
        args.push(p.resolve);
        args.push(p.reject);
        args.push(p.notify); 
        
        func.apply(this, args);

        if (arguments[numArgs]) p.done(arguments[numArgs]);
        if (arguments[numArgs + 1]) p.fail(arguments[numArgs + 1]);
        if (arguments[numArgs + 2]) p.progress(arguments[numArgs + 2]);
        
        return p.promise();
    };
};

/*end*/})();
