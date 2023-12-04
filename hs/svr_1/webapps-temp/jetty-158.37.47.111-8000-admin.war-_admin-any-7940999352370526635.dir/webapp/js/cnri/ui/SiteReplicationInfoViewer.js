function SiteReplicationInfoViewer(containerDiv, replicationInfo) {
    var self = this;
    
    function constructor() {
        addTableForLastTxnId();
        if (replicationInfo.replicationStatus !== undefined) {
            addTableForReplicationStatus();
        }
    }
    
    function addTableForLastTxnId() {
        var table = $('<table class="table"></table>');
        containerDiv.append(table);
        
        var colgroup = $('<colgroup><col style="width:50%"><col style="width:50%"></colgroup>');
        table.append(colgroup);
        var tbody = $('<tbody></tbody>');
        table.append(tbody);

        
        addTableRow(tbody, ["This Servers Last Transaction Id", replicationInfo.latestTxnId]);
    }
    
    function addTableForReplicationStatus() {
        var table = $('<table class="table"></table>');
        containerDiv.append(table);
        var thead = $('<thead></thead>');
        table.append(thead);
        var tr = $('<tr></tr>');
        thead.append(tr);
        
        var primarySiteIdHead = $('<th></th>');
        primarySiteIdHead.text("Primary Site Id");
        tr.append(primarySiteIdHead);
        
        var serverIdHead = $('<th></th>');
        serverIdHead.text("Server Id");
        tr.append(serverIdHead);
        
        var lastTimeStampHead = $('<th></th>');
        lastTimeStampHead.text("Last Time Stamp");
        tr.append(lastTimeStampHead);
        
        var lastTimeStampHumanHead = $('<th></th>');
        lastTimeStampHumanHead.text("Date");
        tr.append(lastTimeStampHumanHead);
        
        var lastTxnIdHead = $('<th></th>');
        lastTxnIdHead.text("Last Transaction Id");
        tr.append(lastTxnIdHead);
        
        var tbody = $('<tbody></tbody>');
        table.append(tbody);
        
        for (var primarySiteId in replicationInfo.replicationStatus) {
            var primarySiteReplicationStatus = replicationInfo.replicationStatus[primarySiteId];
            for (var i = 0; i < primarySiteReplicationStatus.length; i++) {
                var serverReplicationStatus = primarySiteReplicationStatus[i];
                var lastTimeStamp = serverReplicationStatus.last_timestamp;
                var lastTxnId = serverReplicationStatus.last_txn_id;
                var date = new Date(parseInt(lastTimeStamp)).toString();
                addTableRow(tbody, [primarySiteId, i, lastTimeStamp, date, lastTxnId]);
            }
        }
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