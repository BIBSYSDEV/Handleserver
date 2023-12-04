function ModalQrCodeDialog(url) {
    var self = this;
    
    var modalContainerDiv = null;
    
    function constructor() {
        modalContainerDiv = $('<div class="modal fade"></div>');
        $('body').append(modalContainerDiv);
        
        var modalDialog = $('<div class="modal-dialog">');
        modalContainerDiv.append(modalDialog);
        
        var modalContent = $('<div class="modal-content">');
        modalDialog.append(modalContent);
        
        var modalBody = $('<div class="modal-body qrcode-body"></div>');
        modalContent.append(modalBody);
        
        var qrcodeDiv = $('<div></div>');
        modalBody.append(qrcodeDiv);
        
        new QRCode(qrcodeDiv.get(0), url);
        
        modalBody.append($('</br>'));
        
        var message = $('<p></p>');
        message.text('Right click in the middle of the above QR Code and select "Save Image As"');
        modalBody.append(message);
        
        var modalFooter = $('<div class="modal-footer"></div>');
        modalContent.append(modalFooter);
        
        var closeButton = $('<a href="#" class="btn btn-default">Close</a>');
        
        modalFooter.append(closeButton);
        
        closeButton.click(onCloseClick);
        
        modalContainerDiv.on('hidden', destroy);
    }
    
    function onCloseClick(event) {
        event.preventDefault();
        hide();
    }
    
    function show() {
        modalContainerDiv.modal('show');
    }
    self.show = show;
    
    function hide() {
        modalContainerDiv.modal('hide');
    }
    self.hide = hide;
    
    function destroy() {
        modalContainerDiv.remove();
    }
    
    constructor();
}