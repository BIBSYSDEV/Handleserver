function ClientSideFileWidget(container, onFileReadCallback, isReadAsTextConstructorParam, buttonText, isButtonSmall) {
    var self = this;
    var fileInput = null;
    var isReadAsText = false;
    
    function constructor() {
        fileInput = $('<input type="file"/>');
        container.append(fileInput);
        prettifyThisFileInput(fileInput);
        setIsReadAsText(isReadAsTextConstructorParam);
    }
    
    function readFileAsBase64() {
        var reader = new FileReader();
        reader.onload = onload;
        reader.readAsDataURL(this.files[0]); //TODO how do we know which file if multiple files are selected?
    }

    function readFileAsBytes() {
        var reader = new FileReader();
        reader.onload = onload;
        reader.readAsArrayBuffer(this.files[0]); 
    }

    function readFileAsText() {
        var reader = new FileReader();
        reader.onload = onload;
        reader.readAsText(this.files[0]);
    }
    
    function onload(event) {
        var data = "";
        if (isReadAsText) {
            data = event.target.result;
        } else {
            data = new Uint8Array(event.target.result);
        }
        onFileReadCallback(data);
    }
    
    function setIsReadAsText(isReadAsTextParam) {
        isReadAsText = isReadAsTextParam;
        if (isReadAsText) {
            fileInput.change(readFileAsText);
        } else {
            fileInput.change(readFileAsBytes);
        }
    }
    
    function prettifyThisFileInput(fileInput) {
        fileInput = $(fileInput);
        if(fileInput.css('left')==='-1999px') return;
        fileInput.css('position','absolute');
        fileInput.css('left','-1999px');
        var textForButton = "Choose files";
        if (buttonText != undefined) {
            textForButton = buttonText;
        }
        var button = $('<button class="btn btn-default" type="button"></button>');
        
        button.text(textForButton);
        if (isButtonSmall) {
            button.addClass("btn-sm");
        } 
        var span = $('<span class="help-inline">No files chosen</span>');
        fileInput.before(button, " ", span);
        button.off('click').click(function(event) {
            event.stopImmediatePropagation();
            fileInput.click(); 
        });
        fileInput.change(function() { 
            if(fileInput[0].files.length===0) {
                span.text('No files chosen');
            } else if(fileInput[0].files.length===1) {
                span.text(fileInput[0].files[0].name);
            } else {
                span.text(fileInput[0].files.length + ' files');
            }
        });
    }    
    
    self.setIsReadAsText = setIsReadAsText;
    constructor();
}
