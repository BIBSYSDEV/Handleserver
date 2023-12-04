if (typeof importScripts !== 'undefined') {

try {
    importScripts("cnri.util.min.js");
} catch (e) {
    importScripts("cnri/util/lib/polycrypt/back/libpolycrypt.js");
    importScripts("cnri/util/lib/polycrypt/common/util.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/core-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/cipher-core-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/aes-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/sha1-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/sha256-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/hmac-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/tripledes-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/md5-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/mode-ecb-min.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/CryptoJS/pbkdf2-min.js");

    importScripts("cnri/util/lib/polycrypt/back/lib/jsbn.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/jsbn2.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/prng4.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/rng.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/rsa.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/rsa2.js");
    importScripts("cnri/util/lib/polycrypt/back/lib/rsasign-1.2.js");

    importScripts("cnri/util/lib/ortjs/dsa.js");

    importScripts("cnri/util/Encoder.js");
    importScripts("cnri/util/EncryptionUtil.js");
}   

self.onmessage = function (e) {
    var cmd = e.data.cmd;
    var response = {};
    if (cmd === "signRsaSha256") {
        var privateKey = e.data.privateKey;
        var data = e.data.data;
        var signature = cnri.util.EncryptionUtil.signRsaSha256(privateKey, data);
        response.signature = signature;
    } else if (cmd === "signRsaSha1") {
        var privateKey = e.data.privateKey;
        var data = e.data.data;
        var signature = cnri.util.EncryptionUtil.signRsaSha1(privateKey, data);
        response.signature = signature;
    } else if (cmd === "signDsaSha1") {
        var privateKey = e.data.privateKey;
        var data = e.data.data;
        var signature = cnri.util.EncryptionUtil.signDsaSha1(privateKey, data);
        response.signature = signature;
    } else if (cmd === "signDsaSha1WithK") {
        var privateKey = e.data.privateKey;
        var data = e.data.data;
        var K = e.data.K;
        var signature = cnri.util.EncryptionUtil.signDsaSha1WithK(privateKey, data, K);
        response.signature = signature;
    } else if (cmd === "verifyRsaSha256") {
        var publicKey = e.data.publicKey;
        var data = e.data.data;
        var signature = e.data.signature;
        var isVerified = cnri.util.EncryptionUtil.verifyRsaSha256(publicKey, data, signature);
        response.isVerified = !!isVerified;
    } else if (cmd === "verifyRsaSha1") {
        var publicKey = e.data.publicKey;
        var data = e.data.data;
        var signature = e.data.signature;
        var isVerified = cnri.util.EncryptionUtil.verifyRsaSha256(publicKey, data, signature);
        response.isVerified = !!isVerified;
    } else if (cmd === "verifyDsaSha1") {
        var publicKey = e.data.publicKey;
        var data = e.data.data;
        var signature = e.data.signature;
        var isVerified = cnri.util.EncryptionUtil.verifyDsaSha1(publicKey, data, signature);
        response.isVerified = !!isVerified;
    } else if (cmd === "digestSha1") {
        var data = e.data.data;
        var digest = cnri.util.EncryptionUtil.digestSha1(data);
        response.digest = digest;
    } else if (cmd === "digestSha256") {
        var data = e.data.data;
        var digest = cnri.util.EncryptionUtil.digestSha256(data);
        response.digest = digest;
    }
    postMessage(response);
};

}