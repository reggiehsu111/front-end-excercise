var u={};
var n;
document.addEventListener('DOMContentLoaded', function () { 
    chrome.storage.sync.get("blacklist", function(b) {
        u=b.blacklist;
        n=u.length;
        
        updateHTML();
    });
    
    document.getElementById('add').addEventListener("click", function(event) {
        url=document.getElementById('new').value; 
        
        chrome.storage.sync.get("blacklist", function(b) {
            u=b.blacklist;
            n=u.length;
            u[n]=url;
        
            chrome.storage.sync.set({"blacklist": u}, function() {
                document.getElementById('blacklist').removeChild(document.getElementById('table'));
                updateHTML();
                window.location.reload();
            });
        });       
    });
    
    document.getElementById('remove').addEventListener("click", function(event) {
        var c=document.getElementsByClassName('check');
        var k=0;
        var list=[];
        for (j=0; j<c.length; j++)
        {
            if (c[j].checked)
            {
                console.log(c[j].id);
                list[k]=c[j].id;
                k++;
            }   
        }
        
        if (list.length>0)
        {
            chrome.storage.sync.get("blacklist", function(b) {
                u=b.blacklist;
                var u2=[];
                k=0;
                var j=0;
                for (i=0; i<u.length; i++)
                {
                    if (list[k]!=i)
                    {
                        u2[j]=u[i];
                        j++;
                    }
                    else
                        k++; 
                }
                
                chrome.storage.sync.set({"blacklist": u2}, function() {
                    document.getElementById('blacklist').removeChild(document.getElementById('table'));
                    updateHTML();
                    window.location.reload();
                });
            }); 
        }
    }); 
});

function updateHTML()
{
    var table=document.createElement('table');
    table.setAttribute('id', "table");
    document.getElementById('blacklist').appendChild(table);
    for(i=0;i<n;i++)
    {
            var newurl= document.createElement('tr');
            newurl.setAttribute('id', "l"+i);
            newurl.innerHTML=u[i]+" ";
            var remove= document.createElement('input');
            remove.setAttribute('id', i);
            remove.setAttribute('class', "check");
            remove.setAttribute('type', 'checkbox');
            newurl.appendChild(remove);
            document.getElementById('table').appendChild(newurl);
    }
}