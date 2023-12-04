function KeyPairVerifier(publicKey, privateKey) {
    var self = this;
    var nonceBytes = null;
    
    function testKeyPair(verificationCompleteCallBack) {
        self.verificationCompleteCallBack = verificationCompleteCallBack;
        var privType = privateKey.kty.substring(0, 3);
        var pubType = publicKey.kty.substring(0, 3); 
        if (privType !== pubType) {
            var response = {
                    isVerified : false,
                    msg :  "Private key is not of the same type as the public key."
            };
            self.verificationCompleteCallBack(response);
            return;
        }
        if (privateKey.kty === "DSA") {
            verifyDsaKeyPair(publicKey, privateKey); 
        } else if (privateKey.kty === "RSA") {
            verifyRsaKeyPair(publicKey, privateKey);
        } else {
            var response = {
                    isVerified : false,
                    msg :  "Private key is of an unknown type."
            };
            self.verificationCompleteCallBack(response);
        }    
    }
    self.testKeyPair = cnri.util.FunctionUtil.callbacksToPromiseWithArgs(0, testKeyPair);
    
    function verifyDsaKeyPair(publicKey, privateKey) {
        nonceBytes = generateNonceBytes();
        cnri.util.EncryptionAsync.signDsaSha1(privateKey, nonceBytes, onSignDsaSuccess, onSignError);
    }
    
    function onSignDsaSuccess(response) {
        var signature = response.signature;
        cnri.util.EncryptionAsync.verifyDsaSha1(publicKey, nonceBytes, signature, onVerifySuccess, onVerifyError);
    }
    
    function onSignError(response) {
        response.isVerified = false;
        response.msg = "Unable to use private key to sign nonce.";
        self.verificationCompleteCallBack(response);
    }
    
    function verifyRsaKeyPair(publicKey, privateKey) {
        nonceBytes = generateNonceBytes();
        cnri.util.EncryptionAsync.signRsaSha1(privateKey, nonceBytes, onSignRsaSuccess, onSignError);
    }    
    
    function onSignRsaSuccess(response) {
        var signature = response.signature;
        cnri.util.EncryptionAsync.verifyRsaSha1(publicKey, nonceBytes, signature, onVerifySuccess, onVerifyError);
    }
    
    function onVerifySuccess(response) {
        if (response.isVerified) {
            self.verificationCompleteCallBack(response);
        } else {
            var response = {
                    msg :  "Private key is not a match for public key."
            };
            self.verificationCompleteCallBack(response);
        } 
    }
    
    function onVerifyError(response) {
        self.verificationCompleteCallBack(response);
    }
    
    function generateNonceBytes() {
        return libpolycrypt.random(32);
    }
}