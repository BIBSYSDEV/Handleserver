function HandleValueAdvancedEditorWidget(containerDiv, handleValue) {
    var self = this;
    
    var widgetId = null;
    
    var permissionsMask = null;
    var PUBLIC_WRITE    = 0;
    var PUBLIC_READ     = 1;
    var ADMIN_WRITE     = 2;
    var ADMIN_READ      = 3;
    
    self.PUBLIC_WRITE = PUBLIC_WRITE;
    self.PUBLIC_READ = PUBLIC_READ;
    self.ADMIN_WRITE = ADMIN_WRITE;
    self.ADMIN_READ = ADMIN_READ;
    
    var ttlInput = null;
    var buttonGroup = null;
    
    function constructor() {
        widgetId = HandleValueAdvancedEditorWidget.count++;
        var isBigEndian = true;
        if (handleValue.permissions === undefined) {
            permissionsMask = new cnri.util.BitString("1110", isBigEndian);
        } else {
            permissionsMask = new cnri.util.BitString(handleValue.permissions, isBigEndian);
        }
        
        var form = $('<form class="form-horizontal" role="form"></form>');
        form.submit(function(e) {return false;}); 
        containerDiv.append(form);
        
        buildPermissionsButtons(form);
        buildTimeToLiveInput(form);
        if (handleValue.timestamp) buildTimestampDisplay(form);
    }
    
    function buildPermissionsButtons(form) {
        var row = $('<div class="row"></div>');
        form.append(row);
        buttonGroup = $('<div class="btn-group col-md-12" data-toggle="buttons-checkbox" style="margin-left: 0px; margin-bottom: 5px;"></div>');
        row.append(buttonGroup);
        addToggleButton(buttonGroup, "Readable by Admins",    permissionsMask.getBit(ADMIN_READ),   onPermissionsButtonClicked, {bitPosition : ADMIN_READ});
        addToggleButton(buttonGroup, "Writeable by Admins",   permissionsMask.getBit(ADMIN_WRITE),  onPermissionsButtonClicked, {bitPosition : ADMIN_WRITE});
        addToggleButton(buttonGroup, "Readable by Everyone",  permissionsMask.getBit(PUBLIC_READ),  onPermissionsButtonClicked, {bitPosition : PUBLIC_READ});
        addToggleButton(buttonGroup, "Writeable by Everyone", permissionsMask.getBit(PUBLIC_WRITE), onPermissionsButtonClicked, {bitPosition : PUBLIC_WRITE});
    }
    
    function addToggleButton(buttonGroup, text, isActive, clickCallback, data) {
        var button = $('<button type="button" class="btn btn-sm btn-default admin-permission-button col-md-3"></button>').text(text);
        button.focus(function () { this.blur(); });
        if (isActive) {
            button.addClass("active");
        }
        button.click(clickCallback);
        if (data != undefined) {
            button.data("data", data);
        }
        buttonGroup.append(button);
    } 
    
    function onPermissionsButtonClicked(e) {
        var button = $(this);
        var wasActive = button.hasClass("active");
        var value = !wasActive;
        var data = button.data("data");
        if (data != undefined) {
            var bitPosition = data.bitPosition;
            permissionsMask.setBit(bitPosition, value);
            handleValue.permissions = permissionsMask.toString();
        }
    } 
    
    function setPermission(bitPosition, value) {
        permissionsMask.setBit(bitPosition, value ? 1 : 0);
        handleValue.permissions = permissionsMask.toString();
        buttonGroup.find('button').each(function (index, button) {
            button = $(button);
            if (button.data('data').bitPosition === bitPosition) {
                if (value) button.addClass('active');
                else button.removeClass('active');
            }
        });
    }
    self.setPermission = setPermission;
    
    function buildTimeToLiveInput(form) {
        ttlInput = addTextInput(form, "TTL (seconds)" , "ttlId-"+widgetId, handleValue.ttl, ttlChangeCallback);
    } 
   
    function ttlChangeCallback() {
        var value = ttlInput.val();
        var ttlAsInt = filterInt(value);
        var ttl = null;
        if (isNaN(ttlAsInt)) {
            ttl = value;
        } else {
            ttl = ttlAsInt;
        }
        handleValue.ttl = ttl;
    }
    
    function filterInt(value)     {
        if(/^\-?([0-9]+|Infinity)$/.test(value)) {
            return parseInt(value);
        } else {
            return NaN;
        }
    }
    
    function buildTimestampDisplay(form) {
        var controlGroupDiv = $('<div class="form-group"></div>'); 
        form.append(controlGroupDiv);
        var label = $('<label class="col-sm-2 control-label"></label>').text('Timestamp');
        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="col-sm-3 control-label" style="text-align:left"></div>');
        controlGroupDiv.append(controlsDiv);
        controlsDiv.append(handleValue.timestamp);
    }
    
    function addTextInput(form, labelText, inputId, value, changeCallback) {
        var valueString = "";
        if (isNumber(value)) {
            valueString = valueString + value;
        } else {
            valueString = value;
        }
        var controlGroupDiv = $('<div class="form-group"></div>'); 
        form.append(controlGroupDiv);
        var label = $('<label class="col-sm-2 control-label"></label>').attr('for', inputId).text(labelText);
        controlGroupDiv.append(label);
        var controlsDiv = $('<div class="col-sm-3"></div>');
        controlGroupDiv.append(controlsDiv);
        var input = $('<input type="text" class="form-control input-sm">').attr('id', inputId);
        input.val(valueString);
        controlsDiv.append(input);
        input.change(changeCallback);
        return input;
    }
    
    function isPermissionUnusual() {
        if (handleValue.permissions === "1110") {
            return false;
        } else {
            return true;
        }
    }
    self.isPermissionUnusual = isPermissionUnusual;
    
    function show() {
        containerDiv.show();
    }
    self.show = show;
    
    function hide() {
        containerDiv.hide();
    }
    self.hide = hide;
    
    function isObject(o) { return Object.prototype.toString.call(o) == '[object Object]'; }
    function isArray(o) { return Object.prototype.toString.call(o) == '[object Array]'; }
    function isBoolean(o) { return Object.prototype.toString.call(o) == '[object Boolean]'; }
    function isNumber(o) { return Object.prototype.toString.call(o) == '[object Number]'; }
    function isString(o) { return Object.prototype.toString.call(o) == '[object String]'; }
    
    constructor();
}

HandleValueAdvancedEditorWidget.count = 0;