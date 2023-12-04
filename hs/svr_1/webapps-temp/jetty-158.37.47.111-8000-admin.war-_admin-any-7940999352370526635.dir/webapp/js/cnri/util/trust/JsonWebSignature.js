function JsonWebSignature(serialization) {
    var self = this;
    var claims = null;
    
    function constructor() {
        fromSerialization();
    }
    
    function fromSerialization() {
        var tokens = serialization.split(".");
        var headerBase64Url = tokens[0];
        var claimsBase64Url = tokens[1];
        var signatureBase64Url = tokens[2];
        
        var claimsJson = cnri.util.Encoder.Utf8.string(cnri.util.Encoder.Base64Url.bytes(claimsBase64Url));
        claims = JSON.parse(claimsJson);
        console.log(claims);
    }
    
    function getClaims() {
        return claims;
    }
    self.getClaims = getClaims;
    
    constructor();
}