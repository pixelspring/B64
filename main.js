var app = require('app');
// var remote = require('remote');
// var dialog = require('dialog');
// var fs = require('fs');
// var path = require('path');
var BrowserWindow = require('browser-window');

var mainWindow = null;

app.on('window-all-closed', function() {
    app.quit();
});





app.on('ready', function() {

    mainWindow = new BrowserWindow({
        width: 302,
        height: 476,
        resizable: true,
        frame: false,
        transparent: true,
        'auto-hide-menu-bar': true,
        'use-content-size': true
    });

    // mainWindow.setMaximumSize(302, 800);
    // mainWindow.setMinimumSize(302, 400);



    mainWindow.loadUrl('file://' + __dirname + '/index.html');
    mainWindow.show();

});
