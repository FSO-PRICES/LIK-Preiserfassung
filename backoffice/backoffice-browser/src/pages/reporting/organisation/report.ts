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
import { sortNumericBeginningText } from '../../../common/report-functions';

@Component({
    selector: 'organisation-report',
    templateUrl: 'report.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganisationReportComponent extends ReactiveComponent implements OnChanges {
    @Input('report-data') reportData: OrganisationReport;

    numberFormatOptions = { integerSeparator: "'" };
    public reportData$ = this.observePropertyCurrentValue<OrganisationReport>('reportData');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public iterateValues(map: any, numeric: boolean) {
        const list = Object.keys(map)
            .sort(numeric ? sortNumericBeginningText : undefined)
            .filter(x => x !== 'N/A')
            .map(key => ({ key, value: map[key] }));
        if (map['N/A'] != null) {
            list.push({ key: 'N/A', value: map['N/A'] });
        }
        return list;
    }
}
