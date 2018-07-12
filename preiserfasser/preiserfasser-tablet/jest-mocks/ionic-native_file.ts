export class File {
    externalRootDirectory: false;
    writeFile() {
        return Promise.resolve('ok');
    }
}
