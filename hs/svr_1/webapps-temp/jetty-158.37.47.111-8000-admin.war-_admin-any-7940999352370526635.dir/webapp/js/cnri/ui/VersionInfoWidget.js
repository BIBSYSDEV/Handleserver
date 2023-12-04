function VersionInfoWidget(containerDiv, client, currentVersionName, currentVersionNumber) {
    var self = this;
    var VERSION_HANDLE = "4263537/5048";
    var newVersionLabel = null;
    var newerVersionLink = null;
    
    function constructor() {
        var versionLabel = $('<span></span>');
        versionLabel.text("Version: " + currentVersionName);
        containerDiv.append(versionLabel);
        
        var newerVersionDiv = $('<div></div>');
        containerDiv.append(newerVersionDiv);
        
        newerVersionLabel = $('<span></span>');
        newerVersionDiv.append(newerVersionLabel);
        
        newerVersionLink =  $('<a target="_blank"></a>');
        newerVersionDiv.append(newerVersionLink);
        getLatestAppVersionInfo();
    }
    
    function getLatestAppVersionInfo() {
        client.getGlobally(VERSION_HANDLE, onGotVersionSuccess, onGotVersionError);
    }
    
    function onGotVersionSuccess(versionHandleRecord) {
        var versionHandleValue = cnri.util.HandleUtil.getFirstHandleValueOfType(versionHandleRecord, "VERSION");
        if (versionHandleValue !== null) {
            var versionJson = versionHandleValue.data.value;
            var latestAppVersion = JSON.parse(versionJson);
            if (latestAppVersion.versionNumber > currentVersionNumber) {
                newerVersionLabel.text("A newer version is available ");
                var urlHandleValue = cnri.util.HandleUtil.getFirstHandleValueOfType(versionHandleRecord, "URL");
                if (urlHandleValue !== null) {
                    var url = urlHandleValue.data.value;
                    newerVersionLink.text(url);
                    newerVersionLink.attr("href", url);
                }
            }
        }
    } 
    
    function onGotVersionError(response) {
        
    }
    
    constructor();
}