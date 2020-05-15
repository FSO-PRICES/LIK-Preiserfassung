import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as combineLatestFrom, Observable } from 'rxjs';
import {
    combineLatest,
    filter,
    flatMap,
    map,
    merge,
    publishReplay,
    refCount,
    skip,
    startWith,
    take,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import { parseDate, PefDialogService } from '@lik-shared';

import * as importer from '../../actions/importer';
import * as fromRoot from '../../reducers';
import { blockIfNotLoggedInOrHasNoWritePermission } from '../../common/effects-extensions';

@Component({
    selector: 'import-page',
    templateUrl: 'import.html',
    styleUrls: ['import.scss'],
})
export class ImportPage implements OnDestroy {
    public warenkorbFileSelected$ = new EventEmitter<File>();
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
    public importErrors$ = this.store.select(fromRoot.getImportError);

    public warenkorbErhebungsmonat$: Observable<Date>;
    public preismeldestellenErhebungsmonat$: Observable<Date>;
    public preismeldungenErhebungsmonat$: Observable<Date>;

    public canImport$: Observable<boolean>;
    public import$ = new EventEmitter();

    public resetFileInputs$: Observable<{}>;

    private onDestroy$ = new EventEmitter();

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        const parsedWarenkorb$ = this.store.select(fromRoot.getImporterParsedWarenkorb).pipe(
            publishReplay(1),
            refCount(),
        );
        const parsedPreismeldestellen$ = this.store.select(fromRoot.getImporterParsedPreismeldestellen).pipe(
            publishReplay(1),
            refCount(),
        );
        const parsedPreismeldungen$ = this.store.select(fromRoot.getImporterParsedPreismeldungen).pipe(
            publishReplay(1),
            refCount(),
        );

        this.warenkorbErhebungsmonat$ = this.store.select(fromRoot.getWarenkorbErhebungsmonat).pipe(
            map(parseDate),
            combineLatest(parsedWarenkorb$, (m, parsedWarenkorb) => (!!parsedWarenkorb ? null : m)),
        );
        this.preismeldestellenErhebungsmonat$ = this.store.select(fromRoot.getPreismeldestellenErhebungsmonat).pipe(
            map(parseDate),
            combineLatest(parsedPreismeldestellen$, (m, parsedWarenkorb) => (!!parsedWarenkorb ? null : m)),
        );
        this.preismeldungenErhebungsmonat$ = this.store.select(fromRoot.getPreismeldungenErhebungsmonat).pipe(
            map(parseDate),
            combineLatest(parsedPreismeldungen$, (m, parsedWarenkorb) => (!!parsedWarenkorb ? null : m)),
        );

        this.warenkorbFileParsed$ = parsedWarenkorb$.pipe(map(content => content != null));
        this.preismeldestelleFileParsed$ = parsedPreismeldestellen$.pipe(map(content => content != null));
        this.preismeldungFileParsed$ = parsedPreismeldungen$.pipe(map(content => content != null));

        this.warenkorbImportedCount$ = store
            .select(fromRoot.getImportedWarenkorb)
            .pipe(map(x => (!x ? null : x.products.length)));
        this.preismeldestellenImportedCount$ = store
            .select(fromRoot.getImportedPreismeldestellen)
            .pipe(map(x => (!x ? null : x.length)));
        this.preismeldungenImportedCount$ = store
            .select(fromRoot.getImportedPreismeldungen)
            .pipe(map(x => (!x ? null : x.length)));

        this.warenkorbFileSelected$.pipe(takeUntil(this.onDestroy$)).subscribe(file =>
            store.dispatch({
                type: 'PARSE_FILE',
                payload: { file, parseType: importer.Type.warenkorb },
            } as importer.Action),
        );

        this.preismeldestelleFileSelected$.pipe(takeUntil(this.onDestroy$)).subscribe(file =>
            store.dispatch({
                type: 'PARSE_FILE',
                payload: { file, parseType: importer.Type.preismeldestellen },
            } as importer.Action),
        );

        this.preismeldungFileSelected$.pipe(takeUntil(this.onDestroy$)).subscribe(file =>
            store.dispatch({
                type: 'PARSE_FILE',
                payload: { file, parseType: importer.Type.preismeldungen },
            } as importer.Action),
        );

        const parsedData$ = combineLatestFrom(
            parsedWarenkorb$,
            parsedPreismeldungen$,
            parsedPreismeldestellen$,
            (parsedWarenkorb, parsedPreismeldungen, parsedPreismeldestellen) => ({
                parsedWarenkorb,
                parsedPreismeldungen,
                parsedPreismeldestellen,
            }),
        ).pipe(
            publishReplay(1),
            refCount(),
        );

        this.canImport$ = parsedData$.pipe(
            map(
                x =>
                    x.parsedPreismeldestellen !== null && x.parsedPreismeldungen !== null && x.parsedWarenkorb !== null,
            ),
            startWith(false),
            publishReplay(1),
            refCount(),
        );

        const importRequested$ = this.import$.pipe(
            withLatestFrom(this.canImport$),
            filter(([_, canImport]) => canImport),
            publishReplay(1),
            refCount(),
        );

        importRequested$
            .pipe(
                blockIfNotLoggedInOrHasNoWritePermission(this.store),
                flatMap(() =>
                    this.pefDialogService.displayLoading('Daten werden importiert, bitte warten...', {
                        requestDismiss$: this.getImportedAllDataAt$.pipe(
                            skip(1),
                            merge(this.importErrors$.pipe(skip(1))),
                            take(1),
                        ),
                    }),
                ),
                takeUntil(this.onDestroy$),
                withLatestFrom(parsedData$, (_, parsedData) => parsedData),
            )
            .subscribe(parsedData => {
                store.dispatch({ type: 'IMPORT_DATA', payload: parsedData });
            });

        this.resetFileInputs$ = importRequested$.pipe(map(() => ({})));
    }

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
