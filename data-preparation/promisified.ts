import * as fs from 'fs';
import * as bluebird from 'bluebird';

export interface ReadFileSignature {
    (filename: string): bluebird<Buffer>;
    (filename: string, encoding: string): bluebird<string>;
    (filename: string, options: { encoding: string; flag?: string; }): bluebird<string>;
    (filename: string, options: { flag?: string; }): bluebird<Buffer>;
}

export interface WriteFileSignature {
    (filename: string, data: any): bluebird<{}>;
    (filename: string, data: any, options: { encoding?: string; mode?: number; flag?: string; }): bluebird<{}>;
    (filename: string, data: any, options: { encoding?: string; mode?: string; flag?: string; }): bluebird<{}>;
}

export interface ReaddirSignature {
    (path: string | Buffer): bluebird<string[]>;
}

export const readFile = <ReadFileSignature>bluebird.promisify(fs.readFile);
export const writeFile = <WriteFileSignature>bluebird.promisify(fs.writeFile);
export const readdir = <ReaddirSignature>bluebird.promisify(fs.readdir);
