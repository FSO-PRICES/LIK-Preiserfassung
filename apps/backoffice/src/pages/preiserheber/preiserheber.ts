import { AfterViewInit, Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subscription, defer, merge as mergeFn } from 'rxjs';
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
    switchMap,
    take,
    withLatestFrom,
} from 'rxjs/operators';

import { Models as P, PefDialogService } from '@lik-shared';

import { Action as PreiserheberAction } from '../../actions/preiserheber';
import { Action as PreismeldestelleAction } from '../../actions/preismeldestelle';
import { Action as PreiszuweisungAction } from '../../actions/preiszuweisung';
import { blockIfNotLoggedInOrHasNoWritePermission } from '../../common/effects-extensions';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';
import { PefDialogConfirmDeleteComponent } from '../../components/pef-dialog-confirm-delete/pef-dialog-confirm-delete';
import { PefDialogResetPasswordComponent } from '../../components/pef-dialog-reset-password/pef-dialog-reset-password';
import { CanDeactivate } from '../../guards/can-deactivate-guard';
import * as fromRoot from '../../reducers';
import { CurrentPreiszuweisung } from '../../reducers/preiszuweisung';

@Component({
    selector: 'preiserheber',
    templateUrl: 'preiserheber.html',
    styleUrls: ['preiserheber.scss'],
})
export class PreiserheberPage implements OnDestroy, AfterViewInit, CanDeactivate {
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers).pipe(publishReplay(1), refCount());
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).pipe(publishReplay(1), refCount());
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen).pipe(publishReplay(1), refCount());
    public currentPreiszuweisung$ = this.store
        .select(fromRoot.getCurrentPreiszuweisung)
        .pipe(publishReplay(1), refCount());
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen).pipe(publishReplay(1), refCount());
    public erhebungsregionen$ = this.store.select(fromRoot.getErhebungsregionen).pipe(publishReplay(1), refCount());
    public languages$ = this.store.select(fromRoot.getLanguagesList).pipe(publishReplay(1), refCount());
    public hasWritePermission$ = this.store.select(fromRoot.hasWritePermission);

    public selectPreiserheber$ = new EventEmitter<string>();
    public createPreiserheber$ = new EventEmitter();
    public cancelPreiserheber$ = new EventEmitter();
    public resetPassword$ = new EventEmitter();
    public savePreiserheber$ = new EventEmitter();
    public updatePreiserheber$ = new EventEmitter<P.Erheber>();
    public assignPreismeldestelle$ = new EventEmitter<P.Preismeldestelle[]>();
    public unassignPreismeldestelle$ = new EventEmitter<P.Preismeldestelle[]>();

    public isEditing$: Observable<boolean>;
    public isCreating$: Observable<boolean>;
    public isCurrentModified$: Observable<boolean>;
    public preiszuweisungIsInitialized$: Observable<boolean>;
    private cancelEditDialog$ = defer(() =>
        this.pefDialogService.displayDialog(PefDialogCancelEditComponent, { disableClose: true }),
    );
    public deleteClicked$ = new EventEmitter<Event>();

    private subscriptions: Subscription[] = [];

    constructor(
        private store: Store<fromRoot.AppState>,
        private pefDialogService: PefDialogService,
        private translate: TranslateService,
    ) {
        const resetPasswordDialog$ = defer(() =>
            this.pefDialogService.displayDialog(PefDialogResetPasswordComponent, { disableClose: true }),
        );

        const confirmDeleteDialog$ = defer(() =>
            this.pefDialogService.displayDialog(PefDialogConfirmDeleteComponent, {
                data: { message: this.translate.instant('preiserheber.loeschen_warnung') },
                disableClose: true,
            }),
        );

        this.isEditing$ = this.currentPreiserheber$.pipe(
            map((pe) => !!pe),
            publishReplay(1),
            refCount(),
        );

        this.isCreating$ = this.currentPreiserheber$.pipe(
            map((pe) => !!pe && pe.isNew),
            publishReplay(1),
            refCount(),
        );

        this.isCurrentModified$ = this.currentPreiserheber$.pipe(
            map((currentPreiserheber) => !!currentPreiserheber && currentPreiserheber.isModified),
            startWith(null),
            publishReplay(1),
            refCount(),
        );

        this.preiszuweisungIsInitialized$ = this.currentPreiszuweisung$.pipe(
            map((currentPreiszuweisung) => !!currentPreiszuweisung),
            publishReplay(1),
            refCount(),
        );

        const requestSelectPreiserheber$ = this.selectPreiserheber$.pipe(
            withLatestFrom(this.isCurrentModified$, (selectedPreiserheber: string, isCurrentModified: boolean) => ({
                selectedPreiserheber,
                isCurrentModified,
            })),
            publishReplay(1),
            refCount(),
        );

        const createPreiserheber$ = this.createPreiserheber$.pipe(
            withLatestFrom(this.isCurrentModified$, (_, isCurrentModified: boolean) => isCurrentModified),
            publishReplay(1),
            refCount(),
        );

        const dismissLoadingScreen$ = this.currentPreiserheber$.pipe(
            skip(1), // Skip initial/previous store value, wait for new one
            combineLatest(this.currentPreiszuweisung$, (currentPreiserheber, currentPreiszuweisung) => ({
                currentPreiserheber,
                currentPreiszuweisung: <CurrentPreiszuweisung>currentPreiszuweisung,
            })),
            filter(
                ({ currentPreiserheber, currentPreiszuweisung }) =>
                    currentPreiserheber != null && currentPreiszuweisung != null,
            ),
            filter(
                ({ currentPreiserheber, currentPreiszuweisung }) =>
                    (currentPreiserheber.isSaved && !currentPreiszuweisung.isModified) || !!currentPreiserheber.error,
            ),
        );

        this.subscriptions = [
            requestSelectPreiserheber$
                .pipe(
                    filter((x) => !x.isCurrentModified),
                    merge(
                        requestSelectPreiserheber$.pipe(
                            filter((x) => x.isCurrentModified),
                            flatMap((x) =>
                                this.cancelEditDialog$.pipe(
                                    map((y) => ({
                                        selectedPreiserheber: x.selectedPreiserheber,
                                        dialogCode: y,
                                    })),
                                ),
                            ),
                            filter((x) => x.dialogCode === 'THROW_CHANGES'),
                        ),
                    ),
                )
                .subscribe((x) => {
                    store.dispatch({
                        type: 'SELECT_PREISERHEBER',
                        payload: x.selectedPreiserheber,
                    } as PreiserheberAction);
                    store.dispatch({
                        type: 'SELECT_OR_CREATE_PREISZUWEISUNG',
                        payload: x.selectedPreiserheber,
                    } as PreiszuweisungAction);
                }),

            createPreiserheber$
                .pipe(
                    filter((isModified) => !isModified),
                    merge(
                        createPreiserheber$.pipe(
                            filter((isModified) => isModified),
                            flatMap(() => this.cancelEditDialog$),
                            filter((dialogCode) => dialogCode === 'THROW_CHANGES'),
                        ),
                    ),
                )
                .subscribe((x) => {
                    store.dispatch({ type: 'CREATE_PREISERHEBER' } as PreiserheberAction);
                    store.dispatch({ type: 'CREATE_PREISZUWEISUNG' } as PreiszuweisungAction);
                }),

            mergeFn(
                this.cancelPreiserheber$.pipe(
                    withLatestFrom(this.isCurrentModified$, (_, isCurrentModified) => isCurrentModified),
                    filter((isModified) => !isModified),
                ),
                this.cancelPreiserheber$.pipe(
                    withLatestFrom(this.isCurrentModified$, (_, isCurrentModified) => isCurrentModified),
                    filter((isModified) => isModified),
                    switchMap(() => this.cancelEditDialog$),
                    filter((dialogCode) => dialogCode === 'THROW_CHANGES'),
                ),
            ).subscribe((x) => {
                store.dispatch({ type: 'SELECT_PREISERHEBER', payload: null } as PreiserheberAction);
                store.dispatch({ type: 'CREATE_PREISZUWEISUNG' } as PreiszuweisungAction);
            }),

            this.updatePreiserheber$.subscribe((x) =>
                store.dispatch({ type: 'UPDATE_CURRENT_PREISERHEBER', payload: x }),
            ),

            this.assignPreismeldestelle$.subscribe((x: P.Preismeldestelle[]) => {
                store.dispatch({ type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG', payload: x } as PreiszuweisungAction);
            }),
            this.unassignPreismeldestelle$.subscribe((x: P.Preismeldestelle[]) => {
                store.dispatch({ type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG', payload: x } as PreiszuweisungAction);
            }),

            this.savePreiserheber$
                .pipe(
                    blockIfNotLoggedInOrHasNoWritePermission(this.store),
                    flatMap((password) =>
                        this.pefDialogService
                            .displayLoading(translate.instant('label.standard.wird_gespeichert_bitte_warten'), {
                                requestDismiss$: dismissLoadingScreen$,
                            })
                            .pipe(map(() => password)),
                    ),
                )
                .subscribe((password) =>
                    store.dispatch({ type: 'SAVE_PREISERHEBER', payload: password } as PreiserheberAction),
                ),

            this.deleteClicked$
                .pipe(
                    withLatestFrom(this.currentPreiserheber$, (_, currentPreiserheber) => currentPreiserheber),
                    flatMap((currentPreiserheber) =>
                        confirmDeleteDialog$.pipe(map((y) => ({ currentPreiserheber, dialogCode: y }))),
                    ),
                    filter((x) => x.dialogCode === 'CONFIRM_DELETE'),
                )
                .subscribe(({ currentPreiserheber }) =>
                    store.dispatch({ type: 'DELETE_PREISERHEBER', payload: currentPreiserheber } as PreiserheberAction),
                ),

            this.resetPassword$
                .pipe(
                    withLatestFrom(this.currentPreiserheber$, (_, currentPreiserheber) => currentPreiserheber),
                    flatMap((currentPreiserheber) =>
                        resetPasswordDialog$.pipe(map((y) => ({ currentPreiserheber, dialogCode: y }))),
                    ),
                )
                .subscribe(() => store.dispatch({ type: 'CLEAR_RESET_PASSWORD_STATE' } as PreiserheberAction)),
        ];
    }

    public canDeactivate() {
        return mergeFn(
            this.isCurrentModified$.pipe(
                filter((modified) => modified === false || modified === null),
                map(() => true),
            ),
            this.isCurrentModified$.pipe(
                filter((modified) => modified === true),
                switchMap(() => this.cancelEditDialog$),
                map((dialogCode) => dialogCode === 'THROW_CHANGES'),
            ),
        ).pipe(take(1));
    }

    ngAfterViewInit() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' } as PreiserheberAction);
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as PreismeldestelleAction);
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' } as PreiszuweisungAction);
    }

    ngOnDestroy() {
        this.store.dispatch({ type: 'SELECT_PREISERHEBER', payload: null } as PreiserheberAction);
        this.subscriptions.filter((s) => !!s && !s.closed).forEach((s) => s.unsubscribe());
    }
}
