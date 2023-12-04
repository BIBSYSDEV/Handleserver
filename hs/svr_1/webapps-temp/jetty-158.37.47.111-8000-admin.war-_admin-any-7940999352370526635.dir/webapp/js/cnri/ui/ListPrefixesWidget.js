function ListPrefixesWidget(containerDiv, client) {
    var self = this;
    var listPrefixesButton = null;
    var prefixListDiv = null;
    var pageNum = 0;
    var pageSize = 10;
    var pagination = null;
    var paginationDiv = null;
    var notifications = null;
    
    function constructor() {
        amplify.subscribe(HandleEvents.SPECIFIC_SITE_SELECTION_CHANGED, onSpecificSiteSelectionChanged);
        
        var closeButton = $('<button class="btn btn-sm btn-default pull-right">Close</button>');
        containerDiv.append(closeButton);
        closeButton.click(onCloseClick);
        
        containerDiv.append($('<h4>List Prefixes</h4>'));
        
        var form = $('<form class="form-inline" style="margin-bottom: 0px;"></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);

        listPrefixesButton = $('<button class="btn btn-sm btn-primary" style="min-width: 87px;"data-loading-text="Wait...">List prefixes</button>');
        form.append(listPrefixesButton);
        listPrefixesButton.click(onListButtonClick);
        
        var notificationsDiv = $('<div class="notifications-small"></div>');
        containerDiv.append(notificationsDiv);
        notifications = new Notifications(notificationsDiv);
        
        paginationDiv = $('<div></div>');
        containerDiv.append(paginationDiv);
        prefixListDiv = $('<div class="handle-list"></div>');
        containerDiv.append(prefixListDiv);
        if (client.getSpecificSiteInfo() == null) {
            disable();
            notifications.alertWarning("You must select a specific site before listing prefixes.");
        }
    }
    
    function onCloseClick() {
        hide();
    }
    
    function disable() {
        listPrefixesButton.prop('disabled', true);
    }
    
    function enable() {
        listPrefixesButton.prop('disabled', false);
    }
    
    function onSpecificSiteSelectionChanged(specificSiteSelection) {
        if (specificSiteSelection.specificSite == null) {
            disable();
            notifications.alertWarning("You must select a specific site before listing prefixes.");
        } else {
            enable();
            notifications.clear();
        }
    }
    
    function onListButtonClick() {
        notifications.clear();
        pageNum = 0;
        listPrefixesButton.button("loading");
        var site = client.getSpecificSiteInfo();
        client.listPrefixesAtSite(site, pageNum, pageSize, onSuccess, onError);
    }
    
    function getPrefixes() {
        var site = client.getSpecificSiteInfo();
        client.listPrefixesAtSite(site, pageNum, pageSize, onSuccess, onError);
    }
    
    function onSuccess(response) {
        notifications.clear();
        prefixListDiv.empty();
        paginationDiv.empty();
        var handlesList = response.prefixes;
        if (response.totalCount > pageSize) {
            pagination = new SearchResultsPagination(paginationDiv, response.totalCount, pageNum, pageSize, onPageClick); 
        } else if (response.totalCount == 0) {
            notifications.alertWarning("Server does contain any homed prefixes.");
        } 
        writeHandlesToResultsDiv(handlesList);
        listPrefixesButton.button("reset");
    }
    
    function writeHandlesToResultsDiv(handlesList) {
        prefixListDiv.empty();
        for (var i = 0; i < handlesList.length; i++) {
            var handleString = handlesList[i];
            var link = $('<a class="list-handles-link" target="_blank">').attr('href', handleString).text(handleString);
            link.click(onPrefixClick);
            prefixListDiv.append(link);
        }
    }
    
    function onPageClick(ev) {
        ev.preventDefault();
        pageNum = $(ev.target).data("pageNumber");
        getPrefixes();
    }
    
    function onPrefixClick(e) {
        e.preventDefault();
        var link = $(this);
        var prefix = link.text();
        amplify.publish(HandleEvents.SELECTED_PREFIX_CHANGED, prefix);
    }
    
    function onError(response) {
        prefixListDiv.empty();
        paginationDiv.empty();
        notifications.alertError(response.msg);
        listPrefixesButton.button("reset");
    }
    
    function show() {
        containerDiv.show();
    }
    self.show = show;
    
    function hide() {
        containerDiv.hide();
    }
    self.hide = hide;
    
    constructor();
}