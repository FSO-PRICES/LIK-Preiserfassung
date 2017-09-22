import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'controlling-report',
    templateUrl: 'controlling-report.html'
})
export class ControllingReportComponent extends ReactiveComponent implements OnChanges {
    @Input() reportExecuting: boolean;
    @Input() reportData: P.ControllingReportData;
    @Output('runReport') runReport$ = new EventEmitter<string>();

    public reportData$ = this.observePropertyCurrentValue<P.ControllingReportData>('reportData').publishReplay(1).refCount();
    public reportExecuting$ = this.observePropertyCurrentValue<boolean>('reportExecuting');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

}
