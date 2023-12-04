// Simple text-input to combo-box; depends on Twitter Bootstrap
(function(){
"use strict";

window.cnri = window.cnri || {};
cnri.ui = cnri.ui || {};

cnri.ui.ComboBox = function (textInput, items) {
    var self = this;
    textInput = $(textInput);
    var div = null;
    var spacer = null;
    
    function constructor() {
        div = $('<div class="input-append dropdown" style="display: inline-block; line-height: 30px; position: absolute"/>');
        textInput.before(div);
        textInput.detach();
        div.append(textInput);
        var button = $('<button type="button" class="btn btn-sm btn-default" data-toggle="dropdown"/>');
        button.append($('<span class="caret"/>'));
        button.css("-webkit-border-radius", "0 4px 4px 0");
        button.css("-moz-border-radius", "0 4px 4px 0");
        button.css("border-radius", "0 4px 4px 0");
        button.css("padding-left", "4px");
        button.css("padding-right", "6px");
        div.append(button);
        var ul = $('<ul class="dropdown-menu"/>');
        ul.on('click','a',onClick);
        div.append(ul);
        for(var i = 0; i < items.length; i++) {
            var li = $('<li>');
            var a = $('<a>').attr('href', '#').text(items[i]);
            li.append(a);
            ul.append(li);
        }
        spacer = $('<div style="display: inline-block; line-height: 30px"/>');
        spacer.width(div.width());
        div.after(spacer);
    }
    
    function hide() {
        div.hide();
        spacer.hide();
    }
    self.hide = hide;
    
    function show() {
        div.css("display", "inline-block");
        spacer.css("display", "inline-block");
    }
    self.show = show;
    
    function onClick(event) {
        event.preventDefault();
        textInput.val($(event.target).parent().text());
        textInput.trigger('change');
    }
    
    constructor();
};

/*end*/})();
