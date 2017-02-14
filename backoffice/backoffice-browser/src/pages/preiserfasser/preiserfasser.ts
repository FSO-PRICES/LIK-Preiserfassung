import { Erheber } from '../../../../../common/models';
import { Component, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import * as bluebird from 'bluebird';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { Observable, ReplaySubject } from 'rxjs';
import * as _ from 'lodash';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    templateUrl: 'preiserfasser.html'
})
export class PreiserfasserPage {
    private couch: PouchDB.Database<Erheber>
    public preiserheberDetail = <Erheber>{};

    public preiserheberList$: Observable<Erheber[]>;

    public preiserheberListRefresh$ = new ReplaySubject<Observable<Erheber>>();
    public preiserheberSaveClicked$ = new EventEmitter<Event>();
    public preiserheberEditClicked$ = new EventEmitter<Erheber>();

    constructor(private http: Http) {
        const username = 'lik-admin';
        const password = 'FwtjYWZW4T2PNWOt4cx3';

        this.couch = new PouchDB('http://localhost:5984/preiserheber');
        const login = bluebird.promisify((this.couch as any).login, { context: this.couch }) as Function;

        const login$ = Observable.fromPromise(login(username, password))
            .publishReplay(1).refCount();

        this.preiserheberList$ = this.preiserheberListRefresh$
            .flatMap(x => x)
            .map<Erheber[]>(x => {
                const list = <Erheber[]>x.rows.filter(pe => pe != null).map(pe => pe.doc)
                if (this.isEditing()) this.preiserheberDetail = _.first(list.filter(x => x._id == this.preiserheberDetail._id))
                return list;
            });

        this.preiserheberSaveClicked$
            .flatMap(_ => Observable.fromPromise(
                this.couch.put(this.createPreiserheberDocument(this.preiserheberDetail))
                    .then(x => x)
                    .catch(_ => Observable.of(null))
            ))
            .subscribe(x => {
                this.reloadList();
            });
        
        this.preiserheberEditClicked$
            .do(x => console.log("clicked", x))
            .subscribe(erheber => this.preiserheberDetail = erheber);

        this.reloadList();
    }

    public reloadList() {
        this.preiserheberListRefresh$.next(
            Observable.fromPromise<Erheber>(
                this.couch.allDocs({ startkey: "erheber:", endkey: "erheber:\uffff", include_docs: true }).then().catch(_ => Observable.of([]))
            )
        );
    }

    public isEditing() {
        return !!this.preiserheberDetail && !!this.preiserheberDetail._id;
    }

    private createPreiserheberDocument(erheber: Erheber) {
        return Object.assign({}, this.preiserheberDetail, { _id: erheber._id || `erheber:${erheber.firstName}_${erheber.surname}` });
    }

    private getPreiserheberList(couch: PouchDB.Database<{}>) {
        return 
    }
}
