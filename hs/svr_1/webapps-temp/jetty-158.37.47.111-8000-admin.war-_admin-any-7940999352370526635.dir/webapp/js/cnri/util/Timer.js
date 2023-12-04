function Timer(name) {
    var self = this;
    
    var startTime = null;
    var endTime = null;
    var duration = 0; 
    var isRunning = false;
    
    function start() {
        if (!isRunning) {
            startTime = new Date().getTime();
            isRunning = true;
        }
    }
    self.start = start;
    
    function stop() {
        if (isRunning) { 
            endTime = new Date().getTime();
            duration += endTime - startTime;
            isRunning = false;
        }
    }
    self.stop = stop;
    
    function getResult() {
        if (isRunning) stop();
        return name +":Process took " + duration + " milli seconds (" + duration/1000 + " seconds)";
    }
    
    function toString() {
        return getResult();
    }
    self.toString = toString;
    
    function getDuration() { 
        if(isRunning) return duration + new Date().getTime() - startTime;
        else return duration; 
    }
    self.getDuration = getDuration;
}