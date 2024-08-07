import { AfterViewInit, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, defer } from 'rxjs';
import {
    combineLatest,
    distinctUntilChanged,
    filter,
    flatMap,
    map,
    merge,
    publishReplay,
    refCount,
    skip,
    startWith,
    take,
    withLatestFrom,
} from 'rxjs/operators';

import { Models as P, PefDialogService } from '@lik-shared';

import { Action as PreiserheberAction } from '../../actions/preiserheber';
import { Action as PreismeldestelleAction } from '../../actions/preismeldestelle';
import { Action as PreiszuweisungAction } from '../../actions/preiszuweisung';
import { blockIfNotLoggedInOrHasNoWritePermission } from '../../common/effects-extensions';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';
import { CanDeactivate } from '../../guards/can-deactivate-guard';
import * as fromRoot from '../../reducers';

@Component({
    selector: 'preismeldestelle',
    templateUrl: 'preismeldestelle.html',
    styleUrls: ['preismeldestelle.scss'],
})
export class PreismeldestellePage implements OnDestroy, AfterViewInit, CanDeactivate {
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public preiserheber$ = this.store.select(fromRoot.getPreiserhebers);
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen).pipe(publishReplay(1), refCount());
    public currentPreismeldestelle$ = this.store
        .select(fromRoot.getCurrentPreismeldestelle)
        .pipe(publishReplay(1), refCount());
    public languages$ = this.store.select(fromRoot.getLanguagesList);
    public erhebungsregionen$ = this.store.select(fromRoot.getErhebungsregionen).pipe(publishReplay(1), refCount());
    public hasWritePermission$ = this.store.select(fromRoot.hasWritePermission);

    public selectPreismeldestelle$ = new EventEmitter<string>();
    public cancelPreismeldestelle$ = new EventEmitter();
    public savePreismeldestelle$ = new EventEmitter();
    public updatePreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();

    public isEditing$: Observable<boolean>;
    public isCurrentModified$: Observable<boolean>;
    public cancelEditDialog$ = defer(() =>
        this.pefDialogService.displayDialog(PefDialogCancelEditComponent, { disableClose: true }),
    );

    public preiserheberMap$: Observable<{ [pmsNummer: string]: P.Erheber }>;

    private subscriptions: Subscription[] = [];

    constructor(
        private store: Store<fromRoot.AppState>,
        private pefDialogService: PefDialogService,
        translate: TranslateService,
    ) {
        this.isEditing$ = this.currentPreismeldestelle$.pipe(
            map((x) => !!x && !!x._id),
            distinctUntilChanged(),
            publishReplay(1),
            refCount(),
        );

        this.isCurrentModified$ = this.currentPreismeldestelle$.pipe(
            map((currentPreismeldestelle) => !!currentPreismeldestelle && currentPreismeldestelle.isModified),
            startWith(null),
            publishReplay(1),
            refCount(),
        );

        this.preiserheberMap$ = this.preiszuweisungen$.pipe(
            withLatestFrom(this.preiserheber$),
            map(([pzs, pes]) => {
                const peMap: { [pmsNummer: string]: P.Erheber } = {};
                pzs.map((pz) => {
                    return pz.preismeldestellenNummern.forEach(
                        (pmsNummer) => (peMap[pmsNummer] = pes.find((pe) => pe._id === pz.preiserheberId)),
                    );
                });
                return peMap;
            }),
        );

        const requestSelectPreismeldestelle$ = this.selectPreismeldestelle$.pipe(
            withLatestFrom(this.isCurrentModified$, (selectedPreismeldestelle: string, isCurrentModified: boolean) => ({
                selectedPreismeldestelle,
                isCurrentModified,
            })),
            publishReplay(1),
            refCount(),
        );

        this.subscriptions = [
            requestSelectPreismeldestelle$
                .pipe(
                    filter((x) => !x.isCurrentModified),
                    merge(
                        requestSelectPreismeldestelle$.pipe(
                            filter((x) => x.isCurrentModified),
                            flatMap((x) =>
                                this.cancelEditDialog$.pipe(
                                    map((y) => ({
                                        selectedPreismeldestelle: x.selectedPreismeldestelle,
                                        dialogCode: y,
                                    })),
                                ),
                            ),
                            filter((x) => x.dialogCode === 'THROW_CHANGES'),
                        ),
                    ),
                )
                .subscribe((x) => {
                    store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: x.selectedPreismeldestelle });
                }),

            this.cancelPreismeldestelle$.subscribe((x) =>
                this.store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: null } as PreismeldestelleAction),
            ),

            this.updatePreismeldestelle$.subscribe((x) =>
                store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: x } as PreismeldestelleAction),
            ),

            this.savePreismeldestelle$
                .pipe(
                    blockIfNotLoggedInOrHasNoWritePermission(this.store),
                    flatMap(() =>
                        this.pefDialogService.displayLoading(
                            translate.instant('label.standard.wird_gespeichert_bitte_warten'),
                            {
                                requestDismiss$: this.currentPreismeldestelle$.pipe(
                                    skip(1),
                                    filter((pms) => pms != null && pms.isSaved),
                                ),
                            },
                        ),
                    ),
                )
                .subscribe((x) => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' } as PreismeldestelleAction)),
        ];
    }

    public canDeactivate() {
        return this.isCurrentModified$
            .pipe(
                filter((modified) => modified === false),
                map(() => true),
            )
            .pipe(
                merge(
                    this.isCurrentModified$.pipe(
                        filter((modified) => modified === true),
                        combineLatest(this.cancelEditDialog$, (_, dialogCode) => dialogCode),
                        map((dialogCode) => dialogCode === 'THROW_CHANGES'),
                    ),
                ),
            )
            .pipe(take(1));
    }

    ngAfterViewInit() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as PreismeldestelleAction);
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' } as PreiserheberAction);
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' } as PreiszuweisungAction);
    }

    ngOnDestroy() {
        this.store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: null } as PreismeldestelleAction);
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }
}
