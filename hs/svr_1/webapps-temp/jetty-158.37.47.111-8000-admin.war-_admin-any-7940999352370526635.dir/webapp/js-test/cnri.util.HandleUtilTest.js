(function(){
"use strict";
    
module("cnri.util.HandleUtil");

var handleRecord = {
    handle: "some/handle",
    values: [
        { index: 100 },
        { index: 200 },
        { index: 1 },
        { index: 201 },
        { index: 2 },
        { index: 101 },
    ]
};

test("getNextAvailableIndex", function() {
    equal(cnri.util.HandleUtil.getNextAvailableIndex(handleRecord), 3);
    equal(cnri.util.HandleUtil.getNextAvailableIndex(handleRecord, 100), 102);
    equal(cnri.util.HandleUtil.getNextAvailableIndex(handleRecord, 200), 202);
    equal(cnri.util.HandleUtil.getNextAvailableIndex(handleRecord, 300), 300);
});

test("containsIndex", function() {
    ok(cnri.util.HandleUtil.containsIndex(handleRecord, 1));
    ok(cnri.util.HandleUtil.containsIndex(handleRecord, 100));
    ok(cnri.util.HandleUtil.containsIndex(handleRecord, 200));
    ok(cnri.util.HandleUtil.containsIndex(handleRecord, 2));
    ok(cnri.util.HandleUtil.containsIndex(handleRecord, 101));
    ok(cnri.util.HandleUtil.containsIndex(handleRecord, 201));
    ok(!cnri.util.HandleUtil.containsIndex(handleRecord, 300));
});

/*end*/})();