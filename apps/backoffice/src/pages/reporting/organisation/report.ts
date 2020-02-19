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
