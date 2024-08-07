const fs = require('fs');
const { app, BrowserWindow, session, ipcMain, dialog, Tray, Menu, nativeImage } = require('electron');
require('@electron/remote/main').initialize();
const url = require('url');
const path = require('path');
const isBfsApp = require('./isBfsApp.js');

let appIcon;
if (fs.existsSync(`${__dirname}/icon.ico`)) {
    appIcon = `${__dirname}/icon.ico`;
}

let mainWindow;
const electronSettings = {
    width: 800,
    height: 600,
    webPreferences: {
        nodeIntegration: true,
        plugins: true,
        contextIsolation: false,
    },
    icon: appIcon,
};

let appState = { hasWritePermission: false, isSyncing: false, hasChanges: false };
let translatedTexts = {
    'electron.quit.unsaved': 'There are still some unsaved changes. would you like to save them?',
    'electron.quit.unsaved-unable-to-save':
        'There are still some unsaved changes. But there is no write permission. Do you want to close the app anyway?',
    'electron.app.invalid-state-title': 'Invalid app state',
    'electron.app.invalid-state-text': 'The given app state was not recognized:\n',
};

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
            { role: 'pasteAndMatchStyle' },
            { role: 'delete' },
            { role: 'selectAll' },
        ],
    },
    {
        label: 'View',
        submenu: [
            { role: 'reload' },
            { role: 'forceReload' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'togglefullscreen' },
        ],
    },
    {
        role: 'window',
        submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
];

function setCookiesPersistent() {
    const cookies = session.defaultSession.cookies;
    cookies.on('changed', async function (_event, cookie, _cause, removed) {
        if ((cookie.session || cookie.expirationDate === undefined) && cookie.httpOnly && !removed) {
            const newCookie = {
                url: `http://${cookie.domain}`,
                domain: cookie.domain,
                name: cookie.name,
                value: cookie.value,
                path: cookie.path,
                secure: false,
                hostOnly: false,
                httpOnly: cookie.httpOnly,
                session: false,
                // Make cookie persistent and set expiration date to 1 year, if set otherwise on the server, the login window will pop up
                expirationDate: Math.floor(new Date().getTime() / 1000) + 31536000,
            };
            await cookies.set(newCookie).catch((err) => {
                if (err) {
                    console.log('Error trying to persist cookie', err, cookie);
                }
            });
            await cookies.flushStore();
        }
        if (removed) {
            await cookies.remove(`http://${cookie.domain}`, cookie.name);
        }
    });
}

function createWindow() {
    mainWindow = new BrowserWindow(electronSettings);
    require('@electron/remote/main').enable(mainWindow.webContents);
    if (process.argv.some((arg) => arg === '--debug')) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.maximize();

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true,
        }),
    );

    let timeout = undefined;
    function clear() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        // @ts-ignore
        mainWindow = null;
        if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
        }
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    // Emitted when the window is closed.
    mainWindow.on('closed', () => {
        clear();
    });

    ipcMain.on('can-close', () => {
        clear();
        app.quit();
    });

    mainWindow.on('close', async function (e) {
        if (mainWindow) {
            if (!appState.hasWritePermission && (appState.hasChanges || appState.isSyncing)) {
                e.preventDefault();

                if (
                    (
                        await dialog.showMessageBox({
                            message: translatedTexts['electron.quit.unsaved-unable-to-save'],
                            buttons: ['Cancel', 'Close'],
                        })
                    ).response === 1
                ) {
                    clear();
                    app.quit();
                }
            }
            if (appState.hasWritePermission && appState.hasChanges) {
                e.preventDefault();

                if (
                    (
                        await dialog.showMessageBox({
                            message: translatedTexts['electron.quit.unsaved'],
                            buttons: ['Discard', 'Save'],
                        })
                    ).response === 1
                ) {
                    mainWindow.webContents.send('save-before-closing', true);

                    // Force quit if not being closed after 5 seconds
                    timeout = setTimeout(function () {
                        if (mainWindow) {
                            console.error('FORCE QUITTING');
                            app.quit();
                        }
                    }, 25000);
                } else {
                    mainWindow.webContents.send('discard-before-closing', true);
                }
            } else if (appState.hasWritePermission) {
                e.preventDefault();
                mainWindow.webContents.send('complete-before-closing', true);
            }
        }
    });
}

ipcMain.on('update-app-state', (event, newAppState) => {
    if (typeof newAppState === 'object' && Object.keys(appState).every((key) => key in newAppState)) {
        appState = newAppState;
    } else {
        console.error('Invalid app state', newAppState);
        dialog.showErrorBox(
            translatedTexts['electron.app.invalid-state-title'],
            translatedTexts['electron.app.invalid-state-text'] + '\n' + JSON.stringify(newAppState, undefined, 2),
        );
    }

    event.returnValue = 0;
    return;
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

ipcMain.on('set-translations', (event, newTranslations) => {
    translatedTexts = { ...translatedTexts, ...newTranslations };
    event.returnValue = 0;
    return;
});

ipcMain.on('save-file', (event, fileSaveOptions) => {
    const { content, targetPath, fileName } = fileSaveOptions;
    const saveFile = (/** @type {string} */ fileName) => {
        fs.writeFile(fileName, '\ufeff' + content, (err) => {
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
        dialog.showSaveDialog(mainWindow, { defaultPath: fileName }).then((newFileName) => {
            if (newFileName?.filePath === undefined) {
                event.returnValue = { state: 0 };
                return;
            }

            saveFile(newFileName.filePath);
        });
    }
});

// If the app is running in a BFS environment, we need to allow self-signed certificates
app.on('certificate-error', (event, _webContents, url, _error, _certificate, callback) => {
    if (isBfsApp || url.startsWith('https://localhost')) {
        event.preventDefault();
        callback(true);
    } else {
        callback(false);
    }
});

if (!app.requestSingleInstanceLock()) {
    app.quit();
} else {
    app.on('second-instance', () => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });

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
}
