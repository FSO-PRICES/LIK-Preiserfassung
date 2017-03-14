import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Loading, LoadingController } from 'ionic-angular';

import { Models as P, PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Actions as PreismeldestelleAction } from '../../actions/preismeldestelle';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';
import { CurrentPreismeldestelle } from '../../reducers/preismeldestelle';

@Component({
    selector: 'preismeldestelle',
    templateUrl: 'preismeldestelle.html'
})
export class PreismeldestellePage implements OnDestroy {
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public currentPreismeldestelle$ = this.store.select(fromRoot.getCurrentPreismeldestelle).publishReplay(1).refCount();
    public createPreismeldestelle$ = new EventEmitter();
    public selectPreismeldestelle$ = new EventEmitter<string>();
    public cancelPreismeldestelle$ = new EventEmitter();
    public savePreismeldestelle$ = new EventEmitter();
    public updatePreismeldestelle$ = new EventEmitter<P.Erheber>();
    public isEditing$: Observable<boolean>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController, private pefDialogService: PefDialogService) {
        const cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogCancelEditComponent, {}).map(x => x.data));

        this.isEditing$ = this.currentPreismeldestelle$
            .map(x => !!x && !!x._id)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        const requestSelectPreismeldestelle$ = this.selectPreismeldestelle$
            .withLatestFrom(this.currentPreismeldestelle$.startWith(null), (selectedPreismeldestelle: string, currentPreismeldestelle: CurrentPreismeldestelle) => ({
                selectedPreismeldestelle,
                currentPreismeldestelle,
                isCurrentModified: !!currentPreismeldestelle && currentPreismeldestelle.isModified
            }))
            .publishReplay(1).refCount();

        this.subscriptions = [
            requestSelectPreismeldestelle$
                .filter(x => !x.isCurrentModified)
                .merge(requestSelectPreismeldestelle$
                    .filter(x => x.isCurrentModified)
                    .flatMap(x => cancelEditDialog$.map(y => ({ selectedPreismeldestelle: x.selectedPreismeldestelle, dialogCode: y })))
                    .filter(x => x.dialogCode === 'THROW_CHANGES'))
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_PREISMELDESTELLE', payload: x.selectedPreismeldestelle });
                }),

            this.createPreismeldestelle$
                .subscribe(() => {
                    store.dispatch(<PreismeldestelleAction>{ type: 'CREATE_PREISMELDESTELLE' });
                }),

            this.cancelPreismeldestelle$
                .subscribe(x => this.store.dispatch(<PreismeldestelleAction>{ type: 'SELECT_PREISMELDESTELLE', payload: null })),

            this.updatePreismeldestelle$
                .subscribe(x => store.dispatch(<PreismeldestelleAction>{ type: 'UPDATE_CURRENT_PREISMELDESTELLE', payload: x })),

            this.savePreismeldestelle$
                .subscribe(x => {
                    this.presentLoadingScreen();
                    store.dispatch(<PreismeldestelleAction>{ type: 'SAVE_PREISMELDESTELLE' });
                }),

            this.currentPreismeldestelle$
                .filter(pms => pms != null && pms.isSaved)
                .subscribe(() => this.dismissLoadingScreen())
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch(<PreismeldestelleAction>{ type: 'PREISMELDESTELLE_LOAD' });
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
