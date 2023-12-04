(function () {
"use strict";

var window = window || self;
window.cnri = window.cnri || {};
cnri.util = cnri.util || {};

var Equality = cnri.util.Equality = {};


Equality.compare = function (a,b) {
    var obj_str = '[object Object]',
    arr_str = '[object Array]',
    a_type  = Object.prototype.toString.apply(a),
    b_type  = Object.prototype.toString.apply(b);

    if ( a_type !== b_type) { return false; }
    else if (a_type === obj_str) {
        return Equality.compareObject(a,b);
    }
    else if (a_type === arr_str) {
        return Equality.compareArray(a,b);
    }
    return (a === b);
};

Equality.compareArray = function (arrayA, arrayB) {
    var l,a,b,i,a_type,b_type;
    // References to each other?
    if (arrayA === arrayB) { return true;}

    if (arrayA.length != arrayB.length) { return false; }
    // sort modifies original array
    // (which are passed by reference to our method!)
    // so clone the arrays before sorting
    a = jQuery.extend(true, [], arrayA);
    b = jQuery.extend(true, [], arrayB);
    a.sort(); 
    b.sort();
    for (i = 0, l = a.length; i < l; i+=1) {
        a_type = Object.prototype.toString.apply(a[i]);
        b_type = Object.prototype.toString.apply(b[i]);

        if (a_type !== b_type) {
            return false;
        }

        if (Equality.compare(a[i],b[i]) === false) {
            return false;
        }
    }
    return true;
};

Equality.compareObject = function (objA,objB) {

    var i,a_type,b_type;

    // Compare if they are references to each other 
    if (objA === objB) { return true;}

    if (Object.keys(objA).length !== Object.keys(objB).length) { return false;}
    for (i in objA) {
        if (objA.hasOwnProperty(i)) {
            if (typeof objB[i] === 'undefined') {
                return false;
            }
            else {
                a_type = Object.prototype.toString.apply(objA[i]);
                b_type = Object.prototype.toString.apply(objB[i]);

                if (a_type !== b_type) {
                    return false; 
                }
            }
        }
        if (Equality.compare(objA[i],objB[i]) === false){
            return false;
        }
    }
    return true;
};

/*end*/})();