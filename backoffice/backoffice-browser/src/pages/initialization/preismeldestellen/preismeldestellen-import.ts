import { EventEmitter, Output, Component } from '@angular/core';
import { LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { first } from 'lodash';

import { readFileContents, parseFile } from '../../../common/file-select-observable';
import { dropDatabase, getDatabase, putAdminUserToDatabase } from '../../../effects/pouchdb-utils';
import { preparePms } from '../../../common/presta-data-mapper';
import { Http } from '@angular/http';

@Component({
    selector: 'preismeldestellen-import',
    templateUrl: 'preismeldestellen-import.html',
})
export class PreismeldestellenImportComponent {
    public parsingIsCompleted$: Observable<boolean>;

    public preismeldestellenSelected$ = new EventEmitter<Event>();

    public createPreismeldestellenClicked$ = new EventEmitter<Event>();

    @Output('importCompleted')
    public importCompleted$: Observable<number>;

    public preistellenImported$: Observable<number>;
    private arePreistellenImported$: Observable<boolean>;

    constructor(private http: Http, private loadingCtrl: LoadingController) {
        const loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        const parseCompleted$ = this.preismeldestellenSelected$
            .map(event => first((<HTMLInputElement>event.target).files))
            // .filter(f => !!f.name.match('file name?'))
            .flatMap(file => readFileContents(file))
            .map(content => parseFile(content))
            .publishReplay(1).refCount();

        this.parsingIsCompleted$ = parseCompleted$.map(_ => true).startWith(false);

        this.importCompleted$ = this.createPreismeldestellenClicked$
            .withLatestFrom(parseCompleted$, (_, preismeldestellen) => preismeldestellen)
            .do(x => loader.present())
            .map(x => preparePms(x))
            .flatMap(x => dropDatabase('preismeldestellen').then(_ => x).catch(_ => x))
            .flatMap(x => getDatabase('preismeldestellen').then(db => ({ preismeldestellen: x, db })).catch(_ => ({ preismeldestellen: x, db: null })))
            .flatMap(({ preismeldestellen, db }) => Observable.fromPromise(db.bulkDocs(preismeldestellen).then(_ => preismeldestellen.length)))
            .publishReplay(1).refCount();

        this.importCompleted$
            .flatMap(x => putAdminUserToDatabase(http, 'preismeldestellen'))
            .do(x => loader.dismiss())
            .subscribe();

        this.preistellenImported$ = this.importCompleted$.startWith(0)
            .publishReplay(1).refCount();
        this.arePreistellenImported$ = this.preistellenImported$.map(x => x > 0);
    }
}
