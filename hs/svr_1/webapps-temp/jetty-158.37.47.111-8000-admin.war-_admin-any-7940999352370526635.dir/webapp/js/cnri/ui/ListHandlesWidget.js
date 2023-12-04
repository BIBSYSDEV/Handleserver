function ListHandlesWidget(containerDiv, client) {
    var self = this;
    var prefixInput = null;
    var listHandlesButton = null;
    var prefix = null;
    var handleListDiv = null;
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
        
        containerDiv.append($('<h4>List Handles</h4>'));
        
        var form = $('<form class="form-inline" role="form" style="margin-bottom: 0px;"></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);

        prefixInput = $('<input type="text" class="form-control input-sm" placeholder="Prefix"></input>');
        form.append(prefixInput);
        
        form.append(" ");
        
        listHandlesButton = $('<button class="btn btn-sm btn-primary" style="min-width: 87px;" data-loading-text="Wait...">List handles</button>');
        form.append(listHandlesButton);
        listHandlesButton.click(onListButtonClick);
        
        var notificationsDiv = $('<div class="notifications-small"></div>');
        containerDiv.append(notificationsDiv);
        notifications = new Notifications(notificationsDiv);
        
        paginationDiv = $('<div></div>');
        containerDiv.append(paginationDiv);
        handleListDiv = $('<div class="handle-list"></div>');
        containerDiv.append(handleListDiv);
        if (client.getSpecificSiteInfo() == null) {
            disable();
            notifications.alertWarning("You must select a specific site before listing handles.");
        }
    }
    
    function onCloseClick() {
        hide();
    }
    
    function disable() {
        prefixInput.prop('disabled', true);
        listHandlesButton.prop('disabled', true);
    }
    
    function enable() {
        prefixInput.prop('disabled', false);
        listHandlesButton.prop('disabled', false);
    }
    
    function onSpecificSiteSelectionChanged(specificSiteSelection) {
        if (specificSiteSelection.specificSite == null) {
            disable();
            notifications.alertWarning("You must select a specific site before listing handles.");
        } else {
            enable();
            notifications.clear();
        }
    }
    
    function listHandleForPrefix(prefixParam) {
        if (prefix === "") {
            return;
        }
        notifications.clear();
        prefixInput.val(prefixParam);
        prefix = prefixParam;
        pageNum = 0;
        listHandlesButton.button("loading");
        var site = client.getSpecificSiteInfo();
        client.listHandlesAtSite(prefix, site, pageNum, pageSize, onSuccess, onError);
    }
    self.listHandleForPrefix = listHandleForPrefix;
    
    function onListButtonClick() {
        notifications.clear();
        prefix = prefixInput.val();
        if (prefix === "") {
            notifications.alertError("You must specify a prefix.");
            return;
        }
        pageNum = 0;
        listHandlesButton.button("loading");
        var site = client.getSpecificSiteInfo();
        client.listHandlesAtSite(prefix, site, pageNum, pageSize, onSuccess, onError);
    }
    
    function getHandles() {
        var site = client.getSpecificSiteInfo();
        client.listHandlesAtSite(prefix, site, pageNum, pageSize, onSuccess, onError);
    }
    
    function onSuccess(response) {
        notifications.clear();
        handleListDiv.empty();
        paginationDiv.empty();
        var handlesList = response.handles;
        if (response.totalCount > pageSize) {
            pagination = new SearchResultsPagination(paginationDiv, response.totalCount, pageNum, pageSize, onPageClick); 
        } else if (response.totalCount == 0) {
            notifications.alertWarning("Server does contain any handles under the specified prefix.");
        } 
        writeHandlesToResultsDiv(handlesList);
        listHandlesButton.button("reset");
    }
    
    function writeHandlesToResultsDiv(handlesList) {
        handleListDiv.empty();
        for (var i = 0; i < handlesList.length; i++) {
            var handleString = handlesList[i];
            var href ="http://hdl.handle.net/" + encodeURIPath(handleString);
            var link = $('<a class="list-handles-link" target="_blank">').attr('href', href).text(handleString);
            link.click(onHandleClick);
            handleListDiv.append(link);
        }
    }
    
    function onPageClick(ev) {
        ev.preventDefault();
        pageNum = $(ev.target).data("pageNumber");
        getHandles();
    }
    
    function onHandleClick(e) {
        e.preventDefault();
        var link = $(this);
        var handle = link.text();
        app.getHandle(handle);
    }
    
    function onError(response) {
        handleListDiv.empty();
        paginationDiv.empty();
        notifications.alertError(response.msg);
        listHandlesButton.button("reset");
    }
    
    function show() {
        containerDiv.show();
    }
    self.show = show;
    
    function hide() {
        containerDiv.hide();
    }
    self.hide = hide;
    
	function encodeURIPath(path) {
	    return encodeURIComponent(path).replace(/%2F/gi, '/');
	}

    constructor();
}