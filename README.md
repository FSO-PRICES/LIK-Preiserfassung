# BFS/Lik - Studio

## Install (Ubuntu 16.04)

Passwords and user information are saved in the KeePass **LIK-BFS** group.

-   NodeJs:

    1. any-user> curl -sL https://deb.nodesource.com/setup\_6.x -o nodesource_setup.sh
    2. root> bash nodesource_setup.sh
    3. root> apt-get install nodejs
    4. root> apt-get install build-essential

-   CouchDb

    1. root> apt-get update
    2. root> apt-get upgrade
    3. root> apt-get install software-properties-common # Probably already installed
    4. root> apt-get update
    5. root> apt-get install couchdb
    6. root> chown -R couchdb:couchdb /usr/bin/couchdb /etc/couchdb /usr/share/couchdb
    7. root> chmod -R 0770 /usr/bin/couchdb /etc/couchdb /usr/share/couchdb
    8. root> systemctl restart couchdb
    9. Modify bind address
    10. Add cors

-   NPM http-server

    1. root> npm install -g http-server
    2. root> mkdir /srv/www
    3. root> adduser npm-http-server
    4. root> chown -R npm-http-server:npm-http-server /srv/www
    5. root> chmod 755 /srv/www
    6. [optional] root> iptables -t nat -I PREROUTING -p tcp --dport 80 -j REDIRECT --to-port 8080 # To use the default port.
    7. Add [http-server service](install/lik-http.service) to `/etc/systemd/system/lik-http.service`
    8. root> systemctl enable lik-http.service
    9. root> systemctl start lik-http.service
    10. root> systemctl status lik-http.service

After everything has been installed and configured:

1. Secure the couchdb admin interface **futon** `http://13.94.141.213:5984/_utils/index.html` using the `Fix this` link on the bottom right.

## CouchDb 2.1 Upgrade

To upgrade CouchDb 1.6 to CouchDb 2.1, the following steps are needed:

1. Plan and communicate the offline time span
2. Backup the `var/`, `etc/local.ini` an d `etc/local.d/*.ini` directories from the CouchDb installation folder
3. Shut down the CochDb service
4. [Upgrade of CouchDb to 2.1.](#install-new-couchdb)
5. Start CouchDb 2.1
6. Migration of the databases
    - In case that the new Version of CouchDb is in a new directly, the old `*.couch` files found at the directory `var/lib/couchdb` of the previous version need to be copiet to the `data/` directory.
    - There are two methods for the migration:
        - Manually: http://docs.couchdb.org/en/master/install/upgrading.html#manual-couchdb-1-x-migration
        - Tool: Using the `couchup` command, located at `CouchDB/bin/`. [Explained here](#couchup-db-upgrade). This tool has a python and `Request` python library dependecy.

### Install new CouchDb

**Windows**

-   Installer [downloadable here](https://dl.bintray.com/apache/couchdb/win/2.1.1/couchdb-2.1.1.msi) und installieren.

**Linux:**

-   `echo "deb https://apache.bintray.com/couchdb-deb {distribution} main" | sudo tee -a /etc/apt/sources.list`

`{distribution}` should be replaced by the following according to the target system:

-   Debian 8: `jessie`
-   Debian 9: `stretch`
-   Ubuntu 14.04: `trusty`
-   Ubuntu 16.04: `xenial`

-   `sudo apt-get update && sudo apt-get install couchdb=2.1.1-1~{distribution}` - using `apt-cache madison couchdb` helps to identify the correct version.

### couchup DB upgrade

http://docs.couchdb.org/en/master/install/upgrading.html#couchup-utility
`couchup` requires python 2.7 or 3.x and the [`Request`](http://docs.python-requests.org/en/master/user/install/) python library.

-   In case that `pipenv` is not available, `pip install pipenv` should be used
-   `pipenv install requests`

1. At the `bin/` directory of the CouchDb 2.1 installation directory run `./couchup list`
2. Check the displayed list
3. `./couchup replicate -a`
4. Check the Databases in the CouchDB admin panel
5. `./couchup delete -a`
6. Run `./couchup list` again, this time the list should be empty

## Android (SDK, APK build)

1. Install Java SDK: `jdk-8u121`
2. Install Android Studio: `android-studio-bundle-162.3764568`
3. Install spezific Android SDK Tools: `tools_r25.2.3-windows.zip`

-   Replace the contents of the Android Studio tools folder with the specific Android SDK Tools version: for example `%HomePath%\AppData\Local\Android\sdk\tools`

4. Set the PATH and Environment values:

-   `JAVA_HOME`: for example `C:\Program Files\Java\jdk1.8.0_121`
-   `ANDROID_HOME`: for example `%HomePath%\AppData\Local\Android\sdk`

5. Run Android SDK Tools: Cmd + R `%HomePath%\AppData\Local\Android\sdk\tools\android.bat`

-   Install the following packages:
    -   Android SDK Tools
    -   Android SDK Platform-tools
    -   Android 5.1.1 (API 22). (Unconfirmed) Android 5.0.1 (API 21) should work too also the API 23.

## Access

-   http-server: http://13.94.141.213
-   Couchdb: http://13.94.141.213:5984/_utils/index.html

## Management

-   Enable service (unmask seems not to work):
    ```
    systemctl enable lik-http.service
    systemctl start lik-http.service
    ```
-   Disable service (mask seems not to work):

    ```
    systemctl stop lik-http.service
    systemctl disable lik-http.service
    ```

-   Logging
    -   http-server: root> journalctl -f -u lik-http.service
    -   couchdb: root> journalctl -f -u couchdb.service

## Abbreviations:

-   PE: Preiserheber
-   PMS: Preismeldestelle
-   PM: Preismeldung
-   PAG: PreisAbweichungsGruppen
-   TD: Tablet-Device
-   HF: Help files (Die PDF zur Unterstützung der PEs)
