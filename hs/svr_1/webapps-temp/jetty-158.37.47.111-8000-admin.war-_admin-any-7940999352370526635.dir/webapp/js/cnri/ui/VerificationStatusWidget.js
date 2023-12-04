function VerificationStatusWidget(containerDiv, constructorVerificationStatus) {
    var self = this;
    var verificationStatus = null;
    
    function constructor() {
        if (constructorVerificationStatus !== null && constructorVerificationStatus !== undefined) {
            updateStatus(constructorVerificationStatus);
        }
    }
    
    function updateStatus(newVerificationStatus) {
        verificationStatus = newVerificationStatus;
        containerDiv.empty();
        if (verificationStatus !== null && verificationStatus !== undefined) {
            for (var i = 0; i < verificationStatus.verifiedSigners.length; i++) {
                var verifiedSigner = verificationStatus.verifiedSigners[i];
                var label = $('<label class="label label-success"></label>');
                label.text(verifiedSigner);
                label.prepend(" ");
                label.prepend($('<span class="glyphicon glyphicon-ok"></span>'));
                
                containerDiv.append(label);
                containerDiv.append(" ");
            }
            
            for (var j = 0; j < verificationStatus.problemSigners.length; j++) {
                var problemSigner = verificationStatus.problemSigners[j];
                var label = $('<label class="label label-danger"></label>');
                label.text(problemSigner);
                label.prepend(" ");
                label.prepend($('<span class="glyphicon glyphicon-ban-circle">'));
                containerDiv.append(label);
                containerDiv.append(" ");
            }
        }
    }
    self.updateStatus = updateStatus;
    
    function clear() {
        verificationStatus = null;
        containerDiv.empty();
    }
    self.clear = clear;
    
    constructor();
}