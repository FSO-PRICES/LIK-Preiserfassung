import { EventEmitter, Output, Component, OnDestroy } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { first } from 'lodash';

import { readFileContents, parseCsv } from '../../../common/file-extensions';
import { dropDatabase, getDatabase, putAdminUserToDatabase } from '../../../effects/pouchdb-utils';
import { preparePms } from '../../../common/presta-data-mapper';
import { Http } from '@angular/http';

@Component({
    selector: 'preismeldestellen-import',
    templateUrl: 'preismeldestellen-import.html',
})
export class PreismeldestellenImportComponent implements OnDestroy {
    @Output('importCompleted')
    public importCompleted$: Observable<number>;

    public preismeldestellenSelected$ = new EventEmitter<Event>();
    public createPreismeldestellenClicked$ = new EventEmitter<Event>();

    public parsingIsCompleted$: Observable<boolean>;
    public preistellenImported$: Observable<number>;
    private arePreistellenImported$: Observable<boolean>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private http: Http, private loadingCtrl: LoadingController) {
        const parseCompleted$ = this.preismeldestellenSelected$
            .map(event => first((<HTMLInputElement>event.target).files))
            // .filter(f => !!f.name.match('file name?'))
            .flatMap(file => readFileContents(file))
            .map(content => parseCsv(content))
            .publishReplay(1).refCount();

        this.parsingIsCompleted$ = parseCompleted$.map(_ => true).startWith(false);

        this.importCompleted$ = this.createPreismeldestellenClicked$
            .withLatestFrom(parseCompleted$, (_, preismeldestellen) => preismeldestellen)
            .map(x => preparePms(x))
            .flatMap(x => dropDatabase('preismeldestellen').then(_ => x).catch(_ => x))
            .flatMap(x => getDatabase('preismeldestellen').then(db => ({ preismeldestellen: x, db })).catch(_ => ({ preismeldestellen: x, db: null })))
            .flatMap(({ preismeldestellen, db }) => Observable.fromPromise(db.bulkDocs(preismeldestellen).then(_ => preismeldestellen.length)))
            .publishReplay(1).refCount();

        this.preistellenImported$ = this.importCompleted$.startWith(0)
            .publishReplay(1).refCount();
        this.arePreistellenImported$ = this.preistellenImported$.map(x => x > 0);

        this.subscriptions = [
            this.createPreismeldestellenClicked$
                .subscribe(() => this.presentLoadingScreen()),

            this.importCompleted$
                .flatMap(x => putAdminUserToDatabase('preismeldestellen', 'lik-admin')) // TODO: Find out how to store username of logged in
                .subscribe(x => this.dismissLoadingScreen())
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
