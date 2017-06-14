import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';

import { Models as P, PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Action as PreiszuweisungAction } from '../../actions/preiszuweisung';
import { Action as PreismeldestelleAction } from '../../actions/preismeldestelle';
import { Action as PreiserheberAction } from '../../actions/preiserheber';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';
import { PefDialogConfirmDeleteComponent } from '../../components/pef-dialog-confirm-delete/pef-dialog-confirm-delete';
import { PefDialogResetPasswordComponent } from '../../components/pef-dialog-reset-password/pef-dialog-reset-password';
import { CurrentPreiszuweisung } from '../../reducers/preiszuweisung';

@Component({
    selector: 'preiserheber',
    templateUrl: 'preiserheber.html'
})
export class PreiserheberPage implements OnDestroy {
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers).publishReplay(1).refCount();
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).publishReplay(1).refCount();
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen).publishReplay(1).refCount();
    public currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung).publishReplay(1).refCount();
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen).publishReplay(1).refCount();
    public languages$ = this.store.select(fromRoot.getLanguagesList).publishReplay(1).refCount();

    public selectPreiserheber$ = new EventEmitter<string>();
    public createPreiserheber$ = new EventEmitter();
    public cancelPreiserheber$ = new EventEmitter();
    public resetPassword$ = new EventEmitter();
    public savePreiserheber$ = new EventEmitter();
    public deletePreiserheber$ = new EventEmitter();
    public updatePreiserheber$ = new EventEmitter<P.Erheber>();
    public assignPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();
    public unassignPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();

    public isEditing$: Observable<boolean>;
    public isCreating$: Observable<boolean>;
    public isCurrentModified$: Observable<boolean>;
    public preiszuweisungIsInitialized$: Observable<boolean>;
    public resetPasswordDialog$: Observable<any>;
    public cancelEditDialog$: Observable<any>;
    public confirmDeleteDialog$: Observable<any>;

    private subscriptions: Subscription[];

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {
        const confirmDeleteText = 'Die Preiserheber können nicht mehr mit diesem Konto synchronisieren und alle aktuell erfassten Preismeldungen gehen verloren.';
        this.resetPasswordDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogResetPasswordComponent, {}).map(x => x.data));
        this.cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogCancelEditComponent, {}).map(x => x.data));
        this.confirmDeleteDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogConfirmDeleteComponent, { text: confirmDeleteText }).map(x => x.data));

        this.isEditing$ = this.currentPreiserheber$
            .map(pe => !!pe)
            .publishReplay(1).refCount();

        this.isCreating$ = this.currentPreiserheber$
            .map(pe => !!pe && pe.isNew)
            .publishReplay(1).refCount();

        this.isCurrentModified$ = this.currentPreiserheber$
            .map(currentPreiserheber => !!currentPreiserheber && currentPreiserheber.isModified)
            .startWith(null)
            .publishReplay(1).refCount();

        this.preiszuweisungIsInitialized$ = this.currentPreiszuweisung$
            .map(currentPreiszuweisung => !!currentPreiszuweisung)
            .publishReplay(1).refCount();

        const requestSelectPreiserheber$ = this.selectPreiserheber$
            .withLatestFrom(this.isCurrentModified$, (selectedPreiserheber: string, isCurrentModified: boolean) => ({
                selectedPreiserheber,
                isCurrentModified
            }))
            .publishReplay(1).refCount();

        const createPreiserheber$ = this.createPreiserheber$
            .withLatestFrom(this.isCurrentModified$, (_, isCurrentModified: boolean) => isCurrentModified)
            .publishReplay(1).refCount();

        const dismissLoadingScreen$ = this.currentPreiserheber$
            .skip(1) // Skip initial/previous store value, wait for new one
            .combineLatest(this.currentPreiszuweisung$, (currentPreiserheber, currentPreiszuweisung) => ({ currentPreiserheber, currentPreiszuweisung: <CurrentPreiszuweisung>currentPreiszuweisung }))
            .filter(({ currentPreiserheber, currentPreiszuweisung }) => currentPreiserheber != null && currentPreiszuweisung != null)
            .filter(({ currentPreiserheber, currentPreiszuweisung }) => currentPreiserheber.isSaved && !currentPreiszuweisung.isModified || !!currentPreiserheber.error);

        this.subscriptions = [
            requestSelectPreiserheber$
                .filter(x => !x.isCurrentModified)
                .merge(
                requestSelectPreiserheber$
                    .filter(x => x.isCurrentModified)
                    .flatMap(x => this.cancelEditDialog$.map(y => ({ selectedPreiserheber: x.selectedPreiserheber, dialogCode: y })))
                    .filter(x => x.dialogCode === 'THROW_CHANGES')
                )
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_PREISERHEBER', payload: x.selectedPreiserheber } as PreiserheberAction);
                    store.dispatch({ type: 'SELECT_OR_CREATE_PREISZUWEISUNG', payload: x.selectedPreiserheber } as PreiszuweisungAction);
                }),

            createPreiserheber$
                .filter(isModified => !isModified)
                .merge(createPreiserheber$
                    .filter(isModified => isModified)
                    .flatMap(x => this.cancelEditDialog$)
                    .filter(dialogCode => dialogCode === 'THROW_CHANGES')
                )
                .subscribe(x => {
                    store.dispatch({ type: 'CREATE_PREISERHEBER' } as PreiserheberAction);
                    store.dispatch({ type: 'CREATE_PREISZUWEISUNG' } as PreiszuweisungAction);
                }),

            this.cancelPreiserheber$
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_PREISERHEBER', payload: null } as PreiserheberAction);
                    store.dispatch({ type: 'CREATE_PREISZUWEISUNG' } as PreiszuweisungAction);
                }),

            this.updatePreiserheber$
                .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISERHEBER', payload: x })),

            this.assignPreismeldestelle$
                .subscribe((x: P.Preismeldestelle) => {
                    store.dispatch({ type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG', payload: x } as PreiszuweisungAction);
                }),
            this.unassignPreismeldestelle$
                .subscribe((x: P.Preismeldestelle) => {
                    store.dispatch({ type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG', payload: x } as PreiszuweisungAction);
                }),

            this.savePreiserheber$
                .flatMap(password => this.pefDialogService.displayLoading('Daten werden gespeichert, bitte warten...', dismissLoadingScreen$).map(() => password))
                .subscribe(password => store.dispatch({ type: 'SAVE_PREISERHEBER', payload: password } as PreiserheberAction)),

            this.savePreiserheber$
                .withLatestFrom(this.currentPreiszuweisung$, (_, currentPreiszuweisung) => currentPreiszuweisung)
                .filter(currentPreiszuweisung => currentPreiszuweisung.isModified)
                .withLatestFrom(this.currentPreiserheber$, (_, current) => current)
                .subscribe(current => store.dispatch({ type: 'SAVE_PREISZUWEISUNG', payload: current._id } as PreiszuweisungAction)),

            this.deletePreiserheber$
                .withLatestFrom(this.currentPreiserheber$, (_, currentPreiserheber) => currentPreiserheber)
                .flatMap(currentPreiserheber => this.confirmDeleteDialog$.map(y => ({ currentPreiserheber, dialogCode: y })))
                .filter(x => x.dialogCode === 'CONFIRM_DELETE')
                .subscribe(({ currentPreiserheber }) => store.dispatch({ type: 'DELETE_PREISERHEBER', payload: currentPreiserheber } as PreiserheberAction)),

            this.resetPassword$
                .withLatestFrom(this.currentPreiserheber$, (_, currentPreiserheber) => currentPreiserheber)
                .flatMap(currentPreiserheber => this.resetPasswordDialog$.map(y => ({ currentPreiserheber, dialogCode: y })))
                .subscribe(() => store.dispatch({ type: 'CLEAR_RESET_PASSWORD_STATE' } as PreiserheberAction))
        ];
    }

    public ionViewCanLeave(): Promise<boolean> {
        return Observable.merge(
            this.isCurrentModified$
                .filter(modified => modified === false || modified === null)
                .map(() => true),
            this.isCurrentModified$
                .filter(modified => modified === true)
                .flatMap(() => this.cancelEditDialog$)
                .map(dialogCode => dialogCode === 'THROW_CHANGES')
        )
            .take(1)
            .toPromise();
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' } as PreiserheberAction);
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as PreismeldestelleAction);
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' } as PreiszuweisungAction);
    }

    public ngOnDestroy() {
        this.subscriptions.map(s => !s.closed ? s.unsubscribe() : null);
    }
}
