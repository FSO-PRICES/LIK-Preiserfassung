/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
    closeClicked$ = new EventEmitter();
    save$ = new EventEmitter();
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

        this.subscriptions.push(
            this.closeClicked$.subscribe(() => {
                this.store.dispatch({ type: 'PREISMELDUNGEN_RESET' });
                this.navController.setRoot('PmsPriceEntryPage', { pmsNummer: this.navParams.get('pmsNummer') });
            })
        );
        this.subscriptions.push(this.save$.subscribe(sortOrderDoc => this.store.dispatch({ type: 'PREISMELDUNGEN_SORT_SAVE', payload: ({ pmsNummer: this.navParams.get('pmsNummer'), sortOrderDoc }) })));
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
