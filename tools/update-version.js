const gulp = require('gulp');
const replace = require('gulp-replace');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync('../package.json'));
const apps = ['backoffice', 'preiserfasser'];
const projects = [
    [`config-main-version`, apps.map(app => `apps/${app}/config.xml`), /(version=")[^"]+/, config.version],
    [`config-apk-version`, ['apps/preiserfasser/config.xml'], /(android-versionCode=")[^"]+/, config.lik_apk_version],
    [
        `environment`,
        apps.reduce(
            (acc, app) => [
                ...acc,
                ...[`apps/${app}/src/environments/environment.ts`, `apps/${app}/src/environments/environment.prod.ts`],
            ],
            [],
        ),
        /(version: ')[^']+/,
        config.version,
    ],
];
console.log(projects);

projects.forEach(([proj, files, regex, value]) => {
    gulp.task(proj, () =>
        gulp
            .src(files, { base: './' })
            .pipe(replace(regex, `$1${value}`))
            .pipe(gulp.dest(`./`)),
    );
});

gulp.task('default', gulp.series(projects.map(([name]) => name)));
