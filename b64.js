// ---------------------------------------------------------
// Set global vars:
// ---------------------------------------------------------
var dropper     = document.getElementById("dropper");
var results     = document.getElementById("resultsList");
var deleteall   = document.getElementById("deleteAll");
var infoBox     = document.getElementById("infoBox");

var remote = require('remote');
var events = require('events');
var clipboard = require('clipboard');
var dialog = remote.require('dialog');
var Menu = remote.require('menu');
var BrowserWindow = remote.require('browser-window');

var curWindow = remote.getCurrentWindow();

// ---------------------------------------------------------
// App Menus:
// ---------------------------------------------------------
var template = [
  {
    label: 'B64',
    submenu: [
      {
        label: 'About B64',
        selector: 'orderFrontStandardAboutPanel:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Services',
        submenu: []
      },
      {
        type: 'separator'
      },
      {
        label: 'Hide B64',
        accelerator: 'CmdOrCtrl+H',
        selector: 'hide:'
      },
      {
        label: 'Hide Others',
        accelerator: 'CmdOrCtrl+Shift+H',
        selector: 'hideOtherApplications:'
      },
      {
        label: 'Show All',
        selector: 'unhideAllApplications:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit',
        accelerator: 'CmdOrCtrl+Q',
        selector: 'terminate:'
      },
    ]
  },
  {
    label: 'Debug',
    submenu: [
      {
        label: 'Reload',
        accelerator: 'CmdOrCtrl+R',
        click: function() { remote.getCurrentWindow().reload(); }
      },
      {
        label: 'Toggle DevTools',
        accelerator: 'Alt+CmdOrCtrl+I',
        click: function() { remote.getCurrentWindow().toggleDevTools(); }
      },
    ]
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'Minimize',
        accelerator: 'CmdOrCtrl+M',
        selector: 'performMiniaturize:'
      },
      {
        label: 'Close',
        accelerator: 'CmdOrCtrl+W',
        selector: 'performClose:'
      },
      {
        type: 'separator'
      },
      {
        label: 'Bring All to Front',
        selector: 'arrangeInFront:'
      }
    ]
  }
];

menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);




// ---------------------------------------------------------
// Check if FileReader is present:
// ---------------------------------------------------------
if (typeof window.FileReader === 'undefined') alert('File API & FileReader not supported');



// ---------------------------------------------------------
// Run Stuff:
// ---------------------------------------------------------

updateStorageSpace();


// ---------------------------------------------------------
// Titlebar:
// ---------------------------------------------------------

// Close Window:
document.getElementById("closeWindow").addEventListener("click", function (e) {
   console.log("Close Clicked");
   var window = remote.getCurrentWindow();
   window.close();
});

// Minimise Window:
document.getElementById("minimiseWindow").addEventListener("click", function (e) {
   var window = remote.getCurrentWindow();
   window.minimize();
});

/*
// Maximise WIndow:
document.getElementById("fsWindow").addEventListener("click", function (e) {
   var window = remote.getCurrentWindow();
   window.maximize();
});
*/


dropper.ondragover  = function () { dropper.className = 'hover';    return false; };
dropper.ondragend   = function () { dropper.className = '';         return false; };
dropper.ondragleave = function () { dropper.className = '';         return false; };

dropper.ondrop = function (e) {
    e.preventDefault();

    var file = e.dataTransfer.files[0],
        reader = new FileReader();

    reader.onload = function(event) {

        if (file.size > 100000) {

            dialog.showMessageBox(
                {
                    type:       'warning',
                    message:    'Large File',
                    detail:     'This file will produce a very long DataURI. Do you really want to process it?',
                    buttons:    ['Cancel', 'Process Anyway']
                },
                    function (cb) {
                        // Callback
                        if(cb == 0) {
                            return false;
                        }
                        if(cb == 1) {
                            fileLoaded(file.name, event.target.result);
                        }
                    }
            );

        } else if (!file.type.match('image')) {

            dialog.showErrorBox("Error", "File is not an image");
            return false;

        } else {

            fileLoaded(file.name, event.target.result);
        }

        // ---------------------------------------------------------
        // Logging:
        // ---------------------------------------------------------
        // console.log(file);                                                  // Log raw file properties
        // console.log(file.name, "Name");                                     // log type of dropped file
        // console.log(file.size, "Bytes");                                    // log size of dropped file
        // console.log(file.lastModifiedDate.toLocaleDateString(), "Date");    // log creation date of dropped file
        // console.log(file.type, "Type");                                     // log type of dropped file
        // ---------------------------------------------------------

    };

    reader.readAsDataURL(file);


    dropper.className = '';
    return false;
};


// ---------------------------------------------------------
// Main function:
// ---------------------------------------------------------

function fileLoaded(fileName, dataUri) {

    // Create li with class "itemLi"
    var itemLi = document.createElement("li");
    itemLi.className = 'item';
    itemLi.id = 'item';


    // Remove Button
    var remove = document.createElement("button");
    remove.className = 'remove';
    remove.innerHTML = "<img src='assets/cancel@2x.png'>";

    remove.onclick = function() {
        if(localStorage) localStorage.removeItem(fileName);

        itemLi.className += ' remove';

        // Add an event listener for end of animation, then remove from DOM etc
        itemLi.addEventListener("animationend",function(e){
            results.removeChild(itemLi);
            infoBox.innerHTML = "&cross; File Deleted";
            updateStorageSpace();
        },false);

    };

    itemLi.appendChild(remove);


    // Create "imagecontainer" div
    if(/^data:image/.test(dataUri)) {
        var imgDiv = document.createElement("div");
        imgDiv.className = 'imagecontainer';
        var img = document.createElement("img");
        img.src = dataUri;
        imgDiv.appendChild(img);
        itemLi.appendChild(imgDiv);
    }


    // Create "imageinfo" div
    var name = document.createElement("div");
    name.className = 'imageinfo';

    var imgFileSize = dataUri.length;

    formatBytes(imgFileSize);

    function formatBytes(imgFileSize) {

        if(imgFileSize < 1024)              humanSize = imgFileSize + " Bytes";
        else if(imgFileSize < 1048576)      humanSize = (imgFileSize / 1024).toFixed(3) + " KB";
        else if(imgFileSize < 1073741824)   humanSize = (imgFileSize / 1048576).toFixed(3) + " MB";
        else                                humanSize = (imgFileSize / 1073741824).toFixed(3) + " GB";

    };

    name.innerHTML = /*fileName + "<br><br>*/"DataURI Size:<br>"  + humanSize;
    itemLi.appendChild(name);



    // Create textarea
    var ta = document.createElement("textarea");
    ta.onclick = function() {
        // ta.select();
        clipboard.writeText(dataUri);
        alert("DataURI Copied to clipboard");
        infoBox.innerHTML = "&check; Clipboarded!";
    };
    ta.value = dataUri;
    itemLi.appendChild(ta);


    // Add to results div
    results.appendChild(itemLi);

    infoBox.innerHTML = "&check; File Added";

    // Add to local storage:
    if(localStorage) localStorage.setItem(fileName, dataUri);

    updateStorageSpace();
}

// ---------------------------------------------------------
// LocalStorage:
// ---------------------------------------------------------

if(localStorage)
    for(var fileName in localStorage)
        fileLoaded(fileName, localStorage.getItem(fileName));

function updateStorageSpace() {

    var allocated = 5;
    var total = 0;

    for(var x in localStorage){
        var amount = (localStorage[x].length * 2) / 1024 / 1024;
        total += amount;
    }

    var spaceRemaining = allocated - total.toFixed(2);
    document.getElementById("storageSpace").innerHTML = "<progress value=" + total + " max=" + allocated + "></progress>";

}

// ---------------------------------------------------------
// Delete All Files:
// ---------------------------------------------------------


deleteAll.onclick = function() {

    // Array for dialog:
    var options = {
        type: 'warning',
        buttons: ["Cancel", "Delete All"],
        title:   "Delete All Files?",
        message: "Delete All Files?",
        detail:  "This will delete all the files!"
    }

    dialog.showMessageBox(curWindow, options, function(response) {
        if(response) { deleteAllFiles(); }
    });


};

function deleteAllFiles() {
    localStorage.clear();
    infoBox.innerHTML = "&cross; All files deleted";
    results.innerHTML = '';
    updateStorageSpace();
}
