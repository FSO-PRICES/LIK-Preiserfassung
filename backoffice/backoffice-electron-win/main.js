const electron = require('electron');
const fs = require('fs');
// Module to control application life.
const app = electron.app;
const Menu = electron.Menu;
const ipcMain = electron.ipcMain;
const dialog = electron.dialog;

const template = [
    {
        label: 'Edit',
        submenu: [
            { role: 'undo' },
            { role: 'redo' },
            { type: 'separator' },
            { role: 'cut' },
            { role: 'copy' },
            { role: 'paste' },
            { role: 'pasteandmatchstyle' },
            { role: 'delete' },
            { role: 'selectall' },
        ],
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forcereload' },
            { role: 'toggledevtools' },
            { type: 'separator' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ],
    },
    {
        role: 'window',
        submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
];

// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;

const path = require('path');
const url = require('url');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow() {
    // Create the browser window.
    mainWindow = new BrowserWindow();
    mainWindow.maximize();

    // and load the index.html of the app.
    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, 'ionic-browser-app', 'index.html'),
            protocol: 'file:',
            slashes: true,
        })
    );

    // Open the DevTools.
    // mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

function setCookiesPersistent() {
    const cookies = electron.session.defaultSession.cookies;
    cookies.on('changed', function(event, cookie, cause, removed) {
        if ((cookie.session || cookie.expirationDate === undefined) && cookie.httpOnly && !removed) {
            const newCookie = {
                url: `http://${cookie.domain}`,
                domain: cookie.domain,
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain,
                path: cookie.path,
                secure: false,
                hostOnly: false,
                httpOnly: cookie.httpOnly,
                session: false,
                // Make cookie persistent and set expiration date to 1 year, if set otherwise on the server, the login window will pop up
                expirationDate: Math.floor(new Date().getTime() / 1000) + 31536000,
            };
            cookies.set(newCookie, function(err, x) {
                if (err) {
                    console.log('Error trying to persist cookie', err, cookie);
                }
            });
            cookies.flushStore(() => {});
        }
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
    createWindow();
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    // The session cookie doesn't persist, transforming it into a cookie with expiration date marks it persistent
    setCookiesPersistent();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function() {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('save-file', (event, fileSaveOptions) => {
    const { content, targetPath, fileName } = fileSaveOptions;
    const saveFile = fileName => {
        fs.writeFile(fileName, content, err => {
            if (err) {
                event.returnValue = { state: 2, error: err };
                return;
            }

            event.returnValue = { state: 1 };
        });
    };

    if (targetPath) {
        saveFile(targetPath + '/' + fileName);
    } else {
        dialog.showSaveDialog({ defaultPath: fileName }, newFileName => {
            if (newFileName === undefined) {
                event.returnValue = { state: 0 };
                return;
            }

            saveFile(newFileName);
        });
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
