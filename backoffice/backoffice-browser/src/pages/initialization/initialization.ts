import { buildTree } from '../../common/presta-warenkorb-mapper';
import { Component, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    templateUrl: 'initialization.html'
})
export class InitializationPage {
    public credentials: { username: string, password: string };

    public warenkorbIsCompleted$: Observable<boolean>;

    public warenkorbSelectedDe$ = new EventEmitter<Event>();
    public warenkorbSelectedFr$ = new EventEmitter<Event>();
    public warenkorbSelectedIt$ = new EventEmitter<Event>();

    public createWarenkorbClicked$ = new EventEmitter();

    constructor(private http: Http) {
        this.credentials = <any>{};

        const username = 'lik-admin';
        const password = 'FwtjYWZW4T2PNWOt4cx3';

        const couch = new PouchDB('http://localhost:5984/warenkorb');
        const login = bluebird.promisify((couch as any).login, { context: couch }) as Function;

        const login$ = Observable.fromPromise(login(username, password))
            .publishReplay(1).refCount();

        const warenkorbDe$ = this.warenkorbSelectedDe$
            .map(event => _.first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_DE'))
            .flatMap(file => this.readFileContents(file))
            .map(content => this.parseFile(content));
        const warenkorbFr$ = this.warenkorbSelectedFr$
            .map(event => _.first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_FR'))
            .flatMap(file => this.readFileContents(file))
            .map(content => this.parseFile(content));
        const warenkorbIt$ = this.warenkorbSelectedIt$
            .map(event => _.first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_IT'))
            .flatMap(file => this.readFileContents(file))
            .map(content => this.parseFile(content));

        const warenkorbCompleted$ = warenkorbDe$
            .do(x => console.log('warenkorb de', x))
            .combineLatest(warenkorbFr$, warenkorbIt$, (de: string[][], fr: string[][], it: string[][]) => ({ de, fr, it }))
            .do(x => console.log('combined_latest', x))
            .publishReplay(1).refCount();

        this.warenkorbIsCompleted$ = warenkorbCompleted$.map(_ => true).startWith(false);

        warenkorbCompleted$
            .combineLatest(this.createWarenkorbClicked$, login$, (warenkorb, ..._) => warenkorb)
            .do(x => console.log('combined_latest+click', x))
            .map(x => this.createWarenkorb(x))
            .do(x => console.log('warenkorb', x))
            .publishReplay(1).refCount()
            .do(x => couch.destroy())
            .map(warenkorb => Observable.fromPromise(couch.bulkDocs(warenkorb)))
            .flatMap(x => x);
    }

    readFileContents(file: File) {
        const reader = new FileReader();
        const text$ = Observable.fromEvent<ProgressEvent>(reader, 'load')
            .map(x => (x.target as FileReader).result as string);
        reader.readAsText(file, 'ISO-8859-1');
        return text$;
    }

    private parseFile(data: string): string[][] {
        const lines = data.split(/\r?\n/);
        return _.drop(lines.filter(x => x.length)).map(x => x.split(';'));
    }

    private createWarenkorb(translations: { de: string[][], fr: string[][], it: string[][] }) {
        return buildTree(translations);
    }
}
