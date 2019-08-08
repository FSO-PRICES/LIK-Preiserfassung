const path = require('path')
var electronInstaller = require('electron-winstaller');
resultPromise = electronInstaller.createWindowsInstaller({
    appDirectory: 'C:\temp\build\bfs-lik-preiserfasser-win-win32-x64',
    outputDirectory: 'c:\temp\build\bfs-lik-preiserfasser-win-installer',
    authors: 'Lambda IT GmbH',
    exe: 'bfs-lik-preiserfasser-install.exe'
});
resultPromise.then(() => console.log("It worked!"), (e) => console.log(`No dice: ${e.message}`));
