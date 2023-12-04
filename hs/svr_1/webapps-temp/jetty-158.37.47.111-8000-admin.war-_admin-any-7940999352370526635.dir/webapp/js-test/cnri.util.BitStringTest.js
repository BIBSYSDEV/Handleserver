(function(){
"use strict";
    
module("cnri.util.BitString");

test("Modify string represenation of binary", function() {
    var bitString = new cnri.util.BitString("11111111", true);
    ok("11111111" === bitString.toString());
    bitString.setBit(0, false);
    ok("11111110" === bitString.toString());
    bitString.setBit(7, false);
    ok("01111110" === bitString.toString());
    bitString.setBit(2, false);
    ok("01111010" === bitString.toString());
    bitString.setNumber(10);
    ok("1010" === bitString.toString());
    bitString.setNumber(15);
    ok("1111" === bitString.toString());
    bitString.setBit(7, true);
    ok("10001111" === bitString.toString());
    bitString.set("0000000000000001");
    ok("0000000000000001" === bitString.toString());
});

/*end*/})();