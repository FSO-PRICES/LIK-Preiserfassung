import { Component, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { LoadingController, Loading } from 'ionic-angular';
import * as importer from '../../actions/importer';

import * as fromRoot from '../../reducers';

@Component({
    templateUrl: 'import.html'
})
export class ImportPage {
    public warenkorbFileSelected$ = new EventEmitter<{ file: File, language: string }>();
    public warenkorbStartImport$ = new EventEmitter();
    public warenkorbFileParsed$: Observable<boolean>;
    public warenkorbImportedCount$: Observable<number>;

    public preismeldestelleFileSelected$ = new EventEmitter<File>();
    public preismeldestellenStartImport$ = new EventEmitter();
    public preismeldestelleFileParsed$: Observable<boolean>;
    public preismeldestellenImportedCount$: Observable<number>;

    public preismeldungFileSelected$ = new EventEmitter<File>();
    public preismeldungenStartImport$ = new EventEmitter();
    public preismeldungFileParsed$: Observable<boolean>;
    public preismeldungenImportedCount$: Observable<number>;

    public latestWarenkorbImportAt$ = this.store.select(fromRoot.getImportedWarenkorbAt);
    public latestPreismeldestellenImportAt$ = this.store.select(fromRoot.getImportedPreismeldestellenAt);
    public latestPreismeldungenImportAt$ = this.store.select(fromRoot.getImportedPreismeldungenAt);

    // public warenkorbImportCompleted$ = new EventEmitter<number>();
    // public preismeldestellenImportCompleted$ = new EventEmitter<number>();
    // public preismeldungenImportCompleted$ = new EventEmitter<number>();

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController) {
        const parsedWarenkorb$ = this.store.select(fromRoot.getImporterParsedWarenkorb)
            .publishReplay(1).refCount();
        const parsedPreismeldestellen$ = this.store.select(fromRoot.getImporterParsedPreismeldestellen)
            .publishReplay(1).refCount();
        const parsedPreismeldungen$ = this.store.select(fromRoot.getImporterParsedPreismeldungen)
            .publishReplay(1).refCount();

        const warenkorbImported$ = store.select(fromRoot.getImportedWarenkorb)
            .filter(x => !!x)
            .publishReplay(1).refCount();
        const preismeldestellenImported$ = store.select(fromRoot.getImportedPreismeldestellen)
            .filter(x => !!x)
            .publishReplay(1).refCount();
        const preismeldungenImported$ = store.select(fromRoot.getImportedPreismeldungen)
            .filter(x => !!x)
            .publishReplay(1).refCount();

        this.warenkorbFileParsed$ = parsedWarenkorb$
            .map(content => content != null && content.de != null && content.fr != null && content.it != null);
        this.preismeldestelleFileParsed$ = parsedPreismeldestellen$
            .map(content => content != null);
        this.preismeldungFileParsed$ = parsedPreismeldungen$
            .map(content => content != null);

        this.warenkorbImportedCount$ = warenkorbImported$
            .map(x => x.products.length);
        this.preismeldestellenImportedCount$ = preismeldestellenImported$
            .map(x => x.length);
        this.preismeldungenImportedCount$ = preismeldungenImported$
            .map(x => x.length);

        this.subscriptions = [
            this.warenkorbFileSelected$
                .asObservable()
                .subscribe(data => store.dispatch({ type: 'PARSE_WARENKORB_FILE', payload: { file: data.file, language: data.language } } as importer.Action)),
            this.warenkorbStartImport$
                .withLatestFrom(parsedWarenkorb$, (_, parsedWarenkorb) => parsedWarenkorb)
                .subscribe(data => {
                    this.presentLoadingScreen().then(() => store.dispatch({ type: 'IMPORT_WARENKORB', payload: data } as importer.Action));
                }),

            this.preismeldestelleFileSelected$
                .subscribe(file => store.dispatch({ type: 'PARSE_FILE', payload: { file, parseType: importer.Type.preismeldestellen } } as importer.Action)),
            this.preismeldestellenStartImport$
                .withLatestFrom(parsedPreismeldestellen$, (_, parsedPreismeldestellen) => parsedPreismeldestellen)
                .subscribe(data => {
                    this.presentLoadingScreen().then(() => store.dispatch({ type: 'IMPORT_PREISMELDESTELLEN', payload: data } as importer.Action));
                }),


            this.preismeldungFileSelected$
                .subscribe(file => store.dispatch({ type: 'PARSE_FILE', payload: { file, parseType: importer.Type.preismeldungen } } as importer.Action)),
            this.preismeldungenStartImport$
                .withLatestFrom(parsedPreismeldungen$, (_, parsedPreismeldungen) => parsedPreismeldungen)
                .subscribe(data => {
                    this.presentLoadingScreen().then(() => store.dispatch({ type: 'IMPORT_PREISMELDUNGEN', payload: data } as importer.Action));
                }),


            Observable.merge(warenkorbImported$, preismeldungenImported$, preismeldestellenImported$)
                .subscribe(() => {
                    this.dismissLoadingScreen();
                    this.store.dispatch({ type: 'LOAD_LATEST_IMPORTED_AT' } as importer.Action);
                })
        ];

        this.store.dispatch({ type: 'LOAD_LATEST_IMPORTED_AT' } as importer.Action);
    }

    private presentLoadingScreen() {
        this.dismissLoadingScreen();

        this.loader = this.loadingCtrl.create({
            content: 'Datensynchronisierung. Bitte warten...'
        });

        return this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}
