# preiserfasser-electron-win

This folder is for packaging the BFS LIK Preiserfasser App as an Electron app.

## Background

The source code for the app is under `..\preiserfasser-tablet`. This is then 'built' using the Ionic CLI using:
```
    ionic build browser
```

This creates a folder called `..\preiserfasser-tablet\platforms\browser\www`, which contains all the minimised JS, CSS, assets, etc.
This folder could then be deployed to a web server, but we want to package it as an Electron app, hence this project.

## Packaging the Electron app

To package the Electron app, run the command `npm run package-app`. This copies `..\preiserfasser-tablet\platforms\browser\www` to
`.\ionic-browser-app` and then runs `electron-packager` which creates a package in folder `c:\temp\bfs-lik-preiserfasser-win-win32-x64\`.

This folder contains everything to run the Electron app, and the executable is `bfs-lik-preiserfasser-win.exe`.

SETUP.exe process not yet finished!

~~The `c:\temp\bfs-lik-preiserfasser-win-win32-x64\` folder could be zipped and sent to users, but we want to create an installer for them ...~~

## ~~Creating the installer~~

~~The installer includes an auto-update mechanism using `electron-winstaller`. Releases and updates are hosted on github repo `lambda-it\lik-studio`.~~



