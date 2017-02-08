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

declare var window: Window & { File: any, FileReader: any, FileList: any };

type UserStatus = { user: string; exists: boolean };
        
@Component({
    templateUrl: 'initialization.html'
})
export class InitializationPage {
    public credentials: {username: string, password: string};
    public canHandleFileApi = true;
    public fileLoaded = false;
    private pmsToPeMap: PmsToPeMap;

    public usersStatuses$: Observable<UserStatus[]>;
    public createUsersClicked$ = new EventEmitter();

    constructor(private http: Http) {
        this.credentials = <any>{};
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            // Great success! All the File APIs are supported.
        }
        else {
            console.error("File API is not supported");
            this.canHandleFileApi = false;
        }

        const username = 'lik-admin';
        const password = 'FwtjYWZW4T2PNWOt4cx3';

        const couch = new PouchDB('http://localhost:5984/_users');
        const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

        const users = [
            'philipp',
            'wayne',
            'edi',
            'roger'
        ];


        const login$ = Observable.fromPromise(login(username, password))
            .publishReplay(1).refCount();
        
        this.usersStatuses$ = login$
            .flatMap<string>(() => Observable.from(users))
            .map<Observable<UserStatus>>(user => Observable.fromPromise(couch.get(`org.couchdb.user:${user}`)).map(_ => ({ user, exists: true })).catch(() => Observable.of({ user, exists: false })))
            .combineAll<UserStatus[]>()
            .publishReplay(1).refCount();
        
        const fff = this.createUsersClicked$
            .combineLatest(this.usersStatuses$, (_, usersStatuses: UserStatus[]) => usersStatuses)
            .map(x => x.filter(u => !u.exists).map(u => u.user))
            .do(x => console.log('will create', x))
            .map(users => users.map(user => Observable.fromPromise(couch.put({
                _id: `org.couchdb.user:${user}`,
                name: user,
                roles: [],
                type: 'user',
                password: 'secret'
            }))))
            // .flatMap(x => x)
            // .subscribe(() => console.log('done'));
        
            // var xxx1 = Observable.from(users)
            //     .map<Observable<UserStatus>>(user => Observable.fromPromise(couch.get(`org.couchdb.user:${user}`)).map(_ => ({ user, exists: true })).catch(() => Observable.of({ user, exists: false })))
            //     // .flatMap(x => x)
            //     // .filter(res => res.exists)
            //     .combineAll<UserStatus[]>()


        // login(username, password).then(x => console.log(x))
        

        // const login$ = Observable.fromPromise(login(username, password));

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

    fileSelected(evt: Event) {
        var files = (<HTMLInputElement>evt.target).files;
        var _this = this;

        for (var i = 0, file: File; file = files[i]; i++) {

            // // Only process csv files.
            if (!file.name.match('.*\.csv')) {
                continue;
            }

            var reader = new FileReader();

            // Closure to capture the file information.
            reader.onload = ((theFile) => (e) => {
                var data = _this.parseFile(e.target.result);
                _this.pmsToPeMap = _this.createMap(data);
            })(file);

            reader.readAsText(file, 'ISO-8859-1');
        }
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

    //     bluebird.all(
    //         users.map(x => this.http.post(url,
    //             method: 'POST',
    //             json: {
    //                 _id: `org.couchdb.user:${x}`,
    //                 name: x,
    //                 roles: [],
    //                 type: 'user',
    //                 password: 'secret'
    //             }
    //         })))
    //         .then(() => console.log('done!'));
    }

    foobar() {
        const username = 'lik-admin';
        const password = 'FwtjYWZW4T2PNWOt4cx3';

        const couch = new PouchDB('http://localhost:5984/_users');
        const login = bluebird.promisify<string, string, any>((couch as any).login, { context: couch });

        const users = [
            'philipp',
            'wayne',
            'edi',
            'roger'
        ];

        login(username, password).then(() => {
            var xxx1 = Observable.from(users)
                .map<Observable<UserStatus>>(user => Observable.fromPromise(couch.get(`org.couchdb.user:${user}`)).map(_ => ({ user, exists: true })).catch(() => Observable.of({ user, exists: false })))
                // .flatMap(x => x)
                // .filter(res => res.exists)
                .combineAll<UserStatus[]>()
                // .map(x => x.filter(y => !y.exists).map(y => y.user));
            
            xxx1.subscribe(x => console.log('results', x))
            
        //     var www = Observable.merge(users.map(user => couch.get(`org.couchdb.user:${user}`)));
        //     var xxxy = Observable.from(users.map(user => Observable.fromPromise(couch.get(`org.couchdb.user:${user}`)))).mergeAll()

        //     var xxx = Observable.of(users)
        //         .map(_users => {
        //             return Observable.from(_users.map(user => Observable.fromPromise(couch.get(`org.couchdb.user:${user}`))))
        //         })
        //         .flatMap(x => x)
        //         .subscribe(x => console.log('x is', x))
        })
            // .then(x => console.log(x));


        // const url = `http://${username}:${password}@localhost:5984/_users`;


        // const usersToCreate = Observable.from(users)
        //     .map(x => `org.couchdb.user%3A${x}`)
        //     .flatMap(x => this.http.get(`${url}/${x}`))
        //     .subscribe(x => console.log(x));


        // Observable.from(users)
        //     .flatMap(x =>
        //         this.http.post(url, {
        //             _id: `org.couchdb.user:${x}`,
        //             name: x,
        //             roles: [],
        //             type: 'user',
        //             password: 'secret'
        //         })
        //     )
            // .subscribe();

        // foo.
            // .subscribe(x => console.log('is', x));
    }

}
