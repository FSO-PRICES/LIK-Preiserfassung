import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';

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
    public toggleColumn$ = new EventEmitter<number>();
    public hiddenColumns$: Observable<boolean[]>;

    constructor() {
        super();

        this.hiddenColumns$ = this.toggleColumn$
            .asObservable()
            .scan(
                (columns, i) => {
                    columns[i] = !columns[i];
                    return columns;
                },
                [] as boolean[]
            )
            .startWith([])
            .publishReplay(1)
            .refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
