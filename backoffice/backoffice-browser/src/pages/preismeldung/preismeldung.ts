import { Component, OnDestroy, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';
import { Loading, LoadingController } from 'ionic-angular';

import { Models as P, PefDialogService } from 'lik-shared';

import * as fromRoot from '../../reducers';
import * as preismeldung from '../../actions/preismeldung';
import * as preismeldestelle from '../../actions/preismeldestelle';

import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';

@Component({
    selector: 'preismeldung',
    templateUrl: 'preismeldung.html'
})
export class PreismeldungPage implements OnDestroy {
    public preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung).publishReplay(1).refCount();

    public selectPreismeldung$ = new EventEmitter<string>();
    public cancelPreismeldung$ = new EventEmitter();
    public savePreismeldung$ = new EventEmitter();
    public updatePreismeldung$ = new EventEmitter<P.Erheber>();

    public selectPreismeldestelleNummer$ = new EventEmitter<string>();
    public isEditing$: Observable<boolean>;
    public isCurrentModified$: Observable<boolean>;
    public cancelEditDialog$: Observable<any>;

    private subscriptions: Subscription[];
    private loader: Loading;

    constructor(private store: Store<fromRoot.AppState>, private loadingCtrl: LoadingController, private pefDialogService: PefDialogService) {
        this.cancelEditDialog$ = Observable.defer(() => pefDialogService.displayDialog(PefDialogCancelEditComponent, {}).map(x => x.data));

        this.isEditing$ = this.currentPreismeldung$
            .map(x => !!x && !!x._id)
            .distinctUntilChanged()
            .publishReplay(1).refCount();

        this.isCurrentModified$ = this.currentPreismeldung$
            .map(currentPreismeldung => !!currentPreismeldung && currentPreismeldung.isModified)
            .startWith(null)
            .publishReplay(1).refCount();

        const requestSelectPreismeldung$ = this.selectPreismeldung$
            .withLatestFrom(this.isCurrentModified$, (selectedPreismeldung: string, isCurrentModified: boolean) => ({
                selectedPreismeldung,
                isCurrentModified
            }))
            .publishReplay(1).refCount();

        this.subscriptions = [
            this.selectPreismeldestelleNummer$.subscribe(pmsNummer => {
                this.store.dispatch({ type: 'PREISMELDUNG_LOAD_FOR_PMS', payload: pmsNummer } as preismeldung.Action);
            }),

            requestSelectPreismeldung$
                .filter(x => !x.isCurrentModified)
                .merge(requestSelectPreismeldung$
                    .filter(x => x.isCurrentModified)
                    .flatMap(x => this.cancelEditDialog$.map(y => ({ selectedPreismeldung: x.selectedPreismeldung, dialogCode: y })))
                    .filter(x => x.dialogCode === 'THROW_CHANGES'))
                .subscribe(x => {
                    store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x.selectedPreismeldung } as preismeldung.Action);
                }),

            this.cancelPreismeldung$
                .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null } as preismeldung.Action)),

            this.updatePreismeldung$
                .subscribe(x => store.dispatch({ type: 'UPDATE_CURRENT_PREISMELDUNG', payload: x } as preismeldung.Action)),

            this.savePreismeldung$
                .subscribe(x => {
                    this.presentLoadingScreen().then(() => store.dispatch({ type: 'SAVE_PREISMELDUNG' } as preismeldung.Action));
                }),

            this.currentPreismeldung$
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
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as preismeldestelle.Action);
    }

    public ngOnDestroy() {
        this.store.dispatch({ type: 'CLEAR_PREISMELDUNG_FOR_PMS' } as preismeldung.Action);
        this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null } as preismeldung.Action);
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
