const gulp = require('gulp');
const zip = require('gulp-zip');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./package.json'));
const version = `v${config.version}`;
const basePath = (app, platform) => `apps/${app}/platforms/electron/build/${platform}/`;
const projects = [
    {
        name: 'zip-electron-pe-linux',
        path: basePath('preiserfasser', 'linux-unpacked'),
        file: `bfs-lik-preiserfasser-linux-x64.${version}.zip`,
    },
    {
        name: 'zip-electron-pe-windows',
        path: basePath('preiserfasser', 'win-ia32-unpacked'),
        file: `bfs-lik-preiserfasser-win-win32-ia32.${version}.zip`,
    },
    {
        name: 'zip-electron-bo-linux',
        path: basePath('backoffice', 'linux-unpacked'),
        file: `bfs-lik-backoffice-linux-x64.${version}.zip`,
    },
    {
        name: 'zip-electron-bo-windows',
        path: basePath('backoffice', 'win-ia32-unpacked'),
        file: `bfs-lik-backoffice-win-win32-ia32.${version}.zip`,
    },
];

projects.forEach(proj => {
    gulp.task(proj.name, () =>
        gulp
            .src(`${proj.path}**/*`, { base: proj.path, dot: true })
            .pipe(zip(proj.file))
            .pipe(gulp.dest(`./dist/`)),
    );
});

gulp.task('default', gulp.parallel(projects.map(p => p.name)));
