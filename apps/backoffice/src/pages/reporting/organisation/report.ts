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

import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { map } from 'rxjs/operators';

import { ReactiveComponent } from '@lik-shared';

import { sortNumericBeginningText } from '../../../common/report-functions';
import { OrganisationReport } from '../../../reducers/report';

@Component({
    selector: 'organisation-report',
    templateUrl: 'report.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationReportComponent extends ReactiveComponent implements OnChanges {
    @Input() reportData: OrganisationReport;

    numberFormatOptions = { integerSeparator: "'" };
    public reportData$ = this.observePropertyCurrentValue<OrganisationReport>('reportData').pipe(
        map(data =>
            !!data
                ? {
                      erhebungsregionen: this.iterateValues(data.erhebungsregionen),
                      preiserheber: this.iterateValues(data.preiserheber),
                      preismeldungen: this.iterateValues(data.preismeldungen, true),
                      zeitpunkt: data.zeitpunkt,
                  }
                : null,
        ),
    );

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public iterateValues(dataMap: Record<string, any>, numeric: boolean = false) {
        const list = Object.keys(dataMap)
            .sort(numeric ? sortNumericBeginningText : undefined)
            .filter(x => x !== 'N/A')
            .map(key => ({ key, value: dataMap[key] }));
        return list;
    }
}
