const fs = require('fs');
const { app, BrowserWindow, session, ipcMain, dialog, Menu } = require('electron');
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
        contextIsolation: false,
    },
    icon: appIcon,
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
    // if (process.argv.some((arg) => arg === '--debug')) {
    // }
    mainWindow.webContents.openDevTools();
    mainWindow.maximize();

    mainWindow.loadURL(
        url.format({
            pathname: path.join(__dirname, './index.html'),
            protocol: 'file:',
            slashes: true,
        }),
    );

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

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
