const gulp = require('gulp');
const zip = require('gulp-zip');
const git = require('gulp-git');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../package.json'));
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
gulp.task('update-tags', done => {
    git.exec({ args: 'fetch --tags' }, err => {
        if (err) throw err;
        done();
    });
});
gulp.task('check-if-need-to-raise-version', done => {
    git.exec({ args: 'describe --abbrev=0 --tags' }, (err, response) => {
        const latestTag = response.trim();
        if (err) throw err;
        if (latestTag === version) {
            console.warn('#################################################');
            console.warn(`Latest tag is same as current version: ${latestTag}`);
            console.warn('Should this probably be updated?');
            console.warn('#################################################');
        }
        done();
    });
});

gulp.task(
    'default',
    gulp.series(['update-tags', 'check-if-need-to-raise-version', gulp.parallel(projects.map(p => p.name))]),
);
