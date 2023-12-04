function ObjectChangeDetector(objectToWatch, clientOnChangeCallback, delay) {
    var self = this;
    var timeoutID = null;
    var lastObjectState = null;
    var defaultDelay = 500; //0.5 seconds
    
    function constructor() {
        if (delay === null || delay === undefined) {
            delay = defaultDelay;
        }
        updateLastObjectState();
    }
    
    function onTimeout() {
        if (!cnri.util.Equality.compare(lastObjectState, objectToWatch)) {
            updateLastObjectState();
            window.setTimeout(onTimeout, delay);
            clientOnChangeCallback();
        } else {
            window.setTimeout(onTimeout, delay);
            updateLastObjectState();
        }
    }
    
    function updateLastObjectState() {
        if (objectToWatch === null) {
            lastObjectState = null;
        } else {
            lastObjectState = jQuery.extend(true, {}, objectToWatch);
        }
    }
    
    function reset() {
        updateLastObjectState();
    }
    self.reset = reset;
    
    function start() {
        window.setTimeout(onTimeout, delay);
    }
    self.start = start;
    
    function stop() {
        if (timeoutID !== null) {
            window.clearTimeout(timeoutID);
        }
    }
    self.stop = stop;
    
    function setNewObjectToWatch(newObjectToWatch) {
        objectToWatch = newObjectToWatch;
        updateLastObjectState();
    }
    self.setNewObjectToWatch = setNewObjectToWatch;
    
    constructor();
}