import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Loading, LoadingController } from 'ionic-angular';

import { Models as P, PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Action as PreismeldestelleAction } from '../../actions/preismeldestelle';
import { Action as RegionAction } from '../../actions/region';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';

@Component({
    selector: 'preismeldestelle',
    templateUrl: 'preismeldestelle.html'
})
export class PreismeldestellePage implements OnDestroy {
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle).publishReplay(1).refCount();
    public languages$ = this.store.select(fromRoot.getLanguagesList);
    public regionen$ = this.store.select(fromRoot.getRegionen);
    public selectPreismeldestelle$ = new EventEmitter<string>();
    public cancelPreismeldestelle$ = new EventEmitter();
    public savePreismeldestelle$ = new EventEmitter();
    public updatePreismeldestelle$ = new EventEmitter<P.Erheber>();

    public isEditing$: Observable<boolean>;
    public isCurrentModified$: Observable<boolean>;
    public cancelEditDialog$: Observable<any>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController, private pefDialogService: PefDialogService) {
        this.cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogCancelEditComponent, {}).map(x => x.data));

        this.isEditing$ = this.currentPreismeldestelle$
            .map(x => !!x && !!x._id)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        this.isCurrentModified$ = this.currentPreismeldestelle$
            .map(currentPreismeldestelle => !!currentPreismeldestelle && currentPreismeldestelle.isModified)
            .startWith(null)
            .publishReplay(1).refCount();

        const requestSelectPreismeldestelle$ = this.selectPreismeldestelle$
            .withLatestFrom(this.isCurrentModified$, (selectedPreismeldestelle: string, isCurrentModified: boolean) => ({
                selectedPreismeldestelle,
                isCurrentModified
            }))
            .publishReplay(1).refCount();

        this.subscriptions = [
            requestSelectPreismeldestelle$
                .filter(x => !x.isCurrentModified)
                .merge(requestSelectPreismeldestelle$
                    .filter(x => x.isCurrentModified)
                    .flatMap(x => this.cancelEditDialog$.map(y => ({ selectedPreismeldestelle: x.selectedPreismeldestelle, dialogCode: y })))
                    .filter(x => x.dialogCode === 'THROW_CHANGES'))
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: x.selectedPreismeldestelle });
                }),

            this.cancelPreismeldestelle$
                .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: null } as PreismeldestelleAction)),

            this.updatePreismeldestelle$
                .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: x } as PreismeldestelleAction)),

            this.savePreismeldestelle$
                .subscribe(x => {
                    this.presentLoadingScreen().then(() => store.dispatch({ type: 'SAVE_PREISMELDESTELLE' } as PreismeldestelleAction));
                }),

            this.currentPreismeldestelle$
                .filter(pms => pms != null && pms.isSaved)
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
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as PreismeldestelleAction);
        this.store.dispatch({ type: 'REGION_LOAD' } as RegionAction);
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

        return this.loader.present();
    }

    private dismissLoadingScreen() {
        if (!!this.loader) {
            this.loader.dismiss();
        }
    }
}
