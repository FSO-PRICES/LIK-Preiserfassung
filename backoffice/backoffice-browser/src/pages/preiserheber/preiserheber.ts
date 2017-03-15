import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { LoadingController, Loading } from 'ionic-angular';
import { Subscription, Observable } from 'rxjs';

import { Models as P, PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Actions as PreiszuweisungAction } from '../../actions/preiszuweisung';
import { Actions as PreiserheberAction } from '../../actions/preiserheber';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';
import { SettingsLoadedService } from '../../common/settings-loaded-service';

@Component({
    selector: 'preiserheber',
    templateUrl: 'preiserheber.html'
})
export class PreiserheberPage implements OnDestroy {
    public preiserhebers$ = this.store.select(fromRoot.getPreiserhebers);
    public currentPreiserheber$ = this.store.select(fromRoot.getCurrentPreiserheber).publishReplay(1).refCount();
    public preiszuweisungen$ = this.store.select(fromRoot.getPreiszuweisungen);
    public currentPreiszuweisung$ = this.store.select(fromRoot.getCurrentPreiszuweisung).publishReplay(1).refCount();
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);

    public selectPreiserheber$ = new EventEmitter<string>();
    public createPreiserheber$ = new EventEmitter();
    public cancelPreiserheber$ = new EventEmitter();
    public savePreiserheber$ = new EventEmitter();
    public updatePreiserheber$ = new EventEmitter<P.Erheber>();
    public assignPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();
    public unassignPreismeldestelle$ = new EventEmitter<P.Preismeldestelle>();

    public isEditing$: Observable<boolean>;
    public isCurrentModified$: Observable<boolean>;
    public cancelEditDialog$: Observable<any>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController, private pefDialogService: PefDialogService, private settingsLoadedService: SettingsLoadedService) {
        this.cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogCancelEditComponent, {}).map(x => x.data));

        this.isEditing$ = this.currentPreiserheber$
            .map(pe => pe != null)
            .publishReplay(1).refCount();

        this.isCurrentModified$ = this.currentPreiserheber$
            .map(currentPreiserheber => !!currentPreiserheber && currentPreiserheber.isModified)
            .startWith(null)
            .publishReplay(1).refCount();

        const requestSelectPreiserheber$ = this.selectPreiserheber$
            .withLatestFrom(this.isCurrentModified$, (selectedPreiserheber: string, isCurrentModified: boolean) => ({
                selectedPreiserheber,
                isCurrentModified
            }))
            .publishReplay(1).refCount();

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
                    store.dispatch({ type: 'SELECT_PREISERHEBER', payload: x.selectedPreiserheber });
                    store.dispatch(<PreiszuweisungAction>{ type: 'SELECT_OR_CREATE_PREISZUWEISUNG', payload: x.selectedPreiserheber });
                }),

            this.createPreiserheber$
                .subscribe(() => {
                    store.dispatch(<PreiserheberAction>{ type: 'CREATE_PREISERHEBER' });
                    store.dispatch(<PreiszuweisungAction>{ type: 'CREATE_PREISZUWEISUNG' });
                }),

            this.cancelPreiserheber$
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_PREISERHEBER', payload: null });
                    store.dispatch(<PreiszuweisungAction>{ type: 'CREATE_PREISZUWEISUNG' });
                }),

            this.updatePreiserheber$
                .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISERHEBER', payload: x })),

            this.assignPreismeldestelle$
                .subscribe((x: P.Preismeldestelle) => {
                    store.dispatch(<PreiszuweisungAction>{ type: 'ASSIGN_TO_CURRENT_PREISZUWEISUNG', payload: x });
                }),
            this.unassignPreismeldestelle$
                .subscribe((x: P.Preismeldestelle) => {
                    store.dispatch(<PreiszuweisungAction>{ type: 'UNASSIGN_FROM_CURRENT_PREISZUWEISUNG', payload: x });
                }),

            this.savePreiserheber$
                .withLatestFrom(this.currentPreiserheber$, (password, current) => ({ password, current: <P.Erheber>current }))
                .subscribe(({ password, current }) => {
                    this.presentLoadingScreen();
                    store.dispatch({ type: 'SAVE_PREISERHEBER', payload: password });
                    store.dispatch(<PreiszuweisungAction>{ type: 'SAVE_PREISZUWEISUNG', payload: current._id });
                }),

            this.currentPreiserheber$
                .filter(pe => pe != null && pe.isSaved)
                .subscribe(() => this.dismissLoadingScreen())
        ];
    }

    public ionViewCanLeave(): Promise<boolean> {
        return Observable.merge(
                this.isCurrentModified$
                    .filter(modified => modified === false)
                    .map(() => true),
                this.isCurrentModified$
                    .filter(modified => modified === true)
                    .combineLatest(this.cancelEditDialog$, (modified, dialogCode) => dialogCode)
                    .map(dialogCode => dialogCode === 'THROW_CHANGES')
            )
            .take(1)
            .toPromise();
    }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'PREISERHEBER_LOAD' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' });
        this.store.dispatch({ type: 'PREISZUWEISUNG_LOAD' });
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

    public ionViewCanEnter() {
        return this.settingsLoadedService.areSettingsLoaded();
    }
}
