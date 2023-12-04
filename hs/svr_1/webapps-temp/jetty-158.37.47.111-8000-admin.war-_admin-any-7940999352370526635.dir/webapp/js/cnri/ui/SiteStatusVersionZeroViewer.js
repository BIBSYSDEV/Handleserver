function SiteStatusVersionZeroViewer(containerDiv, status) {
    
    function constructor() {
        
        var percentFreeMem = (parseInt(status.freemem) / parseInt(status.maxmem)) * 100;
        var percentUsedMem = 100 - percentFreeMem;
        var roundPercentUsedMem = Math.round(percentUsedMem);
        addProgressBar(containerDiv, roundPercentUsedMem, "Used Memory");
        
        
    
//        <div class="progress">
//        <div class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width: 60%;">
//          60%
//        </div>
//        </div>

    }
    
    function addProgressBar(parentDiv, percent, title) {
        var progressDiv = $('<div class="progress">');
        var progressBarDiv = $('<div class="progress-bar" role="progressbar" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100" style="width: '+percent+'%;">' + title + ' ' + percent + '%</div>');
        parentDiv.append(progressDiv);
        progressDiv.append(progressBarDiv);
    }
    

    
    
    constructor();
}
