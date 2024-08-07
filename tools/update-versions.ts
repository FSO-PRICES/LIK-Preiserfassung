// This script takes the version and the apkVerionsCode from the package.json and updates:
// - the versionCode and versionName in the android/app/build.gradle of the preiserfasser project (capacitor android)
// - the version in the environment files of both projects

import { readFileSync } from 'fs';
import gulp from 'gulp';
import replace from 'gulp-replace';

const config = JSON.parse(readFileSync('../package.json', 'utf8'));
const apps = ['backoffice', 'preiserfasser'];

function updateApkVersionCodeAndVersionName() {
    console.log(`Updating versionCode and versionName to ${config.lik_apk_version} and ${config.version}`);
    return (
        gulp
            .src(['../apps/preiserfasser/android/app/build.gradle'], { base: './' })
            .pipe(replace(/(versionCode\s)(\d+)/, `$1${config.lik_apk_version}`))
            // .pipe(replace(/(versionName\s")([\d\.]+)"/, `$1${config.version}"`))
            .pipe(replace(/(versionName\s")(.*?)"/, `$1${config.version}"`))
            .pipe(gulp.dest('./'))
    );
}

const environmentFiles = apps.reduce<string[]>(
    (acc, app) => [
        ...acc,
        ...[`../apps/${app}/src/environments/environment.ts`, `../apps/${app}/src/environments/environment.prod.ts`],
    ],
    [],
);

function updateEnvironementVersions() {
    return gulp
        .src(environmentFiles, { base: './' })
        .pipe(replace(/(version: ')[^']+/g, `$1${config.version}`))
        .pipe(gulp.dest('./'));
}

function updatePreiserfasserPackageVersion() {
    return gulp
        .src(['../apps/preiserfasser/package.json'], { base: './' })
        .pipe(replace(/("version":\s)"[^"]+"/, `$1"${config.version}"`))
        .pipe(gulp.dest('./'));
}

exports.default = gulp.series(
    updateApkVersionCodeAndVersionName,
    updateEnvironementVersions,
    updatePreiserfasserPackageVersion,
);
