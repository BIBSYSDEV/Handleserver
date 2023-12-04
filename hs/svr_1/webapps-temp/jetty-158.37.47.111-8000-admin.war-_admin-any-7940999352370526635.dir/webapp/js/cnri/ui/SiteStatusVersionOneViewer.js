function SiteStatusVersionOneViewer(containerDiv, status) {
    
    function constructor() {
        addTableValues();
        var bytesInGB = 1073741824;
        var totalMem = status.mem.free + status.mem.used;
        var percentFreeMem = (status.mem.free / totalMem) * 100;
        var percentUsedMem = 100 - percentFreeMem;
        var roundPercentUsedMem = Math.round(percentUsedMem);
        var totalMemGB = totalMem / bytesInGB;
        var usedGB = status.mem.used / bytesInGB;
        var units = "GB";
        addProgressBar(containerDiv, roundPercentUsedMem, "Memory used:", usedGB, totalMemGB, units);
        addDiskUsage();
    }
    
    function addDiskUsage() {
        var kilobytesInGB = 1048576;
        for (var i = 0; i < status.diskInfo.length; i++) {
            var disk = status.diskInfo[i];
            var totalDiskSpace = disk.free + disk.used;
            var totalDiskSpaceGB = totalDiskSpace / kilobytesInGB;
            if (totalDiskSpaceGB < 0.1) {
                continue; //don't show very small disks
            }
            var percentFreeDiskSpace = (disk.free / totalDiskSpace) * 100;
            var percentUsedDiskSpace = 100 - percentFreeDiskSpace;
            var roundPercentUsedDiskSpace = Math.round(percentUsedDiskSpace);
            
            var usedGB = disk.used / kilobytesInGB;
            var units = "GB";
            addProgressBar(containerDiv, roundPercentUsedDiskSpace, "Disk used: " + disk.name, usedGB, totalDiskSpaceGB, units);
        }
    }
    
    function addProgressBar(parentDiv, percent, title, used, total, units) {
        var progressDiv = $('<div class="progress">');
        var progressBarDiv = $('<div class="progress-bar" role="progressbar" aria-valuenow="'+percent+'" aria-valuemin="0" aria-valuemax="100" style="width: '+percent+'%;"></div>');
        var span = $('<span></span>');
        var text = title + ' ' + percent + '%';
        if (used !== undefined && total !== undefined && units !== undefined) {
            var roundUsed = Number((used).toFixed(1));
            var roundTotal = Number((total).toFixed(1));
            text += ' (' + roundUsed + '/' + roundTotal + ' ' + units + ')';
        }
        span.text(text);
        progressBarDiv.append(span);
        parentDiv.append(progressDiv);
        progressDiv.append(progressBarDiv);
    }
    
    function addTableValues() {
        var table = $('<table class="table"></table>');
        containerDiv.append(table);
        
        var colgroup = $('<colgroup><col style="width:50%"><col style="width:50%"></colgroup>');
        table.append(colgroup);
        
        var tbody = $('<tbody></tbody>');
        table.append(tbody);
        addTableRow(tbody, ["Server", status.domainName]);
        
        var startTime = new Date(status.startTime).toString();
        addTableRow(tbody, ["Start time", startTime]);
        
        var lastUpdate = new Date(status.lastUpdate).toString();
        addTableRow(tbody, ["Last status update", lastUpdate]);

        addTableRow(tbody, ["Resolution requests", status.requests.resolution.value]);
        addTableRow(tbody, ["Admin requests", status.requests.admin.value]);
        addTableRow(tbody, ["Total requests", status.requests.total.value]);
        
        addTableRow(tbody, ["CPU load avg (last 1 min)", status.loadAvg[0]]);
        addTableRow(tbody, ["CPU load avg (last 5 mins)", status.loadAvg[1]]);
        addTableRow(tbody, ["CPU load avg (last 15 mins)", status.loadAvg[2]]);
    }
    
    function addTableRow(table, values) {
        var tr = $('<tr></tr>');
        table.append(tr);
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            var td = $('<td></td>');
            td.text(value);
            tr.append(td);
        }
    }
    
    constructor();
}
