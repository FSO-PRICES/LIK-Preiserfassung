import { EventEmitter, Output, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { first, chunk } from 'lodash';

import { readFileContents, parseFile } from '../../../common/file-select-observable';
import { dropLocalDatabase, getLocalDatabase, putAdminUserToDatabase, syncDb } from '../../../effects/pouchdb-utils';
import { preparePm } from '../../../common/presta-data-mapper';
import { Http } from '@angular/http';

@Component({
    selector: 'preismeldungen-import',
    templateUrl: 'preismeldungen-import.html',
})
export class PreismeldungenImportComponent {
    public parsingIsCompleted$: Observable<boolean>;

    public preismeldungenSelected$ = new EventEmitter<Event>();

    public createPreismeldungenClicked$ = new EventEmitter<Event>();

    @Output('importCompleted')
    public importCompleted$: Observable<number>;

    public preismeldungenImported$: Observable<number>;
    private arePreismeldungenImported$: Observable<boolean>;

    constructor(private http: Http) {
        const parseCompleted$ = this.preismeldungenSelected$
            .map(event => first((<HTMLInputElement>event.target).files))
            // .filter(f => !!f.name.match('file name?'))
            .flatMap(file => readFileContents(file))
            .map(content => parseFile(content))
            .publishReplay(1).refCount();

        this.parsingIsCompleted$ = parseCompleted$.map(_ => true).startWith(false);

        this.importCompleted$ = this.createPreismeldungenClicked$
            .withLatestFrom(parseCompleted$, (_, preismeldestellen) => preismeldestellen)
            .map(x => preparePm(x))
            .flatMap(x => dropLocalDatabase('preismeldungen').then(_ => x))
            .flatMap(x => getLocalDatabase('preismeldungen').then(db => ({ preismeldungen: x, db })))
            .flatMap<number[]>(({ preismeldungen, db }) => {
                return Observable.from(
                    chunk(preismeldungen, 6000).map(preismeldungenBatch => {
                        return db.bulkDocs(preismeldungenBatch).then(_ => preismeldungenBatch.length);
                    })
                ).combineAll();
            })
            .map<number>(x => x.reduce((prev, current) => prev + current, 0))
            // .do(x => console.time('test'))
            // .flatMap<number>(({ preismeldungen, db }) => Observable.fromPromise(
            //     chunk(preismeldungen, 6000).reduce((previousPromise, preismeldungenBatch) => {
            //         return previousPromise.then(count => db.bulkDocs(preismeldungenBatch, { ajax: { timeout: 3600 } }).then(_ => count + preismeldungenBatch.length));
            //     }, Promise.resolve(0)))
            // )
            // .do(x => console.timeEnd('test'))
            .flatMap(x => Observable.fromPromise(syncDb('preismeldungen').then(() => x)))
            .publishReplay(1).refCount();

        this.importCompleted$
            .flatMap(x => putAdminUserToDatabase(http, 'preismeldungen'))
            .subscribe();

        this.preismeldungenImported$ = this.importCompleted$.startWith(0)
            .publishReplay(1).refCount();
        this.arePreismeldungenImported$ = this.preismeldungenImported$.map(x => x > 0);
    }
}
