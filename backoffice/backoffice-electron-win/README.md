# backoffice-electron-win

This folder is for packaging the BFS LIK Backoffice App as an Electron app.

## Background

The source code for the app is under `..\backoffice-browser`. This is then 'built' using the Ionic CLI using:
```
    ionic build browser
```

This creates a folder called `..\backoffice-browser\platforms\browser\www`, which contains all the minimised JS, CSS, assets, etc.
This folder could then be deployed to a web server, but we want to package it as an Electron app, hence this project.

## Packaging the Electron app

To package the Electron app, run the command `npm run package-app`. This copies `..\backoffice-browser\platforms\browser\www` to
`.\ionic-browser-app` and then runs `electron-packager` which creates a package in folder `c:\temp\bfs-lik-backoffice-win-win32-x64\`.

This folder contains everything to run the Electron app, and the executable is `bfs-lik-backoffice-win.exe`.

SETUP.exe process not yet finished!
