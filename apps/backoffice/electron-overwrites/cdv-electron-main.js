/*
    Licensed to the Apache Software Foundation (ASF) under one
    or more contributor license agreements.  See the NOTICE file
    distributed with this work for additional information
    regarding copyright ownership.  The ASF licenses this file
    to you under the Apache License, Version 2.0 (the
    "License"); you may not use this file except in compliance
    with the License.  You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing,
    software distributed under the License is distributed on an
    "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, either express or implied.  See the License for the
    specific language governing permissions and limitations
    under the License.
*/

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

const fs = require('fs');
// Module to control application life, browser window and tray.
const { app, dialog, ipcMain, BrowserWindow, Menu, session } = require('electron');
// Electron settings from .json file.
const cdvElectronSettings = require('./cdv-electron-settings.json');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function setCookiesPersistent() {
    const cookies = session.defaultSession.cookies;
    cookies.on('changed', function(_event, cookie, _cause, removed) {
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

function createWindow() {
    // Create the browser window.
    let appIcon;
    if (fs.existsSync(`${__dirname}/img/app.ico`)) {
        appIcon = `${__dirname}/img/app.ico`;
    }

    const browserWindowOpts = Object.assign({}, cdvElectronSettings.browserWindow, { icon: appIcon });
    mainWindow = new BrowserWindow(browserWindowOpts);

    // and load the index.html of the app.
    // TODO: possibly get this data from config.xml
    mainWindow.loadURL(`file://${__dirname}/index.html`);
    mainWindow.webContents.on('did-finish-load', function() {
        mainWindow.webContents.send('window-id', mainWindow.id);
    });

    // Open the DevTools.
    if (cdvElectronSettings.browserWindow.webPreferences.devTools) {
        mainWindow.webContents.openDevTools();
    }

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    createWindow();
    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
    // The session cookie doesn't persist, transforming it into a cookie with expiration date marks it persistent
    setCookiesPersistent();
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});

ipcMain.on('save-file', (event, fileSaveOptions) => {
    const { content, targetPath, fileName } = fileSaveOptions;
    const saveFile = fileName => {
        fs.writeFile(fileName, '\ufeff' + content, err => {
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