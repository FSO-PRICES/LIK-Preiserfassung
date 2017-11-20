import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { PefDialogService, parseDate } from 'lik-shared';

import * as importer from '../../actions/importer';
import * as fromRoot from '../../reducers';
import { IonicPage } from 'ionic-angular';

@IonicPage({
    segment: 'import'
})
@Component({
    selector: 'import-page',
    templateUrl: 'import.html'
})
export class ImportPage implements OnDestroy {
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

    public getImportedAllDataAt$ = this.store.select(fromRoot.getImportedAllDataAt);

    public warenkorbErhebungsmonat$: Observable<Date>;
    public preismeldestellenErhebungsmonat$: Observable<Date>;
    public preismeldungenErhebungsmonat$: Observable<Date>;

    public canImport$: Observable<boolean>;
    public import$ = new EventEmitter();

    public resetFileInputs$: Observable<{}>;

    private onDestroy$ = new EventEmitter();

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        const parsedWarenkorb$ = this.store.select(fromRoot.getImporterParsedWarenkorb).publishReplay(1).refCount();
        const parsedPreismeldestellen$ = this.store.select(fromRoot.getImporterParsedPreismeldestellen).publishReplay(1).refCount();
        const parsedPreismeldungen$ = this.store.select(fromRoot.getImporterParsedPreismeldungen).publishReplay(1).refCount();

        this.warenkorbErhebungsmonat$ = this.store.select(fromRoot.getWarenkorbErhebungsmonat).map(parseDate)
            .combineLatest(parsedWarenkorb$, (m, parsedWarenkorb) => !!parsedWarenkorb ? null : m);
        this.preismeldestellenErhebungsmonat$ = this.store.select(fromRoot.getPreismeldestellenErhebungsmonat).map(parseDate)
            .combineLatest(parsedPreismeldestellen$, (m, parsedWarenkorb) => !!parsedWarenkorb ? null : m);
        this.preismeldungenErhebungsmonat$ = this.store.select(fromRoot.getPreismeldungenErhebungsmonat).map(parseDate)
            .combineLatest(parsedPreismeldungen$, (m, parsedWarenkorb) => !!parsedWarenkorb ? null : m);

        this.warenkorbFileParsed$ = parsedWarenkorb$.map(content => content != null && content.de != null && content.fr != null && content.it != null);
        this.preismeldestelleFileParsed$ = parsedPreismeldestellen$.map(content => content != null);
        this.preismeldungFileParsed$ = parsedPreismeldungen$.map(content => content != null);

        this.warenkorbImportedCount$ = store.select(fromRoot.getImportedWarenkorb).map(x => !x ? null : x.products.length);
        this.preismeldestellenImportedCount$ = store.select(fromRoot.getImportedPreismeldestellen).map(x => !x ? null : x.length);
        this.preismeldungenImportedCount$ = store.select(fromRoot.getImportedPreismeldungen).map(x => !x ? null : x.length);

        this.warenkorbFileSelected$
            .takeUntil(this.onDestroy$)
            .subscribe(data => store.dispatch({ type: 'PARSE_WARENKORB_FILE', payload: { file: data.file, language: data.language } } as importer.Action));

        this.preismeldestelleFileSelected$
            .takeUntil(this.onDestroy$)
            .subscribe(file => store.dispatch({ type: 'PARSE_FILE', payload: { file, parseType: importer.Type.preismeldestellen } } as importer.Action));

        this.preismeldungFileSelected$
            .takeUntil(this.onDestroy$)
            .subscribe(file => store.dispatch({ type: 'PARSE_FILE', payload: { file, parseType: importer.Type.preismeldungen } } as importer.Action));

        const parsedData$ = Observable.combineLatest(
            parsedWarenkorb$.filter(content => content != null && content.de != null && content.fr != null && content.it != null),
            parsedPreismeldungen$.filter(x => !!x),
            parsedPreismeldestellen$.filter(x => !!x),
            (parsedWarenkorb, parsedPreismeldungen, parsedPreismeldestellen) => ({ parsedWarenkorb, parsedPreismeldungen, parsedPreismeldestellen }))
            .publishReplay(1).refCount();

        this.canImport$ = parsedData$.mapTo(true).startWith(false)
            .publishReplay(1).refCount();

        this.import$
            .flatMap(data => this.pefDialogService.displayLoading('Daten werden importiert, bitte warten...', this.getImportedAllDataAt$.skip(1).take(1)))
            .takeUntil(this.onDestroy$)
            .withLatestFrom(parsedData$, (_, parsedData) => parsedData)
            .subscribe(parsedData => {
                store.dispatch({ type: 'IMPORT_DATA', payload: parsedData });
            });

        this.resetFileInputs$ = this.getImportedAllDataAt$
            .filter(x => !!x).skip(1)
            .map(() => ({}));
    };

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'LOAD_LATEST_IMPORTED_AT' } as importer.Action);
        this.store.dispatch({ type: 'LOAD_ERHEBUNGSMONATE' } as importer.Action);
        this.store.dispatch({ type: 'IMPORTED_ALL_RESET' } as importer.Action);
        this.store.dispatch({ type: 'CLEAR_PARSED_FILES' } as importer.Action);
    }

    ngOnDestroy() {
        this.onDestroy$.next();
    }
}
