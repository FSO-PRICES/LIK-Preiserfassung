import { readFileSync, renameSync } from 'fs';
import { join } from 'path';
import gulp from 'gulp';
import zip from 'gulp-zip';

//if its for BFS we have a different build with a ssl-skip plugin and we want to name file differently
const companyArg = process.argv.indexOf('--company');
const company = companyArg > -1 ? process.argv[companyArg + 1].toUpperCase() : undefined;
if (!company) {
    throw new Error('Company name is required');
}

const config = JSON.parse(readFileSync('../package.json', 'utf8'));
const version = `v${config.version}`;

const apkPath = '../apps/preiserfasser/android/app/build/outputs/apk/release/';
const newFile = join(apkPath, `preiserfasser-${company}-${version}.apk`);
renameSync(join(apkPath, 'preiserfasser-release.apk'), newFile);
const apkZipped = `preiserfasser-apk-${company}-${version}.zip`;

gulp.task('zip-apk', () =>
    gulp.src(newFile, { base: apkPath }).pipe(zip(apkZipped)).pipe(gulp.dest('../dist/final-output/')),
);

gulp.task('default', gulp.series('zip-apk'));
