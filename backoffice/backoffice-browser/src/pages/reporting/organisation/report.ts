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
import { OrganisationReport } from '../../../reducers/report';
import { ReportTypes } from '../../../actions/report';

@Component({
    selector: 'organisation-report',
    templateUrl: 'report.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationReportComponent extends ReactiveComponent implements OnChanges {
    @Input('report-data') reportData: OrganisationReport;

    public reportData$ = this.observePropertyCurrentValue<OrganisationReport>('reportData');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public iterateValues<T>(map: T) {
        return Object.keys(map).map((key: keyof T) => ({ key, value: map[key] }));
    }
}
