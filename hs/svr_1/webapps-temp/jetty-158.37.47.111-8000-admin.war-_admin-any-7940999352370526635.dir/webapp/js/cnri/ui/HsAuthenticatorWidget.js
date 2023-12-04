function HsAuthenticatorWidget(containerDiv, client, sessionTracker) {
    var self = this;
    
    var session = null;

    var signInButton = null;
    var signOutButton = null;
    var authenticatedLabel = null;

    var authenticatedDiv = null;
    var authenticateDiv = null;
    var privateKeyAuthenticateDiv = null;
    var secretKeyAuthenticateDiv = null;

    var useGlobalCheckBox = null;
    var useGlobalDiv = null;
    
    var indexInput = null;
    var handleInput = null;
    var id = null;

    var fileReaderDiv = null;
    var privateKeyPassPhraseInput = null;
    var privateKeyAuthenticateButton = null;
    var privateKeyBytes = null;
    var isEncryptedKey = false;
    
    var secretKeyInput = null;
    var secretAuthenticateButton = null;
    
    var dialogNotifications = null;
    
    function constructor() {
        signInButton = $('<button type="button" class="btn btn-primary btn-sm">Authenticate</button>');
        signInButton.click(onSignInClick);
        containerDiv.append(signInButton);
        
        authenticatedDiv = $('<div class="authenticatedDiv" style="display:none;"></div>');
        containerDiv.append(authenticatedDiv);
        var signOutForm = $('<form class="form-inline"></form>');
        authenticatedDiv.append(signOutForm);
        var signOutGroup = $('<div class="control-group"></div>');
        signOutForm.append(signOutGroup);
        
        signOutButton = $('<button type="button" class="btn btn-warning btn-sm">Sign out</button>');
        signOutGroup.append(signOutButton);
        signOutButton.click(onSignOutButtonClick);
        signOutGroup.append(" ");
        authenticatedLabel = $('<span class="help-inline" style="margin-top: 5px;"></span>');
        signOutGroup.append(authenticatedLabel);
        
        buildAuthenticateDialog();
    }
    
    function buildAuthenticateDialog() {
        authenticateDiv = $('<div class="modal fade" tabindex="-1"></div>');
        
        var modalDialog = $('<div class="modal-dialog"></div>');
        authenticateDiv.append(modalDialog);
        
        var modalContent = $('<div class="modal-content"></div>');
        modalDialog.append(modalContent);
        
        var modalHeader = $('<div class="modal-header"></div>');
        modalContent.append(modalHeader);
        var closeButton = $('<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>');
        modalHeader.append(closeButton);

        var title = $('<h4 class="modal-title">Authenticate</h4>');
        modalHeader.append(title);
        
        var dialogNotificationsDiv = $('<div></div>');
        modalContent.append(dialogNotificationsDiv);
        dialogNotifications = new Notifications(dialogNotificationsDiv); 
        
        var modalBody = $('<div class="modal-body"></div>');
        modalContent.append(modalBody);
        
        var dialogNotificationsDiv = $('<div></div>');
        modalContent.append(dialogNotificationsDiv);
        dialogNotifications = new Notifications(dialogNotificationsDiv); 
        
        useGlobalDiv = $('<div style="display:none"></div>');
        modalBody.append(useGlobalDiv);
        var useGlobalLabel = $('<label class="checkbox" >Get ID from Global</label>');
        useGlobalCheckBox = $('<input type="checkbox" class=""></input>');
        useGlobalLabel.append(" ");
        useGlobalLabel.append(useGlobalCheckBox);
        useGlobalCheckBox.attr("checked", true);
        useGlobalDiv.append(useGlobalLabel);
        
        var indexHandleInputForm = $('<form class="form-inline" role="form" style="margin-bottom:5px;"></form>');
        indexInput = $('<input type="text" class="form-control input-sm index-input" placeholder="Index">');
        indexHandleInputForm.append(indexInput);
        indexHandleInputForm.append(" : ");
        handleInput = $('<input type="text" class="form-control input-sm" style="min-width: 150px;" placeholder="Handle">');
        indexHandleInputForm.append(handleInput);
        modalBody.append(indexHandleInputForm);
        
        var authenticateModeSelectDiv = $('<div class="tabbable authenticateModeSelect"></div>');
        modalBody.append(authenticateModeSelectDiv);
        var tabNav = $('<ul id="authTab" class="nav nav-tabs">');
        var privateKeyNav = $('<li class="active"><a href="#privateKeyAuth" data-toggle="tab">Private Key</a></li>');
        var secretKeyNav = $('<li><a href="#secretKeyAuth" data-toggle="tab">Secret Key</a></li>');
        tabNav.append(privateKeyNav);
        tabNav.append(secretKeyNav);
        authenticateModeSelectDiv.append(tabNav);
        
        var tabContentDiv = $('<div id="authenticateTabContent" class="tab-content">'); 
        authenticateModeSelectDiv.append(tabContentDiv);
        
        privateKeyAuthenticateDiv = $('<div class="tab-pane fade in active" id="privateKeyAuth"></div>');
        secretKeyAuthenticateDiv = $('<div class="tab-pane fade " id="secretKeyAuth"></div>');
        
        tabContentDiv.append(privateKeyAuthenticateDiv);
        tabContentDiv.append(secretKeyAuthenticateDiv);
        
        var privateKeyForm = $('<form class="form-inline" role="form"></form>');
        privateKeyAuthenticateDiv.append(privateKeyForm);
        
        var lastUsedIndexHandle = amplify.store("lastAuthIndexHandle");
        if (lastUsedIndexHandle != null && lastUsedIndexHandle != undefined) {
            setIndex(lastUsedIndexHandle.index);
            setHandle(lastUsedIndexHandle.handle);
        }
        
        fileReaderDiv = $('<div style="display: inline;"></div>');
        privateKeyForm.append(fileReaderDiv);
        var fileReader = new ClientSideFileWidget(fileReaderDiv, onPrivateKeySelected, false, "Select private key");
        privateKeyForm.append(" ");
        
        privateKeyPassPhraseInput = $('<input type="password" class="form-control input-sm" style="display:none;" placeholder="Passphrase">');
        privateKeyForm.append(privateKeyPassPhraseInput);
        privateKeyPassPhraseInput.keypress(function(event){
            if(event.keyCode == 13){ 
                event.preventDefault();
                onPrivateKeyAuthenticateButtonClick();
            }
        });
        
        privateKeyForm.append(" ");
        
        privateKeyAuthenticateButton = $('<button type="button" class="btn btn-sm btn-primary" style="min-width: 130px;" data-loading-text="Authenticating...">Authenticate</button>');
        privateKeyForm.append(privateKeyAuthenticateButton);
        privateKeyAuthenticateButton.click(onPrivateKeyAuthenticateButtonClick);
        
        var secretForm = $('<form class="form-inline" role="form"></form>');
        secretKeyAuthenticateDiv.append(secretForm);
        secretKeyInput = $('<input type="password" class="form-control input-sm" placeholder="Secret">');
        secretKeyInput.keypress(function(event){
            if(event.keyCode == 13){ 
                event.preventDefault();
                onSecretAuthenticateButtonClick();
            }
        });
        secretForm.append(secretKeyInput);
        secretForm.append(" ");
        secretAuthenticateButton = $('<button type="button" class="btn btn-sm btn-primary" style="min-width: 130px;" data-loading-text="Authenticating...">Authenticate</button>');
        secretForm.append(secretAuthenticateButton);
        secretAuthenticateButton.click(onSecretAuthenticateButtonClick);
    }
    
    function onSignInClick() {
        var specificSite = client.getSpecificSiteInfo();
        if (specificSite != null) {
            useGlobalDiv.show();
        } else {
            useGlobalDiv.hide();
        }
         
        authenticateDiv.modal({ keyboard: true});
    }
    
    function getHostingServerUrl() {
        return window.location.protocol + "//" + window.location.host;
    }
    
    function checkIfAlreadyAuthenticated() {
        var serverInfo = {
                url : getHostingServerUrl()
        };
        var authInfo = {
                id : ""
        };
        sessionTracker.checkIfAlreadyAuthenticated(null, serverInfo, onCheckIfAlreadyAuthenticatedSuccess, onCheckIfAlreadyAuthenticatedError);
    }
    self.checkIfAlreadyAuthenticated = checkIfAlreadyAuthenticated;
    
    function onCheckIfAlreadyAuthenticatedSuccess(response) {
        if (response.authenticated === true) {
            session = response.session;
            id = response.id;
            onAuthenticateSuccess(response);
        }
    }
    
    function onCheckIfAlreadyAuthenticatedError(response) {
        
    }    

    function onSecretAuthenticateButtonClick() {
        var secret = secretKeyInput.val();
        var index = indexInput.val();
        if (index === "") {
            index = "0"; //Zero is the indicator that the first matching secret key in the handle should be used.
        }
        var handle = handleInput.val();
        if (handle === "") {
            dialogNotifications.alertError("You must specify the handle containing your public key to authenticate.");
            return;
        }
        var lastUsedIndexHandle = {
                index : index,
                handle : handle
        };
        amplify.store("lastAuthIndexHandle", lastUsedIndexHandle);
        dialogNotifications.clear();
        
        secretAuthenticateButton.button('loading');
        id = index + ":" + handle;
        
        var authInfo = {
                id : id,
                mode : "HS_SECKEY",
                secretKey : secret
        };
        authenticate(authInfo);
//            var serverInfo = {
//                    url : getHostingServerUrl()
//            };
//            session = sessionTracker.authenticate(authInfo, serverInfo, onAuthenticateSuccess, onAuthenticateError);            
        return false;
    }
    
    function onPrivateKeyAuthenticateButtonClick() {
        var index = indexInput.val();
        if (index === "") {
            index = "0"; //Zero is the indicator that the first matching public key in the handle should be used.
        }
        var handle = handleInput.val();
        var keyBytes = null;
        if (handle === "") {
            dialogNotifications.alertError("You must specify the handle containing your public key to authenticate.");
            return;
        }
        if (privateKeyBytes === null) {
            dialogNotifications.alertError("You must select a private key file to authenticate.");
            return;
        }
        if (isEncryptedKey) {
            var passPhrase = getPassPhrase();
            if (passPhrase === "") {
                dialogNotifications.alertError("The selected private key requires a passphrase to decrypt it.");
                return;
            }
            keyBytes = cnri.util.EncryptionUtil.decrypt(privateKeyBytes, passPhrase);
            if (keyBytes == undefined) {
                dialogNotifications.alertError("The selected private key could not be decrypted.");
                return;
            }
        } else {
            keyBytes = privateKeyBytes;
        }
        var lastUsedIndexHandle = {
                index : index,
                handle : handle
        };
        amplify.store("lastAuthIndexHandle", lastUsedIndexHandle);
        dialogNotifications.clear();
        var key = parsePrivateKeyFile(keyBytes);
        if (key == null) {
            return false;
        }
        privateKeyAuthenticateButton.button('loading');
        id = index + ":" + handle;
        
        var authInfo = {
                id : id, 
                mode : "HS_PUBKEY",
                privateKey : key
        };
        
        authenticate(authInfo);
//            var serverInfo = {
//                url : getHostingServerUrl()
//            };
//            session = sessionTracker.authenticate(authInfo, serverInfo, onAuthenticateSuccess, onAuthenticateError);
        return false;
    }
    
    function authenticate(authInfo) {
        if (authInfo.mode === "HS_SECKEY") {
            sessionTracker.setAuthInfo(authInfo); 
            onAuthenticateSuccess(null);
        } else {
            var useGlobalForId = true;
            if (useGlobalCheckBox != null) {
                useGlobalForId = useGlobalCheckBox.is(':checked');
            }
            
            var localAuthenticator = new cnri.hdl.util.LocalAuthenticator(authInfo, client);
            var localAuthenticateSuccess = function(response) {
                sessionTracker.setAuthInfo(authInfo); 
                onAuthenticateSuccess(response);
            }; 
            localAuthenticator.authenticate(useGlobalForId, localAuthenticateSuccess, onAuthenticateError);
        }
    }
    
    function onSignOutButtonClick() {
        sessionTracker.signOutCurrentAuthInfo();
        onSignOutSuccess();
        //session.signOut(onSignOutSuccess, onSignOutError);
        return false;
    }
    
    function onSignOutSuccess() {
        app.notifications.clear();
        authenticatedLabel.text("");
        signInButton.show();
        authenticatedDiv.hide();
        amplify.publish(HandleEvents.ON_SIGN_OUT);
    }
    
    function onSignOutError() {
        
    }    
    
    function onAuthenticateSuccess(response) {
        app.notifications.clear();
        dialogNotifications.clear();
        signInButton.hide();
        privateKeyAuthenticateButton.button('reset');
        secretAuthenticateButton.button('reset');
        authenticatedLabel.text(id);
        authenticateDiv.modal('hide');
        authenticateDiv.hide();
        authenticatedDiv.show();
        amplify.publish(HandleEvents.ON_SIGN_IN, response);
    }
    
    function onAuthenticateError(response) {
        var msg = "Could not authenticate.";
        if (response.msg != undefined) {
            msg = msg + " " + response.msg;
        }
        dialogNotifications.alertError(msg);
        privateKeyAuthenticateButton.button('reset');
        secretAuthenticateButton.button('reset');
    }
    
    function onPrivateKeySelected(keyBytes) {
        dialogNotifications.clear();
        isEncryptedKey = false;
        if (cnri.util.EncryptionUtil.requiresSecretKey(keyBytes)) {
            isEncryptedKey = true;
            privateKeyPassPhraseInput.show(400);
        } else {
            privateKeyPassPhraseInput.hide();
        }
        privateKeyBytes = keyBytes;
    }
    
    function parsePrivateKeyFile(keyBytes) {
        var key = null;
        try {
            var offset = 4;
            if (isEncryptedKey) offset = 0;
            key = cnri.util.EncryptionUtil.getPrivateKeyFromBytes(keyBytes, offset);
            dialogNotifications.clear();
        } catch (err) {
            dialogNotifications.alertError("Selected file could not be parsed as a private key.");
        }
        return key;
    }
    
    function printBytes(bytes) {
        var string = "";
        for (var i = 0; i < bytes.length; i++) {
            var out = 0;
            var b = bytes[i];
            if (b >= 128) {
                out = b -256;
            } else {
                out = b;
            }
            string = string + out + " ";
        }
        console.log(string);
    }
    
    function getPassPhrase() {
        return privateKeyPassPhraseInput.val();
    }
    
    function setIndex(index) {
        if (index !== "0") {
            indexInput.val(index);
        } 
    } 
    
    function setHandle(handle) {
        handleInput.val(handle);
    }
    
    constructor();
}