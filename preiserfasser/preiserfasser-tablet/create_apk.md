# Create a production APK

## Build code

If not already done: `./node_modules/.bin/ionic cordova platforms add android`  
`./node_modules/.bin/ionic cordova build --prod --release android`

## Install SDK Tools (Ubuntu)

1.  `wget https://dl.google.com/android/repository/tools_r25.2.3-linux.zip`
2.  `mkdir -p Android/sdk`
3.  `unzip tools_r25.2.3-linux.zip -d Android/sdk/`
4.  `Android/sdk/tools/bin/sdkmanager "platform-tools" "platforms;android-25" "build-tools;25.0.3" "tools"`

## Sign APK

### Generate Key

`"%JAVA_HOME%\bin\keytool" -genkey -v -keystore bfs_apk_release_key.keystore -alias "Preiserfassung LIK" -keyalg RSA -keysize 2048 -validity 10000 -dname "CN=bfs, OU=Development, O=Lambda IT, L=Bern-Liebefeld, ST=Bern, C=CH"`

### Use Key to sign

`"%JAVA_HOME%\bin\jarsigner" -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore my-release-key.keystore android-armv7-release-unsigned.apk "Preiserfassung LIK"`  
`"%LOCALAPPDATA%\Android\sdk\build-tools\23.0.3\zipalign" -v 4 android-armv7-release-unsigned.apk android-armv7-release.apk`
