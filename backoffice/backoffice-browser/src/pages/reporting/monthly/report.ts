import {
    Component,
    EventEmitter,
    Input,
    Output,
    OnChanges,
    SimpleChange,
    ChangeDetectionStrategy,
} from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Loading, LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs';

import { ReactiveComponent } from 'lik-shared';

import * as P from '../../../common-models';
import { MonthlyReport } from '../../../reducers/report';
import { ReportTypes } from '../../../actions/report';

@Component({
    selector: 'monthly-report',
    templateUrl: 'report.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonthlyReportComponent extends ReactiveComponent implements OnChanges {
    @Input('report-data') reportData: MonthlyReport;

    public reportData$ = this.observePropertyCurrentValue<MonthlyReport>('reportData');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
