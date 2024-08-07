# Build Debug Apk in Docker Container

## 1. Build the project and the debug-apk

This image then contains the builded project and all the dependencies needed to build the debug apk.

```powershell
# From the root of the project
docker build -t debug-apk -f build-apk-in-container/Dockerfile.build-debug-apk .
```

Then wait. It takes some time.

## 2. Run the container to output the debug-apk

In this step you need to mount the output directory to the container so that the apk can be copied to the host machine: \
`-v <host-folder>:<container-folder>`

> `${pwd}` is a windows-specific command to get the current directory.

```powershell
# From the root of the project
docker run --rm -v ${pwd}/build-apk-in-container/apk-output:/apk-output debug-apk
```

The apk then will be available in the `build-apk-in-container/apk-output` folder (or whatever folder you mounted to the container).

# Build SIGNED Apk in Docker Container

Its almost the same

## 1. Make shure the keystore file is in the root of the project

The name of the keystore file should be `bfs_apk_release_key.keystore`

## 2. Build the project and sign the apk

```powershell
# From the root of the project
docker build -t signed-apk --build-arg PASSWORD=THE_PASSWORD_FOR_THE_KEYSTORE_FILE -f build-apk-in-container/Dockerfile.build-signed-apk .
```

Then wait. It takes some time.

## 2. Run the container to output the signed apk

```powershell
# From the root of the project
docker run --rm -v ${pwd}/build-apk-in-container/apk-output:/apk-output signed-apk
```

The apk then will be available in the `build-apk-in-container/apk-output` folder (or whatever folder you mounted to the container).

```

```
