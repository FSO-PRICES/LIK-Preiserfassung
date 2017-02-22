import { buildTree } from '../../common/presta-warenkorb-mapper';
import { Component, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { Observable } from 'rxjs';
import * as bluebird from 'bluebird';
import * as _ from 'lodash';
import * as PouchDB from 'pouchdb';
import * as pouchDbAuthentication from 'pouchdb-authentication';
import { getDatabase, dropDatabase } from '../../effects/pouchdb-utils';

PouchDB.plugin(pouchDbAuthentication);

@Component({
    templateUrl: 'initialization.html'
})
export class InitializationPage {
    public warenkorbIsCompleted$: Observable<boolean>;

    public warenkorbSelectedDe$ = new EventEmitter<Event>();
    public warenkorbSelectedFr$ = new EventEmitter<Event>();
    public warenkorbSelectedIt$ = new EventEmitter<Event>();

    public createWarenkorbClicked$ = new EventEmitter();

    public warenkorbCreated$: Observable<number>;

    constructor(private http: Http) {
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
            .combineLatest(warenkorbFr$, warenkorbIt$, (de: string[][], fr: string[][], it: string[][]) => ({ de, fr, it }))
            .do(x => console.log('combined_latest', x))
            .publishReplay(1).refCount();

        this.warenkorbIsCompleted$ = warenkorbCompleted$.map(_ => true).startWith(false);

        this.createWarenkorbClicked$.subscribe(x => console.log('clicked', x));

        this.warenkorbCreated$ = Observable
            .forkJoin(warenkorbCompleted$.take(1), this.createWarenkorbClicked$.take(1), (warenkorb, ..._) => warenkorb)
            .map(x => this.createWarenkorb(x))
            .flatMap(x => dropDatabase('warenkorb').then(_ => x).catch(_ => x))
            .flatMap(x => getDatabase('warenkorb').then(db => ({ warenkorb: x, db })).catch(_ => ({ warenkorb: x, db: null })))
            .flatMap(({ warenkorb, db }) => Observable.fromPromise(db.bulkDocs(warenkorb).then(_ => warenkorb.length)))
            .publishReplay(1).refCount();

        this.warenkorbCreated$.subscribe(x => console.log("created", x));
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

    public isWarenkorbCreated() {
        return this.warenkorbCreated$.map(x => x > 0).startWith(false);
    }
}
