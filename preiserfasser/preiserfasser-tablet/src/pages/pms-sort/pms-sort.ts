import { Component, EventEmitter, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { NavParams, NavController, IonicPage } from 'ionic-angular';
import { Store } from '@ngrx/store';

import { Observable, Subscription } from 'rxjs';

import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@IonicPage({
    segment: 'pms-sort/:pmsNummer'
})
@Component({
    selector: 'pms-sort-page',
    templateUrl: 'pms-sort.html',
})
export class PmsSortPage implements OnDestroy {
    ionViewDidLoad$ = new EventEmitter();
    isDesktop$ = this.store.select(fromRoot.getIsDesktop).publishReplay(1).refCount();
    preismeldungen$ = this.ionViewDidLoad$.combineLatest(this.store.select(fromRoot.getPreismeldungen), (_, preismeldungen) => preismeldungen);

    private subscriptions: Subscription[] = [];

    constructor(private navController: NavController, private navParams: NavParams, private store: Store<fromRoot.AppState>) {
        this.subscriptions.push(
            this.ionViewDidLoad$
                .withLatestFrom(this.store.select(x => x.preismeldungen.pmsNummer), (_, pmsNummer) => pmsNummer)
                .filter(pmsNummer => pmsNummer !== this.navParams.get('pmsNummer'))
                .take(1)
                .subscribe(() => this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsNummer') }))
        );
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }


    public ngOnDestroy() {
        this.subscriptions
            .filter(s => !!s && !s.closed)
            .forEach(s => s.unsubscribe());
    }
}
