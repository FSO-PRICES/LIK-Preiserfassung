import gulp from 'gulp';
import zip from 'gulp-zip';
import { readFileSync } from 'fs';

const fs = require('fs');

const config = JSON.parse(readFileSync('../package.json', 'utf8'));
const version = `v${config.version}`;

const projects = [
    {
        name: 'zip-electron-bo-windows-demoscope',
        path: '../dist/apps/backoffice-electron-demoscope-win/LIK-PreisAdmin-win32-x64/',
        file: `bfs-lik-backoffice-win-win32-x64.DEMOSCOPE.${version}.zip`,
    },
    {
        name: 'zip-electron-bo-windows-bfs',
        path: '../dist/apps/backoffice-electron-bfs-win/LIK-PreisAdmin-win32-x64/',
        file: `bfs-lik-backoffice-win-win32-x64.BFS.${version}.zip`,
    },
    {
        name: 'zip-electron-bo-linux-demoscope',
        path: '../dist/apps/backoffice-electron-demoscope-linux/LIK-PreisAdmin-linux-x64/',
        file: `bfs-lik-backoffice-linux-x64.DEMOSCOPE.${version}.zip`,
    },
    {
        name: 'zip-electron-bo-linux-bfs',
        path: '../dist/apps/backoffice-electron-bfs-linux/LIK-PreisAdmin-linux-x64/',
        file: `bfs-lik-backoffice-linux-x64.BFS.${version}.zip`,
    },
    {
        name: 'zip-electron-pe-windows-demoscope',
        path: '../dist/apps/preiserfasser-electron-demoscope-win/LIK-Preiserfasser-win32-x64/',
        file: `bfs-lik-preiserfasser-win-win32-x64.DEMOSCOPE.${version}.zip`,
    },
    {
        name: 'zip-electron-pe-windows-bfs',
        path: '../dist/apps/preiserfasser-electron-bfs-win/LIK-Preiserfasser-win32-x64/',
        file: `bfs-lik-preiserfasser-win-win32-x64.BFS.${version}.zip`,
    },
    {
        name: 'zip-electron-pe-linux-demoscope',
        path: '../dist/apps/preiserfasser-electron-demoscope-linux/LIK-Preiserfasser-linux-x64/',
        file: `bfs-lik-preiserfasser-linux-x64.DEMOSCOPE.${version}.zip`,
    },
    {
        name: 'zip-electron-pe-linux-bfs',
        path: '../dist/apps/preiserfasser-electron-bfs-linux/LIK-Preiserfasser-linux-x64/',
        file: `bfs-lik-preiserfasser-linux-x64.BFS.${version}.zip`,
    },
];

projects.forEach((proj) => {
    gulp.task(proj.name, () =>
        gulp
            .src(`${proj.path}**/*`, { base: proj.path, dot: true })
            .pipe(zip(proj.file))
            .pipe(gulp.dest(`../dist/final-output/`)),
    );
});

gulp.task('default', gulp.parallel(projects.map((p) => p.name)));
