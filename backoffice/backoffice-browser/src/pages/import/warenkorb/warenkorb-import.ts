import { EventEmitter, Output, Component, OnDestroy } from '@angular/core';
import { LoadingController, Loading } from 'ionic-angular';
import { Observable, Subscription } from 'rxjs';
import { first } from 'lodash';

import { readFileContents, parseCsv } from '../../../common/file-extensions';
import { buildTree } from '../../../common/presta-warenkorb-mapper';
import { dropDatabase, getDatabase, putAdminUserToDatabase } from '../../../effects/pouchdb-utils';
import { Http } from '@angular/http';

@Component({
    selector: 'warenkorb-import',
    templateUrl: 'warenkorb-import.html',
})
export class WarenkorbImportComponent implements OnDestroy {
    @Output('importCompleted')
    public importCompleted$: Observable<number>;

    public warenkorbSelectedDe$ = new EventEmitter<Event>();
    public warenkorbSelectedFr$ = new EventEmitter<Event>();
    public warenkorbSelectedIt$ = new EventEmitter<Event>();
    public createWarenkorbClicked$ = new EventEmitter();

    public warenkorbIsCompleted$: Observable<boolean>;
    public warenkorbImported$: Observable<number>;
    private isWarenkorbImported$: Observable<boolean>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private http: Http, private loadingCtrl: LoadingController) {
        const warenkorbDe$ = this.warenkorbSelectedDe$
            .map(event => first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_DE'))
            .flatMap(file => readFileContents(file))
            .map(content => parseCsv(content));
        const warenkorbFr$ = this.warenkorbSelectedFr$
            .map(event => first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_FR'))
            .flatMap(file => readFileContents(file))
            .map(content => parseCsv(content));
        const warenkorbIt$ = this.warenkorbSelectedIt$
            .map(event => first((<HTMLInputElement>event.target).files))
            .filter(f => !!f.name.match('Erhebungsschema_IT'))
            .flatMap(file => readFileContents(file))
            .map(content => parseCsv(content));

        const warenkorbCompleted$ = warenkorbDe$
            .combineLatest(warenkorbFr$, warenkorbIt$, (de: string[][], fr: string[][], it: string[][]) => ({ de, fr, it }))
            .publishReplay(1).refCount();

        this.warenkorbIsCompleted$ = warenkorbCompleted$.map(_ => true).startWith(false);

        this.importCompleted$ = this.createWarenkorbClicked$
            .withLatestFrom(warenkorbCompleted$, (_, warenkorb) => warenkorb)
            .map(x => buildTree(x))
            .flatMap(x => dropDatabase('warenkorb').then(_ => x).catch(_ => x))
            .flatMap(x => getDatabase('warenkorb').then(db => ({ warenkorb: x, db })).catch(_ => ({ warenkorb: x, db: <PouchDB.Database<PouchDB.Core.Encodable>>null })))
            .flatMap(({ warenkorb, db }) => Observable.fromPromise(db.put({ _id: 'warenkorb', products: warenkorb }).then(_ => warenkorb.length)))
            .publishReplay(1).refCount();

        this.warenkorbImported$ = this.importCompleted$.startWith(0)
            .publishReplay(1).refCount();
        this.isWarenkorbImported$ = this.warenkorbImported$.map(x => x > 0);

        this.subscriptions = [
            this.createWarenkorbClicked$
                .subscribe(() => this.presentLoadingScreen()),

            this.importCompleted$
                .flatMap(x => putAdminUserToDatabase('warenkorb', 'lik-admin')) // TODO: Find out how to store username of logged in
                .do(x => this.dismissLoadingScreen())
                .subscribe()
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
