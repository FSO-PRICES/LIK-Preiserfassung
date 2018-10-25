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

import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    SimpleChange,
    ViewChild,
    OnInit,
    OnDestroy,
} from '@angular/core';
import { NavController } from 'ionic-angular';
import { sortBy } from 'lodash';
import { Subject } from 'rxjs/Subject';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'cockpit-report-detail',
    templateUrl: 'cockpit-report-detail.html',
})
export class CockpitReportDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preiserheber: P.CockpitPreiserheberSummary;
    @Input() erhebungsZeitpunktKey: string;

    private onDestroy$ = new Subject();

    public preiserheber$ = this.observePropertyCurrentValue<P.CockpitPreiserheberSummary>('preiserheber');
    public erhebungsZeitpunktKey$ = this.observePropertyCurrentValue<string>('erhebungsZeitpunktKey')
        .publishReplay(1)
        .refCount();
    public pmsSummaryList$ = this.preiserheber$
        .filter(x => !!x)
        .combineLatest(this.erhebungsZeitpunktKey$.filter(x => !!x))
        .map(([preiserheber, erhebungsZeitpunktKey]) => {
            const showAll = erhebungsZeitpunktKey === 'indifferent';
            return sortBy(
                preiserheber.pmsPreismeldungSummary.filter(
                    summary => !!summary.pms && (showAll || summary.summary[erhebungsZeitpunktKey].total > 0)
                ),
                sum => sum.pms.name.toLocaleLowerCase()
            );
        });

    constructor(private navController: NavController) {
        super();

        this.erhebungsZeitpunktKey$.takeUntil(this.onDestroy$).subscribe();
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
    }

    navigateToPmsEdit(pmsNummer) {
        return this.navController.setRoot('PreismeldungByPmsPage', { pmsNummer });
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
