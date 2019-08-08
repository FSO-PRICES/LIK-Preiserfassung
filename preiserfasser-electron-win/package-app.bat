robocopy ..\preiserfasser-tablet\platforms\browser\www .\ionic-browser-app /mir
rmdir /S /Q c:\temp\build\bfs-lik-preiserfasser-win-win32-ia32
node_modules\.bin\electron-packager . --tmpdir=c:\temp --out=c:\temp\build --platform=win32 --arch=ia32 --no-prune --appname=bfs-lik-preiserfasser.exe --app-copyright="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --win32metadata.CompanyName="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --win32metadata.ProductName="BFS LIK Preiserfasser" --win32metadata.FileDescription="BFS LIK Preiserfasser"
