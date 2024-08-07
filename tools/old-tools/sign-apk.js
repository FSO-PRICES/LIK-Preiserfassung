const fs = require('fs');
const join = require('path').join;
const gulp = require('gulp');
const zip = require('gulp-zip');
const exec = require('child_process').exec;
const readlineSync = require('readline-sync');

const config = JSON.parse(fs.readFileSync('../package.json'));
const version = `v${config.version}`;

const apkPath = '../apps/preiserfasser/platforms/android/app/build/outputs/apk/release/';
const apkUnsigned = join(apkPath, 'app-release-unsigned.apk');
const apkAligned = join(apkPath, 'app-release-unsigned-aligned.apk');
const apkSigned = join(apkPath, 'preiserfasser-release.apk');
const apkZipped = `preiserfasser-release-${version}.zip`;
const pw = readlineSync.question('Enter the password for the keyfile: ', { hideEchoBack: true });
const latestBuild = fs.readdirSync(`${process.env.ANDROID_SDK_ROOT}/build-tools/`).sort().reverse()[0];

gulp.task('zip-align', function (cb) {
    exec(
        `${process.env.ANDROID_SDK_ROOT}/build-tools/${latestBuild}/zipalign -f -v 4 ${apkUnsigned} ${apkAligned}`,
        function (err, stdout, stderr) {
            console.log(stdout);
            if (stderr) {
                console.error(stderr);
            }
            cb(err);
        },
    );
});

gulp.task('sign', function (cb) {
    exec(
        `${process.env.ANDROID_SDK_ROOT}/build-tools/${latestBuild}/apksigner sign --ks ../key/bfs_apk_release_key.keystore --ks-pass pass:${pw} --ks-key-alias "preiserfassung lik" --out ${apkSigned} ${apkAligned}`,
        function (err, stdout, stderr) {
            console.log(stdout);
            if (stderr) {
                console.error('ERROR', stderr);
            }
            cb(err);
        },
    );
});

gulp.task('zip-apk', () => gulp.src(apkSigned, { base: apkPath }).pipe(zip(apkZipped)).pipe(gulp.dest('../dist')));

gulp.task('default', gulp.series('zip-align', 'sign', 'zip-apk'));
