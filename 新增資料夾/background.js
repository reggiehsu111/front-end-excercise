var blocking=false;
var mode="";
var pst=0.1; //post-relax time length (the user has to work for at least psd minutes after relax time)

chrome.runtime.onInstalled.addListener(function(){
    chrome.storage.sync.set({"blacklist": ["facebook.com"], "mode": "", "time": ""});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.status=="start")
    {
        //console.log("start message received " +mode);
        if (mode!="")
            alert("you are already in " +mode+ " mode!");
        else if (message.mode=="work")
            workMode(message.time);
        else if (message.mode=="relax")
            relaxMode(message.time);
    }
    
    else if (message.status=="stop")
    {
        //console.log("stop message received");
        cancel();
    }
});

var t=0,t2=0;
var tp;
function workMode(time)
{
    console.log("enter work mode, timer set to " +time);
    mode="work";
    chrome.storage.sync.set({"mode": "work mode"});
    if (t==0)
    {
        chrome.alarms.create("workTimer", {delayInMinutes: time});
        chrome.alarms.create("displayTimer", {when: Date.now()+100, periodInMinutes: 1});
        t++;
        t2++;
        tp=0;
    }
    chrome.runtime.sendMessage({timeLeft: time});
    chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name=="displayTimer" && t2==1)
        {
            chrome.runtime.sendMessage({timeLeft: time-tp});
            chrome.storage.sync.set({"time": time-tp});
            tp++;
        }
    });
    blocking=true;
    
    //check and block existing tabs
    chrome.tabs.query({},function(tabs) {
        for (i=0; i<tabs.length; i++)
            checkAndBlock(tabs[i]);
    });
    
    //time's up
    chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name=="workTimer" && t==1)
        {
            blocking=false;
            mode="";
            chrome.storage.sync.set({"mode": ""});
            alert("work time end!");
            t=0;
            t2=0;
            chrome.alarms.clear("displayTimer");
            chrome.runtime.sendMessage({timeLeft: 0});
            chrome.storage.sync.set({"time": ""});
        }
    });
}

function relaxMode(time)
{
    console.log("enter relax mode, timer set to " +time);
    mode="relax";
    chrome.storage.sync.set({"mode": "relax mode"});
    if (t==0)
    {
        chrome.alarms.create("relaxTimer", {delayInMinutes: time});
        chrome.alarms.create("displayTimer", {when: Date.now()+100, periodInMinutes: 1});
        t++;
        t2++;
        tp=0;
    }
    chrome.runtime.sendMessage({timeLeft: time});
    chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name=="displayTimer" && t2==1)
        {
            chrome.runtime.sendMessage({timeLeft: time-tp});
            chrome.storage.sync.set({"time": time-tp});
            tp++;
        }
    });
    blocking=false;
    
    //relax time's up
    chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name=="relaxTimer" && t==1)
        {
            alert("relax time end, start working!");
            chrome.alarms.clear("displayTimer");
            chrome.runtime.sendMessage({timeLeft: 0});
            chrome.storage.sync.set({"time": ""});
            t=0;
            t2=0;
            //check and block existing tabs
            chrome.tabs.query({},function(tabs) {
                for (i=0; i<tabs.length; i++)
                    checkAndBlock(tabs[i]);
            });
            
            setTimeout(function() {
                console.log("relax mode end, enter post-relax mode");
                mode="postRelax";
                chrome.storage.sync.set({"mode": "post-relax mode"});
                if (t==0)
                {
                    chrome.alarms.create("postRelaxTimer", {delayInMinutes: pst});
                    chrome.alarms.create("displayTimer", {when: Date.now()+100, periodInMinutes: 1});
                    t++;
                    t2++;
                    tp=0;
                }
                chrome.runtime.sendMessage({timeLeft: time});
                chrome.alarms.onAlarm.addListener(function(alarm) {
                    if (alarm.name=="displayTimer" && t2==1)
                    {
                        chrome.runtime.sendMessage({timeLeft: time-tp});
                        chrome.storage.sync.set({"time": time-tp});
                        tp++;
                    }
                });
                blocking=true;             
            
                //post-relax time's up
                chrome.alarms.onAlarm.addListener(function(alarm) {
                    if (alarm.name=="postRelaxTimer" && t==1)
                    {
                        console.log("post-relax mode end, idle.");
                        mode="";
                        chrome.storage.sync.set({"mode": ""});
                        blocking="false";
                        t=0;
                        t2=0;
                        chrome.alarms.clear("displayTimer");
                        chrome.runtime.sendMessage({timeLeft: 0});
                        chrome.storage.sync.set({"time": ""});
                    }
                });
            },250);
        }
    });    
}

function cancel()
{
    t=0;
    t2=0;
    if (mode=="work")
    {
        console.log("cancel work mode");
        alert("are you sure you want to end work mode?");
        chrome.alarms.clear("workTimer", function(wasCleared){
            blocking=false;
            mode="";
            alert("work mode canceled!");
        });
    }

    else if (mode=="relax")
    {
        console.log("cancel relax mode");
        alert("are you sure you want to end relax mode?");
        chrome.alarms.clear("relaxTimer", function(wasCleared){
            mode="";
            alert("relax mode canceled!");
        });
    }
    
    else if (mode=="postRelax")
    {
        console.log("cancel post-relax mode");
        alert("relax time has ended, you need to concentrate for "+ pst+ "minutes to unblock. Are you sure you want to cancel?");
        chrome.alarms.clear("postRelaxTimer", function(wasCleared){
            console.log("post-relax mode end, idle.");
            mode="";
            blocking="false";
        });
    }
    chrome.alarms.clear("displayTimer");
    chrome.runtime.sendMessage({timeLeft: 0});
    chrome.storage.sync.set({"mode": ""});
    chrome.storage.sync.set({"time": ""});
}

var b=0;
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
    if (blocking==true && b==0 )
    {
        b++;
        chrome.alarms.create("block", {when: Date.now()+100});
        checkAndBlock(tab);
    }
});
chrome.alarms.onAlarm.addListener(function(alarm) {
    if (alarm.name=="block")
        b=0;
});

function checkAndBlock(tab)
{
    chrome.storage.sync.get("blacklist", function(b) {
        var u=b.blacklist;
        for (i=0; i<u.length; i++)
        {
            if (tab.url.match(u[i])!=null)
            {
                //console.log("blocking tab #" +tab.id);
                chrome.tabs.remove(tab.id);
                if (mode=="postRelax")
                {
                    console.log("attempting to play during post-relax mode.");
                    alert("hey, relax time has end, get to work!");
                    //clear the timer and start again
                    chrome.alarms.clear("postRelaxTimer", function(wasCleared){
                        chrome.alarms.create("postRelaxTimer", {delayInMinutes: pst});
                    });
                }
            }
        }
    });      
}