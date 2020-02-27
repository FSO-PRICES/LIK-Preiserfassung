const gulp = require('gulp');
const replace = require('gulp-replace');

const fs = require('fs');

const config = JSON.parse(fs.readFileSync('./package.json'));
const apps = ['backoffice', 'preiserfasser'];
const projects = [
    [`config`, apps.map(app => `apps/${app}/config.xml`), /(version=")[^"]+/],
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
    ],
];
console.log(projects);

projects.forEach(([proj, files, regex]) => {
    gulp.task(proj, () =>
        gulp
            .src(files, { base: './' })
            .pipe(replace(regex, `$1${config.version}`))
            .pipe(gulp.dest(`./`)),
    );
});

gulp.task('default', projects.map(([name]) => name));
