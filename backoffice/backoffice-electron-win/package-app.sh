if [ -z "$1" ]; then
    (>&2 echo "No temp path given")
    exit 1;
fi

if [ -z "$2" ]; then
    (>&2 echo "No build path given")
    exit 1;
fi

echo "'$1' '$2'";

rsync -a --delete ../backoffice-browser/platforms/browser/www/ ./ionic-browser-app
rm -rf $2/build/electron/bfs-lik-backoffice-win-linux-x64
./node_modules/.bin/electron-packager . --tmpdir=$1/electron/ --out=$2/build/electron --platform=linux --arch=x64 --no-prune --appname=bfs-lik-backoffice --app-copyright="Schweizerische Eidgenossenschaft Bundesamt fuer Statistik" --name="BFS LIK Backoffice"
