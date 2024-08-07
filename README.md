# BFS/Lik - Studio

Node Version: 20.5.0

### App Setup

1. Clone Git Repo
2. `git fetch`
3. `npm ci`
4. `npm install --global nx@latest`
5. Check if the apps are running
   `nx serve backoffice`
   `nx serve preiserfasser`

### Capacitor Setup

1. `cd apps/preiserfasser`
   `npm ci` (didn't work for me, had to use npm i)
2. Add Android platform to the project
   `nx run preiserfasser:add:android`
   Yes when asked if @capacitor/cli@5.0.3 should be installed
3. Is there an Android folder in apps/preiserfasser? Yes? Good.
4. `nx run preiserfasser:generate-capacitor-assets`
5. `nx build preiserfasser`
6. `nx run preiserfasser:sync:android --preserveProjectNodeModules`

### Java Installation

1. go to https://www.oracle.com/java/technologies/downloads/#jdk17-windows and install the msi-installer for windows
2. Run `java -version` to make shure Java JDK is installed

### Android Command Line Tools

1. Install the android command line tools and platform-tools
   next steps are from here: https://proandroiddev.com/how-to-setup-android-sdk-without-android-studio-6d60d0f2812a
2. download the Command line tools only from https://developer.android.com/studio
3. create a folder structure in your programm-root like this: android/cmdline-tools/tools and unzip all into this folder. f.e. c:\programms\android... or somewhere else
4. add an env-variable to windows `ANDROID_HOME=the path to the android folder you just created` (not cmdline-tools)
5. add this to the path variable:
   `%ANDROID_HOME%\cmdline-tools\tools\bin`
   and
   `%ANDROID_HOME%\plattform-tools` (maybe not necessary)
6. open a new terminal and type sdkmanager, if you see something its good
7. then: `sdkmanager --install "platform-tools"`
   `sdkmanager --install "build-tools;28.0.3"`

### Debug APK

1. cd into the lik studio project, then `nx run preiserfasser:sync:android --preserveProjectNodeModules`
2. `nx run preiserfasser:capacitor-debug-apk`
3. it downloads missing android-sdk stuff and when it works you have an unsigned apk in apps/preiserfasser/android/app/build/output/apk/debug

### SIGNED APK

4. copy the keystore file into the root of the project
5. copy the .env file with the KEYSTORE_PW into apps/preiserfasser
6. add `%ANDROID_HOME%\build-tools\28.0.3` to the path env-variable
7. run `nx run preiserfasser:capacitor-sign-apk` and cross your fingers...

### IMPORTANT WHEN EVERYTHING IS RUNNING

If using [`Directory.Documents`](https://capacitorjs.com/docs/apis/filesystem#directory) or [`Directory.ExternalStorage`](https://capacitorjs.com/docs/apis/filesystem#directory), in Android 10 and older, this API requires the following permissions be added to your `AndroidManifest.xml`:

Yes, we are using this in the app, so we need to add this to the AndroidManifest.xml in the `apps/preiserfasser/android/app/src/main` folder

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/><uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```
