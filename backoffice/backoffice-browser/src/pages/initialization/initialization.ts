import { createPmsToPeMap, preparePms } from "../../common/presta-data-mapper"
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

        const users = [
            'philipp',
            'wayne',
            'edi',
            'roger',
            'foobar',
            'barfoo',
            'a',
            'b',
            'c',
            'd',
            'e',
            'f',
            'g',
            'h',
            'i',
            'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'y', 'x', 'z', 'aa', 'ab', 'ac'
        ];

        const login$ = Observable.fromPromise(login(username, password))
            .publishReplay(1).refCount();

        const usersStatuses$ = Observable.from(users)
            .map<Observable<UserStatus>>(user => Observable.fromPromise(couch.get(`org.couchdb.user:${user}`)).map(_ => ({ user, exists: true })).catch(() => Observable.of({ user, exists: false })))
            .combineAll<UserStatus[]>();

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

        const parsedFile$ = this.fileSelected$
            .map(event => (<HTMLInputElement>event.target).files.item(0))
            .flatMap<string>(file => this.readFileContents(file))
            .map(x => this.parseFile(x));

        parsedFile$.subscribe();
    }

    createDb() {
        var erheberList = this.erheberList();
        if (!this.erheberList()) return;
        this.createCouchDbInstances(_.map(erheberList, e => `${e.firstName}_${e.surname}`), this.credentials.username, this.credentials.password)
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

    private createCouchDbInstances(users: string[], username: string, password: string) {
        const url = `http://${username}:${password}@localhost:5984/_users`;
    }
}
