import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'controlling-report',
    templateUrl: 'controlling-report.html',
})
export class ControllingReportComponent extends ReactiveComponent implements OnChanges {
    @Input() reportData: P.ControllingReportData;
    @Output('runReport') runReport$ = new EventEmitter<string>();
    @Output('editPreismeldungId') editPreismeldungId$ = new EventEmitter<string>();

    public reportData$ = this.observePropertyCurrentValue<P.ControllingReportData>('reportData')
        .publishReplay(1)
        .refCount();

    public zoomLevel$ = new EventEmitter<number>();

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
