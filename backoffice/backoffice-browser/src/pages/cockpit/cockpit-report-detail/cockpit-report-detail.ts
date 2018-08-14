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

import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { sortBy } from 'lodash';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'cockpit-report-detail',
    templateUrl: 'cockpit-report-detail.html',
})
export class CockpitReportDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preiserheber: P.CockpitPreiserheberSummary;
    @Input() erhebungsZeitpunktKey: string;

    public preiserheber$ = this.observePropertyCurrentValue<P.CockpitPreiserheberSummary>('preiserheber').filter(
        x => !!x
    );
    public pmsSummaryList$ = this.preiserheber$.map(preiserheber =>
        sortBy(preiserheber.pmsPreismeldungSummary.filter(summary => !!summary.pms), sum =>
            sum.pms.name.toLocaleLowerCase()
        )
    );

    constructor(private navController: NavController) {
        super();
    }

    navigateToPmsEdit(pmsNummer) {
        return this.navController.setRoot('PreismeldungByPmsPage', { pmsNummer });
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
