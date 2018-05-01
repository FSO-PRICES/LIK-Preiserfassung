import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';
import { ShortColumnNames } from '../../../reducers/controlling';

@Component({
    selector: 'controlling-report',
    templateUrl: 'controlling-report.html',
})
export class ControllingReportComponent extends ReactiveComponent implements OnChanges {
    @Input() reportData: P.ControllingReportData;
    @Input() preismeldungenStatus: { [pmId: string]: P.Models.PreismeldungStatus };
    @Output('setPreismeldungStatus')
    setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    @Output('runReport') runReport$ = new EventEmitter<string>();
    @Output('editPreismeldungId') editPreismeldungId$ = new EventEmitter<string>();
    @Output('completeAllPreismeldungenStatus') completeAllPreismeldungenStatus$: Observable<string[]>;

    public completeAllPreismeldungenStatusClicked$ = new EventEmitter();
    public setPreismeldungStatusFilter$ = new EventEmitter<number>();
    public zoomLevel$ = new EventEmitter<number>();
    public toggleColumn$ = new EventEmitter<number>();
    public hiddenColumns$: Observable<boolean[]>;
    public shortColumnNames = ShortColumnNames;

    public reportData$ = this.observePropertyCurrentValue<P.ControllingReportData>('reportData')
        .publishReplay(1)
        .refCount();
    public preismeldungenStatus$ = this.observePropertyCurrentValue<{ [pmId: string]: P.Models.PreismeldungStatus }>(
        'preismeldungenStatus'
    )
        .publishReplay(1)
        .refCount();

    public preismeldungen$ = this.reportData$
        .combineLatest(
            this.setPreismeldungStatusFilter$
                .asObservable()
                .startWith(P.Models.PreismeldungStatusFilter['unbestätigt'])
                .publishReplay(1)
                .refCount(),
            this.preismeldungenStatus$
        )
        .filter(([x]) => !!x && !!x.rows)
        .map(([x, statusFilter, preismeldungenStatus]) =>
            x.rows.filter(r => {
                if (statusFilter === P.Models.PreismeldungStatusFilter['exportiert']) {
                    return true;
                }
                return !r.exported && (preismeldungenStatus[r.pmId] || 0) <= statusFilter;
            })
        );

    constructor() {
        super();
        this.completeAllPreismeldungenStatus$ = this.completeAllPreismeldungenStatusClicked$
            .withLatestFrom(this.preismeldungen$)
            .map(([_, preismeldungen]) => preismeldungen.map(pm => pm.pmId));

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
