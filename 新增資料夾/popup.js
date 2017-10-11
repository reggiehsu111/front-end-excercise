document.addEventListener('DOMContentLoaded', function () {
var m="";
var t=0;
var tl="";

chrome.storage.sync.get("mode", function(s) {
    document.getElementById('mode').innerHTML=s.mode;
});
chrome.storage.sync.get("time", function(s) {
    document.getElementById('time').innerHTML=s.time;
});

document.getElementById('workMode').addEventListener("click", function(event) {
    m= "work";
    document.getElementById('mode').innerHTML="work mode";
});
document.getElementById('relaxMode').addEventListener("click", function(event) {
    m = "relax";
    document.getElementById('mode').innerHTML="relax mode";
});

document.getElementById('start').addEventListener("click", function(event) {
	//console.log("start clicked!");
	t=Number(document.getElementById('timer').value);
	if (isNaN(t) || t==null || t==0)
	    alert("please enter a number in the timer!");
	else if (m=="")
	    alert("please choose a mode first!");
	else
        chrome.runtime.sendMessage({status: "start", mode: m, time: t});
    console.log(m);console.log(t);
        
});


document.getElementById('cancel').addEventListener("click", function(event) {
	console.log("cancel clicked!");
    chrome.runtime.sendMessage({status: "stop", mode: "work", time: 0});
});
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    if (message.timeLeft!=0)
    {
        
        tl=message.timeLeft;console.log(tl);
        chrome.storage.sync.set({"time": tl});
    }
    else
    {
        tl="";
        chrome.storage.sync.set({"time": tl});
    }
    document.getElementById('time').innerHTML=tl;
    chrome.storage.sync.get("mode", function(s) {
        document.getElementById('mode').innerHTML=s.mode;
    });
});