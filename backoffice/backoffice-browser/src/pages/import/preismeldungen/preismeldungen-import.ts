import { EventEmitter, Output, Component, OnDestroy } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { first, chunk } from 'lodash';

import { readFileContents, parseCsv } from '../../../common/file-extensions';
import { dropLocalDatabase, getLocalDatabase, putAdminUserToDatabase, syncDb } from '../../../effects/pouchdb-utils';
import { preparePm } from '../../../common/presta-data-mapper';
import { Http } from '@angular/http';

@Component({
    selector: 'preismeldungen-import',
    templateUrl: 'preismeldungen-import.html',
})
export class PreismeldungenImportComponent implements OnDestroy {
    @Output('importCompleted')
    public importCompleted$: Observable<number>;

    public preismeldungenSelected$ = new EventEmitter<Event>();
    public createPreismeldungenClicked$ = new EventEmitter<Event>();

    public parsingIsCompleted$: Observable<boolean>;
    public preismeldungenImported$: Observable<number>;
    private arePreismeldungenImported$: Observable<boolean>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private http: Http, private loadingCtrl: LoadingController) {
        const parseCompleted$ = this.preismeldungenSelected$
            .map(event => first((<HTMLInputElement>event.target).files))
            // .filter(f => !!f.name.match('file name?')) // TODO Add filename filter for preismeldung import
            .flatMap(file => readFileContents(file))
            .map(content => parseCsv(content))
            .publishReplay(1).refCount();

        this.parsingIsCompleted$ = parseCompleted$.map(_ => true).startWith(false);

        this.importCompleted$ = this.createPreismeldungenClicked$
            .withLatestFrom(parseCompleted$, (_, preismeldestellen) => preismeldestellen)
            .map(x => preparePm(x))
            // Slow: about 1 minute 20 seconds
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
            .flatMap(x => Observable.fromPromise(syncDb('preismeldungen').then(() => x)))
            // Fast: about 9 seconds
            // .flatMap<number>(({ preismeldungen, db }) => Observable.fromPromise(
            //     chunk(preismeldungen, 6000).reduce((previousPromise, preismeldungenBatch) => {
            //         return previousPromise.then(count => db.bulkDocs(preismeldungenBatch, { ajax: { timeout: 3600 } }).then(_ => count + preismeldungenBatch.length));
            //     }, Promise.resolve(0)))
            // )
            .publishReplay(1).refCount();

        this.preismeldungenImported$ = this.importCompleted$.startWith(0)
            .publishReplay(1).refCount();
        this.arePreismeldungenImported$ = this.preismeldungenImported$.map(x => x > 0);

        this.subscriptions = [
            this.createPreismeldungenClicked$
                .subscribe(() => this.presentLoadingScreen()),

            this.importCompleted$
                .flatMap(x => putAdminUserToDatabase('preismeldungen', 'lik-admin')) // TODO: Find out how to store username of logged in
                .subscribe(() => this.dismissLoadingScreen())
        ];
    }

    public ngOnDestroy() {
        if (!this.subscriptions || this.subscriptions.length === 0) return;
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }

    private presentLoadingScreen() {
        this.dismissLoadingScreen();

        this.loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}
