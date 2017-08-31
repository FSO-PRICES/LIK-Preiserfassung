import { Component, OnDestroy, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription, Observable } from 'rxjs';

import { PefDialogService } from 'lik-shared';
import * as P from '../../common-models';

import * as fromRoot from '../../reducers';
import * as preismeldung from '../../actions/preismeldung';
import * as preismeldestelle from '../../actions/preismeldestelle';

import { PefDialogCancelEditComponent } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit';
import { IonicPage } from 'ionic-angular';

@IonicPage({
    segment: 'pm'
})
@Component({
    selector: 'preismeldung',
    templateUrl: 'preismeldung.html'
})
export class PreismeldungPage implements OnDestroy {
    public preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);
    public preismeldestellen$ = this.store.select(fromRoot.getPreismeldestellen);
    public warenkorb$ = this.store.select(fromRoot.getWarenkorbState);
    public currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung).publishReplay(1).refCount();

    public updatePreismeldungPreis$ = new EventEmitter<P.PreismeldungPricePayload>();
    public selectPreismeldung$ = new EventEmitter<string>();
    // public cancelPreismeldung$ = new EventEmitter();
    // public savePreismeldung$ = new EventEmitter();
    // public updatePreismeldung$ = new EventEmitter<P.Erheber>();

    public selectPreismeldestelleNummer$ = new EventEmitter<string>();
    // public isEditing$: Observable<boolean>;
    // public isCurrentModified$: Observable<boolean>;
    // public cancelEditDialog$: Observable<any>;

    public preismeldestelle$ = Observable.of({ erhebungsart: '000100' });
    public requestPreismeldungSave$ = Observable.never();
    public requestPreismeldungQuickEqual$ = Observable.never();

    public duplicatePreismeldung$ = new EventEmitter();
    public requestSelectNextPreismeldung$ = new EventEmitter();
    public requestThrowChanges$ = new EventEmitter();
    public save$ = new EventEmitter<P.SavePreismeldungPriceSaveAction>();

    public selectTab$ = new EventEmitter<string>();
    public selectedTab$: Observable<string>;

    private subscriptions: Subscription[] = [];

    constructor(private store: Store<fromRoot.AppState>, private pefDialogService: PefDialogService) {

        this.selectedTab$ = this.selectTab$
            .merge(this.save$.filter(x => x.type === 'NO_SAVE_NAVIGATE' || x.type === 'SAVE_AND_NAVIGATE_TAB').map((x: P.SavePreismeldungPriceSaveActionNoSaveNavigate | P.SavePreismeldungPriceSaveActionSaveNavigateTab) => x.tabName))
            .startWith('PREISMELDUNG')
            .publishReplay(1).refCount();


        this.subscriptions.push(
            this.updatePreismeldungPreis$
                .subscribe(payload => store.dispatch({ type: 'UPDATE_PREISMELDUNG_PRICE', payload }))
        );

        this.subscriptions.push(
            this.selectPreismeldestelleNummer$.subscribe(pmsNummer => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: pmsNummer } as preismeldung.Action)
            })
        );

        this.subscriptions.push(
            this.selectPreismeldung$
                .subscribe(payload => {
                    store.dispatch({ type: 'SELECT_PREISMELDUNG', payload } as preismeldung.Action);
                })
        );
    }

    // public ionViewCanLeave(): Promise<boolean> {
    //     return Observable.merge(
    //         this.isCurrentModified$
    //             .filter(modified => modified === false || modified === null)
    //             .map(() => true),
    //         this.isCurrentModified$
    //             .filter(modified => modified === true)
    //             .flatMap(() => this.cancelEditDialog$)
    //             .map(dialogCode => dialogCode === 'THROW_CHANGES')
    //     )
    //         .take(1)
    //         .toPromise();
    // }

    public ionViewDidEnter() {
        this.store.dispatch({ type: 'CHECK_IS_LOGGED_IN' });
        this.store.dispatch({ type: 'PREISMELDESTELLE_LOAD' } as preismeldestelle.Action);
    }

    public ngOnDestroy() {
        // this.store.dispatch({ type: 'CLEAR_PREISMELDUNG_FOR_PMS' } as preismeldung.Action);
        this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: null } as preismeldung.Action);
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
