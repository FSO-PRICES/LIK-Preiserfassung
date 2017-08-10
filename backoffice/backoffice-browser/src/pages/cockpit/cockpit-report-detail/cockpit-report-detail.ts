import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild, OnInit } from '@angular/core';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'cockpit-report-detail',
    templateUrl: 'cockpit-report-detail.html'
})
export class CockpitReportDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preiserheber: P.CockpitPreiserheberSummary;
    @Input() erhebungsZeitpunktKey: string;

    public preiserheber$ = this.observePropertyCurrentValue<P.CockpitPreiserheberSummary>('preiserheber');

    constructor() {
        super();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
