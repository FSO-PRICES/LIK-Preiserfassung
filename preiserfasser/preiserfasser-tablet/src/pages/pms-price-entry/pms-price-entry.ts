import { Component, EventEmitter } from '@angular/core';
import { NavParams, NavController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';

import * as P from '../../common-models';

import * as fromRoot from '../../reducers';

@Component({
    selector: 'pms-price-entry',
    templateUrl: 'pms-price-entry.html',
})
export class PmsPriceEntryPage {
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);
    preismeldungen$ = this.store.select(fromRoot.getPreismeldungen);
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldung).publishReplay(1).refCount();

    selectPreismeldung$ = new EventEmitter<P.Preismeldung>();
    selectTab$ = new EventEmitter<string>();
    toolbarButtonClicked$ = new EventEmitter<string>();

    selectedTab$ = this.selectTab$
        .startWith('PREISMELDUNG')
        .publishReplay(1).refCount();

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private store: Store<fromRoot.AppState>
    ) {
        this.toolbarButtonClicked$
            .filter(x => x === 'HOME')
            .subscribe(() => this.navController.pop());

        this.selectPreismeldung$
            .map(x => x._id)
            .subscribe(x => this.store.dispatch({ type: 'SELECT_PREISMELDUNG', payload: x }));
    }

    ionViewDidLoad() {
        this.store.dispatch({ type: 'PREISMELDUNGEN_LOAD_FOR_PMS', payload: this.navParams.get('pmsKey') });
    }

    ionViewDidLeave() {
        this.store.dispatch({ type: 'PREISMELDUNGEN_CLEAR' });
    }
}
