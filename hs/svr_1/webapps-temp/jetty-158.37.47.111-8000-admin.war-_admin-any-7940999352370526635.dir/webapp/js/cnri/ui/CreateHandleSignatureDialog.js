function CreateHandleSignatureDialog(handleRecord) {
    var self = this;
    var createHandleSignatureWidget = null;
        
    var modalContainerDiv = null;
    
    function constructor() {
        modalContainerDiv = $('<div class="modal fade"></div>');
        $('body').append(modalContainerDiv);
        
        var modalDialog = $('<div class="modal-dialog">');
        modalContainerDiv.append(modalDialog);
        
        var modalContent = $('<div class="modal-content">');
        modalDialog.append(modalContent);
        
        var modalHeader = $('<div class="modal-header"></div>');
        modalContent.append(modalHeader);

        var title = $('<h4 class="modal-title">Create Signature</h4>');
        modalHeader.append(title);
        
        var modalBody = $('<div class="modal-body"></div>');
        modalContent.append(modalBody);
        
        var createSignatureDivDiv = $('<div></div>');
        modalBody.append(createSignatureDivDiv);
        
        createHandleSignatureWidget = new CreateHandleSignatureWidget(createSignatureDivDiv, handleRecord);
        
        modalBody.append($('</br>'));
        
//        var message = $('<p></p>');
//        message.text('Instructions here... TODO');
//        modalBody.append(message);
        
        var modalFooter = $('<div class="modal-footer"></div>');
        modalContent.append(modalFooter);
        
        var closeButton = $('<a href="#" class="btn btn-default">Close</a>');
        
        modalFooter.append(closeButton);
        
        closeButton.click(onCloseClick);
        
        //modalContainerDiv.on('hidden', destroy);
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
    
    function reset() {
        createHandleSignatureWidget.reset();
    }
    self.reset = reset;
    
//    function destroy() {
//        modalContainerDiv.remove();
//    }
    
    constructor();
}