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
import { Subscription } from 'rxjs';

import * as P from '../../common-models';
import * as fromRoot from '../../reducers';

@IonicPage({
    segment: 'new-price-series/:pmsNummer',
})
@Component({
    selector: 'new-price-series-page',
    templateUrl: 'new-price-series.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPriceSeriesPage implements OnDestroy {
    ionViewDidLoad$ = new EventEmitter();
    currentLanguage$ = this.store.select(fromRoot.getCurrentLanguage);
    isDesktop$ = this.store.select(fromRoot.getIsDesktop);

    warenkorb$ = this.ionViewDidLoad$.combineLatest(
        this.store.select(fromRoot.getWarenkorb),
        (_, warenkorb) => warenkorb
    );
    preismeldungen$ = this.ionViewDidLoad$.combineLatest(
        this.store.select(fromRoot.getPreismeldungen),
        (_, preismeldungen) => preismeldungen
    );
    currentPreismeldung$ = this.store.select(fromRoot.getCurrentPreismeldungViewBag);
    erhebungsInfo$ = this.store.select(fromRoot.getErhebungsInfo);

    closeChooseFromWarenkorb$ = new EventEmitter<{
        warenkorbPosition: P.Models.WarenkorbLeaf;
        bearbeitungscode: P.Models.Bearbeitungscode;
    }>();

    private subscriptions: Subscription[] = [];

    constructor(
        private navController: NavController,
        private navParams: NavParams,
        private store: Store<fromRoot.AppState>
    ) {
        this.subscriptions.push(
            this.ionViewDidLoad$
                .withLatestFrom(this.store.select(x => x.preismeldungen.pmsNummer), (_, pmsNummer) => pmsNummer)
                .filter(pmsNummer => pmsNummer !== this.navParams.get('pmsNummer'))
                .take(1)
                .subscribe(() =>
                    this.store.dispatch({
                        type: 'PREISMELDUNGEN_LOAD_FOR_PMS',
                        payload: this.navParams.get('pmsNummer'),
                    })
                )
        );

        this.subscriptions.push(
            this.closeChooseFromWarenkorb$
                .flatMap(x => {
                    if (!!x) {
                        this.store.dispatch({
                            type: 'NEW_PREISMELDUNG',
                            payload: {
                                warenkorbPosition: x.warenkorbPosition,
                                bearbeitungscode: x.bearbeitungscode,
                                pmsNummer: this.navParams.get('pmsNummer'),
                            },
                        });
                    }
                    return this.navigateToPmsPriceEntry();
                })
                .subscribe()
        );
    }

    ionViewDidLoad() {
        this.ionViewDidLoad$.emit();
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }

    navigateToPmsPriceEntry() {
        return this.navController.setRoot('PmsPriceEntryPage', { pmsNummer: this.navParams.get('pmsNummer') });
    }
}
