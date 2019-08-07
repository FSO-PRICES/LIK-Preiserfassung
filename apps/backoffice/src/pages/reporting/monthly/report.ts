import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent } from '@lik-shared';

import { MonthlyReport } from '../../../reducers/report';

@Component({
    selector: 'monthly-report',
    templateUrl: 'report.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyReportComponent extends ReactiveComponent implements OnChanges {
    @Input() reportData: MonthlyReport;

    numberFormatOptions = { integerSeparator: "'" };
    public reportData$ = this.observePropertyCurrentValue<MonthlyReport>('reportData');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
