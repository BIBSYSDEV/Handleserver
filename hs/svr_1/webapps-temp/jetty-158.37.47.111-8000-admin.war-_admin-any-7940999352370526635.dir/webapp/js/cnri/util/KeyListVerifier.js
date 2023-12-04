//returns a successful response if at least one of the public keys matches the private key
function KeyListVerifier(publicKeys, privateKey) {
    var self = this;
    var currentArrayIndex = null;
    
    function testKeyList(verificationCompleteCallBack) {
        self.verificationCompleteCallBack = verificationCompleteCallBack;
        currentArrayIndex = 0;
        if (publicKeys.length === 0) {
            var response = {
                    isVerified : false,
                    msg : "No public keys found."
            };
            self.verificationCompleteCallBack(response);
        } else {
            testNextPublicKey();
        }
    }
    self.testKeyList = cnri.util.FunctionUtil.callbacksToPromiseWithArgs(0, testKeyList);
    
    function testNextPublicKey() {
        var publicKey = publicKeys[currentArrayIndex];
        var keyPairVerifier = new KeyPairVerifier(publicKey, privateKey);
        keyPairVerifier.testKeyPair(keyPairVerificationCompleteCallBack);
    }
    
    function keyPairVerificationCompleteCallBack(response) {
        if (response.isVerified) {
            self.verificationCompleteCallBack(response);
        } else {
            if (currentArrayIndex < publicKeys.length) {
                currentArrayIndex++;
                testNextPublicKey();
            } else {
                response.msg = "No public keys match the private key.";
                self.verificationCompleteCallBack(response);
            }
        }
    }
}
