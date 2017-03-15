import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Loading, LoadingController } from 'ionic-angular';

import { Models as P, PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Actions as RegionAction } from '../../actions/region';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';
import { CurrentRegion } from '../../reducers/region';

@Component({
    selector: 'region',
    templateUrl: 'region.html'
})
export class RegionPage implements OnDestroy {
    public regionen$ = this.store.select(fromRoot.getRegionen);
    public currentRegion$ = this.store.select(fromRoot.getCurrentRegion).publishReplay(1).refCount();
    public createRegion$ = new EventEmitter();
    public selectRegion$ = new EventEmitter<string>();
    public cancelRegion$ = new EventEmitter();
    public saveRegion$ = new EventEmitter();
    public updateRegion$ = new EventEmitter<P.Erheber>();
    public isEditing$: Observable<boolean>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController, private pefDialogService: PefDialogService) {
        const cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogCancelEditComponent, {}).map(x => x.data));

        this.isEditing$ = this.currentRegion$
            .map(x => !!x && !!x._id)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        const requestSelectRegion$ = this.selectRegion$
            .withLatestFrom(this.currentRegion$.startWith(null), (selectedRegion: string, currentRegion: CurrentRegion) => ({
                selectedRegion,
                currentRegion,
                isCurrentModified: !!currentRegion && currentRegion.isModified
            }))
            .publishReplay(1).refCount();

        this.subscriptions = [
            requestSelectRegion$
                .filter(x => !x.isCurrentModified)
                .merge(requestSelectRegion$
                    .filter(x => x.isCurrentModified)
                    .flatMap(x => cancelEditDialog$.map(y => ({ selectedRegion: x.selectedRegion, dialogCode: y })))
                    .filter(x => x.dialogCode === 'THROW_CHANGES'))
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_REGION', payload: x.selectedRegion });
                }),

            this.createRegion$
                .subscribe(() => {
                    store.dispatch(<RegionAction>{ type: 'CREATE_REGION' });
                }),

            this.cancelRegion$
                .subscribe(x => this.store.dispatch(<RegionAction>{ type: 'SELECT_REGION', payload: null })),

            this.updateRegion$
                .subscribe(x => store.dispatch(<RegionAction>{ type: 'UPDATE_CURRENT_REGION', payload: x })),

            this.saveRegion$
                .subscribe(x => {
                    // this.presentLoadingScreen();
                    store.dispatch(<RegionAction>{ type: 'SAVE_REGION', payload: x.createNew });
                }),

            // this.currentRegion$
            //     .filter(pms => pms != null && pms.isSaved)
            //     .subscribe(() => this.dismissLoadingScreen())
        ];
    }

    public ionViewDidEnter() {
        this.store.dispatch(<RegionAction>{ type: 'REGION_LOAD' });
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
