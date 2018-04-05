if [ -z "$1" ]; then
    (>&2 echo "No temp path given")
    exit 1;
fi

if [ -z "$2" ]; then
    (>&2 echo "No build path given")
    exit 1;
fi

echo "'$1' '$2'";

rsync -a --delete ../preiserfasser-tablet/platforms/browser/www/ ./ionic-browser-app
rm -rf $2/build/electron/bfs-lik-preiserfasser-win-linux-x64
rm -rf $2/build/electron/bfs-lik-preiserfasser-win-win32-ia32
./node_modules/.bin/electron-packager . --tmpdir=$1/electron/ --out=$2/build/electron --platform=linux --arch=x64 --no-prune --appname=bfs-lik-preiserfasser --app-copyright="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --name="BFS LIK Preiserfasser"
./node_modules/.bin/electron-packager . --tmpdir=$1/electron/ --out=$2/build/electron --platform=win32 --arch=ia32 --no-prune --appname=bfs-lik-preiserfasser.exe --app-copyright="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --win32metadata.CompanyName="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --win32metadata.ProductName="BFS LIK Preiserfasser" --win32metadata.FileDescription="BFS LIK Preiserfasser"
