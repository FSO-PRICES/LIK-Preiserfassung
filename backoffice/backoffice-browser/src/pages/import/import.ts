import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';

import { PefDialogService } from 'lik-shared';

import * as importer from '../../actions/importer';
import * as fromRoot from '../../reducers';

@Component({
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

    public latestWarenkorbImportAt$ = this.store.select(fromRoot.getImportedWarenkorbAt);
    public latestPreismeldestellenImportAt$ = this.store.select(fromRoot.getImportedPreismeldestellenAt);
    public latestPreismeldungenImportAt$ = this.store.select(fromRoot.getImportedPreismeldungenAt);

    public warenkorbErhebungsmonat$ = this.store.select(fromRoot.getWarenkorbErhebungsmonat);
    public preismeldestellenErhebungsmonat$ = this.store.select(fromRoot.getPreismeldestellenErhebungsmonat);
    public preismeldungenErhebungsmonat$ = this.store.select(fromRoot.getPreismeldungenErhebungsmonat);

    public importError$ = this.store.select(fromRoot.getImporterState).map(s => s.importError);
    public importedAll$ = this.store.select(fromRoot.getImportedAll);
    public recreateUserDbsClicked$ = new EventEmitter();

    private subscriptions: Subscription[];

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        const parsedWarenkorb$ = this.store.select(fromRoot.getImporterParsedWarenkorb)
            .publishReplay(1).refCount();
        const parsedPreismeldestellen$ = this.store.select(fromRoot.getImporterParsedPreismeldestellen)
            .publishReplay(1).refCount();
        const parsedPreismeldungen$ = this.store.select(fromRoot.getImporterParsedPreismeldungen)
            .publishReplay(1).refCount();

        const warenkorbImported$ = store.select(fromRoot.getImportedWarenkorb)
            .skip(1)
            .filter(x => !!x)
            .publishReplay(1).refCount();
        const preismeldestellenImported$ = store.select(fromRoot.getImportedPreismeldestellen)
            .skip(1)
            .filter(x => !!x)
            .publishReplay(1).refCount();
        const preismeldungenImported$ = store.select(fromRoot.getImportedPreismeldungen)
            .skip(1)
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

        const dismissWarenkorbLoading$ = warenkorbImported$.skip(1).merge(this.importError$.skip(1));
        const dismissPreismeldestellenLoading$ = preismeldestellenImported$.skip(1).merge(this.importError$.skip(1));
        const dismissPreismeldungenLoading$ = preismeldungenImported$.skip(1).merge(this.importError$.skip(1));

        this.subscriptions = [
            this.warenkorbFileSelected$
                .asObservable()
                .subscribe(data => store.dispatch({ type: 'PARSE_WARENKORB_FILE', payload: { file: data.file, language: data.language } } as importer.Action)),
            this.warenkorbStartImport$
                .withLatestFrom(parsedWarenkorb$, (_, parsedWarenkorb) => parsedWarenkorb)
                .flatMap(data => this.pefDialogService.displayLoading('Daten werden importiert, bitte warten...', dismissWarenkorbLoading$).map(() => data))
                .subscribe(data => store.dispatch({ type: 'IMPORT_WARENKORB', payload: data } as importer.Action)),

            this.preismeldestelleFileSelected$
                .subscribe(file => store.dispatch({ type: 'PARSE_FILE', payload: { file, parseType: importer.Type.preismeldestellen } } as importer.Action)),
            this.preismeldestellenStartImport$
                .withLatestFrom(parsedPreismeldestellen$, (_, parsedPreismeldestellen) => parsedPreismeldestellen)
                .flatMap(data => this.pefDialogService.displayLoading('Daten werden importiert, bitte warten...', dismissPreismeldestellenLoading$).map(() => data))
                .subscribe(data => store.dispatch({ type: 'IMPORT_PREISMELDESTELLEN', payload: data } as importer.Action)),


            this.preismeldungFileSelected$
                .subscribe(file => store.dispatch({ type: 'PARSE_FILE', payload: { file, parseType: importer.Type.preismeldungen } } as importer.Action)),
            this.preismeldungenStartImport$
                .withLatestFrom(parsedPreismeldungen$, (_, parsedPreismeldungen) => parsedPreismeldungen)
                .flatMap(data => this.pefDialogService.displayLoading('Daten werden importiert, bitte warten...', dismissPreismeldungenLoading$).map(() => data))
                .subscribe(data => store.dispatch({ type: 'IMPORT_PREISMELDUNGEN', payload: data } as importer.Action)),


            Observable.merge(warenkorbImported$, preismeldungenImported$, preismeldestellenImported$)
                .subscribe(() => {
                    this.store.dispatch({ type: 'LOAD_LATEST_IMPORTED_AT' } as importer.Action);
                    this.store.dispatch({ type: 'LOAD_ERHEBUNGSMONATE' } as importer.Action);
                }),

            warenkorbImported$
                .combineLatest(preismeldestellenImported$, preismeldungenImported$, (warenkorb, preismeldestellen, preismeldungen) => !!warenkorb && !!preismeldestellen && !!preismeldungen)
                .filter(importedAll => importedAll)
                .merge(this.recreateUserDbsClicked$)
                .subscribe(() => store.dispatch({ type: 'IMPORTED_ALL' } as importer.Action))
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'LOAD_LATEST_IMPORTED_AT' } as importer.Action);
        this.store.dispatch({ type: 'LOAD_ERHEBUNGSMONATE' } as importer.Action);
        this.store.dispatch({ type: 'IMPORTED_ALL_RESET' } as importer.Action);
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }
}
