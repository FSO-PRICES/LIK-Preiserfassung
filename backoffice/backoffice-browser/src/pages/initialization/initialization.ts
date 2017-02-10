import { createPmsToPeMap, preparePms } from "../../common/presta-data-mapper"
import { buildTree } from "../../common/presta-warenkorb-mapper"
import { PmsToPeMap, Erheber } from "../../../../../common/models"
import { Component, EventEmitter } from '@angular/core';
import { Http, Response, Headers, RequestOptions } from '@angular/http';
import { Observable } from 'rxjs';
import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';

PouchDB.plugin(pouchDbAuthentication);

type UserStatus = { user: string; exists: boolean };
type Translations = { de?: string, fr?: string, it?: string };

@Component({
    templateUrl: 'initialization.html'
})
export class InitializationPage {
    public credentials: { username: string, password: string };
    public canHandleFileApi = true;
    public fileLoaded = false;
    private pmsToPeMap: PmsToPeMap;

    public usersStatuses$: Observable<UserStatus[]>;
    public createUsersClicked$ = new EventEmitter();

    public fileSelected$ = new EventEmitter<Event>();

    constructor(private http: Http) {
        this.credentials = <any>{};

        const username = 'lik-admin';
        const password = 'FwtjYWZW4T2PNWOt4cx3';

        const couch = new PouchDB('http://localhost:5984/_users');
        const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

        const login$ = Observable.fromPromise(login(username, password))
            .publishReplay(1).refCount();

        const getFilesContentByName = (fileName) => (fileList: FileList) => {
            return _.filter(fileList, f => !!f.name.match(fileName));
        };

        const filterByFileName = <T>(fileSelect$: Observable<FileList>, fileName: string, mapper: (file: File, content: string) => T = (_, content) => content as any) => {
            return fileSelect$
                .map(getFilesContentByName(fileName))
                .filter(x => !!x)
                .flatMap<Observable<T>>(files => files.map(file => this.readFileContents(file).map(x => mapper(file, x))))
                .flatMap<T>(x => x);
        };

        const warenkorbFileMapper = (file, content) => {
            const data = this.parseFile(content);
            const map = { '_DE': { de: data }, '_FR': { fr: data }, '_IT': { it: data } }
            for (let key in map) if (file.name.indexOf(key) !== -1) return map[key];
            return null;
        };

        const selectedFiles$ = this.fileSelected$
            .map(event => (<HTMLInputElement>event.target).files);

        const pmsToPeMap$ = filterByFileName(selectedFiles$, 'PMS und Preiserheber.csv', (_, content) => this.parseFile(content))
            .map(x => this.createMap(x))
            .publishReplay(1).refCount();

        const warenkorb$ = filterByFileName(selectedFiles$, 'Erhebungsschema_(DE|IT|FR).csv', warenkorbFileMapper)
            .scan((accumulator, value) => Object.assign({}, accumulator, value) as Translations, {})
            .skip(2)
            .map(x => this.createWarenkorb(x))
            .do(x => console.log("warenkorb", x))
            .publishReplay(1).refCount().subscribe();

        const usersStatuses$ = pmsToPeMap$
            .flatMap<UserStatus[]>(users => Observable.from(users.map(u => `${u.erheber.firstName}_${u.erheber.surname}e`).map(user => couch.get(`org.couchdb.user:${user}`).then(_ => ({ user, exists: true })).catch(() => ({ user, exists: false })))).combineAll());

        const createUserObject = user => ({
            _id: `org.couchdb.user:${user}`,
            name: user,
            roles: [],
            type: 'user',
            password: 'secret'
        });

        const createUsers$ = this.createUsersClicked$
            .flatMap(() => usersStatuses$)
            .map(x => x.filter(u => !u.exists).map(u => u.user))
            .flatMap<PouchDB.Core.Response[]>(users => Observable.from(users.map(user => couch.put(createUserObject(user)))).combineAll())

        this.usersStatuses$ = login$.merge(createUsers$).flatMap(() => usersStatuses$);
    }

    hasErheberList(): boolean {
        return !!this.pmsToPeMap;
    }

    erheberList(): Erheber[] {
        if (!this.hasErheberList()) return [];
        return _.map(this.pmsToPeMap, map => map.erheber);
    }

    readFileContents(file: File) {
        const reader = new FileReader();
        const text$ = Observable.fromEvent<ProgressEvent>(reader, 'load')
            .map(x => (x.target as FileReader).result as string);
        reader.readAsText(file, 'ISO-8859-1');
        return text$;
    }

    private parseFile(data: string): string[][] {
        const lines = data.split('\u000a');
        return _.drop(lines.filter(x => x.length)).map(x => x.split(';'));
    }

    private createMap(content: string[][]): PmsToPeMap {
        return createPmsToPeMap(content);
    }

    private createWarenkorb(translations: { de: string[][], fr: string[][], it: string[][] }) {
        return buildTree(translations);
    }
}
