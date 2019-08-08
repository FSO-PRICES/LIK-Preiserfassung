robocopy ..\backoffice-browser\platforms\browser\www .\ionic-browser-app /mir
rmdir /S /Q c:\temp\build\bfs-lik-backoffice-win-win32-ia32
node_modules\.bin\electron-packager . --tmpdir=c:\temp --out=c:\temp\build --platform=win32 --arch=ia32 --no-prune --appname=bfs-lik-preiserfasser.exe --app-copyright="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --win32metadata.CompanyName="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --win32metadata.ProductName="BFS LIK Backoffice" --win32metadata.FileDescription="BFS LIK Backoffice"
