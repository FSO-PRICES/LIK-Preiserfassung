import { Component, EventEmitter, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { Loading, LoadingController } from 'ionic-angular';

import { Models as P, PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import { Action as RegionAction } from '../../actions/region';
import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';

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
    public isCurrentModified$: Observable<boolean>;
    public cancelEditDialog$: Observable<any>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController, private pefDialogService: PefDialogService) {
        this.cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogCancelEditComponent, {}).map(x => x.data));

        this.isEditing$ = this.currentRegion$
            .map(x => !!x && !!x._id)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        this.isCurrentModified$ = this.currentRegion$
            .map(currentRegion => !!currentRegion && currentRegion.isModified)
            .startWith(null)
            .publishReplay(1).refCount();

        const requestSelectRegion$ = this.selectRegion$
            .withLatestFrom(this.isCurrentModified$, (selectedRegion: string, isCurrentModified: boolean) => ({
                selectedRegion,
                isCurrentModified
            }))
            .publishReplay(1).refCount();

        const requestCreateRegion$ = this.createRegion$
            .withLatestFrom(this.isCurrentModified$, (_, isCurrentModified: boolean) => isCurrentModified)
            .publishReplay(1).refCount();

        this.subscriptions = [
            requestSelectRegion$
                .filter(x => !x.isCurrentModified)
                .merge(requestSelectRegion$
                    .filter(x => x.isCurrentModified)
                    .flatMap(x => this.cancelEditDialog$.map(y => ({ selectedRegion: x.selectedRegion, dialogCode: y })))
                    .filter(x => x.dialogCode === 'THROW_CHANGES'))
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_REGION', payload: x.selectedRegion });
                }),

            requestCreateRegion$
                .filter(isCurrentModified => !isCurrentModified)
                .merge(requestCreateRegion$
                    .filter(isCurrentModified => isCurrentModified)
                    .flatMap(x => this.cancelEditDialog$)
                    .filter(dialogCode => dialogCode === 'THROW_CHANGES'))
                .subscribe(() => {
                    store.dispatch({ type: 'CREATE_REGION' } as RegionAction);
                }),

            this.cancelRegion$
                .subscribe(x => this.store.dispatch({ type: 'SELECT_REGION', payload: null } as RegionAction)),

            this.updateRegion$
                .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_REGION', payload: x } as RegionAction)),

            this.saveRegion$
                .subscribe(x => {
                    this.presentLoadingScreen().then(() => store.dispatch({ type: 'SAVE_REGION' } as RegionAction));
                }),

            this.currentRegion$
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