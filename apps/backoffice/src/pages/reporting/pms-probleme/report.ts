import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent } from '@lik-shared';

import { PmsProblemeReport } from '../../../reducers/report';

@Component({
    selector: 'pms-probleme-report',
    templateUrl: 'report.html',
    styleUrls: ['report.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PmsProblemeReportComponent extends ReactiveComponent implements OnChanges {
    @Input() reportData: PmsProblemeReport;

    public reportData$ = this.observePropertyCurrentValue<PmsProblemeReport>('reportData');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
