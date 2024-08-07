/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */
import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChange } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { first } from 'lodash';
import { Observable, Subject, combineLatest, defer, merge } from 'rxjs';
import {
    distinctUntilChanged,
    filter,
    map,
    mapTo,
    merge as mergeO,
    publishReplay,
    refCount,
    scan,
    shareReplay,
    startWith,
    switchMap,
    takeUntil,
    withLatestFrom,
} from 'rxjs/operators';

import { PefDialogService, ReactiveComponent } from '@lik-shared';

import { CONTROLLING_0840, CONTROLLING_TYPE, ControllingTypesWithoutPmStatus } from '../../../actions/controlling';
import * as P from '../../../common-models';
import {
    DialogPmStatusSelectionResult,
    PefDialogPmStatusSelectionComponent,
} from '../../../components/pef-dialog-pm-status-selection';
import { ColumnValue, ShortColumnNames } from '../../../reducers/controlling';

@Component({
    selector: 'controlling-report',
    templateUrl: 'controlling-report.html',
    styleUrls: ['controlling-report.scss'],
})
export class ControllingReportComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() reportData: P.ControllingReportData;
    @Input() preismeldungenStatus: { [pmId: string]: P.Models.PreismeldungStatus };
    @Input() hasWritePermission: boolean;
    @Output('setPreismeldungStatus')
    setPreismeldungStatus$ = new EventEmitter<{ pmId: string; status: P.Models.PreismeldungStatus }>();
    @Output('runReport') runReport$ = new EventEmitter<string>();
    @Output('editPreismeldungId') editPreismeldungId$ = new EventEmitter<string>();
    @Output('updateAllPmStatus') public updateAllPmStatus$: Observable<P.Models.PreismeldungStatusList>;

    public updateAllPmStatusClicked$ = new EventEmitter();
    public sameLineClicked$ = new EventEmitter();
    public marked$ = new EventEmitter<number>();
    public setPreismeldungStatusFilter$ = new EventEmitter();
    public controllingTypeSelected$ = new EventEmitter<CONTROLLING_TYPE>();
    public zoomLevel$ = new EventEmitter<number>();
    public toggleColumn$ = new EventEmitter<number>();
    public hiddenColumns$: Observable<boolean[]>;
    public hasStatusInputDisabled$: Observable<boolean>;
    public controllingType$: Observable<string>;
    public shortColumnNames = ShortColumnNames;

    private onDestroy$ = new EventEmitter<void>();
    private cleanupMarked$ = new Subject();

    public controllings = [
        { name: 'CONTROLLING_0100', label: 'controlling.regel.0100' },
        { name: 'CONTROLLING_0110', label: 'controlling.regel.0110' },
        { name: 'CONTROLLING_0115', label: 'controlling.regel.0115' },
        { name: 'CONTROLLING_0116', label: 'controlling.regel.0116' },
        { name: 'CONTROLLING_0117', label: 'controlling.regel.0117' },
        { name: 'CONTROLLING_0120', label: 'controlling.regel.0120' },
        { name: 'CONTROLLING_0200', label: 'controlling.regel.0200' },
        { name: 'CONTROLLING_0210', label: 'controlling.regel.0210' },
        { name: 'CONTROLLING_0215', label: 'controlling.regel.0215' },
        { name: 'CONTROLLING_0216', label: 'controlling.regel.0216' },
        { name: 'CONTROLLING_0217', label: 'controlling.regel.0217' },
        { name: 'CONTROLLING_0220', label: 'controlling.regel.0220' },
        { name: 'CONTROLLING_0230', label: 'controlling.regel.0230' },
        { name: 'CONTROLLING_0240', label: 'controlling.regel.0240' },
        { name: 'CONTROLLING_0250', label: 'controlling.regel.0250' },
        { name: 'CONTROLLING_0300', label: 'controlling.regel.0300' },
        { name: 'CONTROLLING_0310', label: 'controlling.regel.0310' },
        { name: 'CONTROLLING_0320', label: 'controlling.regel.0320' },
        { name: 'CONTROLLING_0400', label: 'controlling.regel.0400' },
        { name: 'CONTROLLING_0405', label: 'controlling.regel.0405' },
        { name: 'CONTROLLING_0410', label: 'controlling.regel.0410' },
        { name: 'CONTROLLING_0420', label: 'controlling.regel.0420' },
        { name: 'CONTROLLING_0430', label: 'controlling.regel.0430' },
        { name: 'CONTROLLING_0440', label: 'controlling.regel.0440' },
        { name: 'CONTROLLING_0450', label: 'controlling.regel.0450' },
        { name: 'CONTROLLING_0500', label: 'controlling.regel.0500' },
        { name: 'CONTROLLING_0510', label: 'controlling.regel.0510' },
        { name: 'CONTROLLING_0520', label: 'controlling.regel.0520' },
        { name: 'CONTROLLING_0530', label: 'controlling.regel.0530' },
        { name: 'CONTROLLING_0540', label: 'controlling.regel.0540' },
        // { name: 'CONTROLLING_0550', label: 'controlling.regel.0550' }, // TODO: Not possible at the moment
        { name: 'CONTROLLING_0600', label: 'controlling.regel.0600' },
        { name: 'CONTROLLING_0700', label: 'controlling.regel.0700' },
        { name: 'CONTROLLING_0810', label: 'controlling.regel.0810' },
        { name: 'CONTROLLING_0820', label: 'controlling.regel.0820' },
        { name: 'CONTROLLING_0830', label: 'controlling.regel.0830' },
        { name: 'CONTROLLING_0840', label: 'controlling.regel.0840' },
    ];

    public reportData$ = this.observePropertyCurrentValue<P.ControllingReportData>('reportData').pipe(
        distinctUntilChanged(),
        publishReplay(1),
        refCount(),
    );
    public preismeldungenStatus$ = this.observePropertyCurrentValue<{ [pmId: string]: P.Models.PreismeldungStatus }>(
        'preismeldungenStatus',
    ).pipe(distinctUntilChanged(), publishReplay(1), refCount());

    public hasWritePermission$ = this.observePropertyCurrentValue<boolean>('hasWritePermission').pipe(
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    public preismeldungStatusFilter$ = this.setPreismeldungStatusFilter$.pipe(
        startWith(P.Models.PreismeldungStatusFilter.exportiert),
        distinctUntilChanged(),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    public currentlyMarked$: Observable<number> = merge(this.marked$, this.cleanupMarked$.pipe(mapTo(null))).pipe(
        startWith(null),
        scan((prev, curr) => (prev === curr ? null : curr), null),
        distinctUntilChanged(),
        publishReplay(1),
        refCount(),
    );

    public sameLine$ = this.sameLineClicked$.pipe(
        scan((prev) => !prev, false),
        startWith(false),
    );

    public preismeldungen$ = combineLatest([
        this.reportData$,
        this.preismeldungStatusFilter$,
        this.preismeldungenStatus$,
        this.currentlyMarked$,
    ]).pipe(
        filter(([x]) => !!x && !!x.rows),
        map(([x, statusFilter, preismeldungenStatus, marked]) =>
            x.rows
                .filter((r) => {
                    if (x.controllingType === CONTROLLING_0840) {
                        // 0840 shows all exported Preismeldungen
                        return r.exported;
                    }
                    if (ControllingTypesWithoutPmStatus.some((t) => t === x.controllingType)) {
                        return !r.exported && preismeldungenStatus[r.pmId] != null; // The not exported ones from ControllingTypesWithoutPmStatus
                    }
                    if (statusFilter === P.Models.PreismeldungStatusFilter['exportiert']) {
                        // If statusFilter is 3(exportiert) then show all exported ones or the ones who have a status
                        return r.exported || preismeldungenStatus[r.pmId] != null;
                    }
                    return (
                        //if statusFilter is 1 or 2 then show all not exported ones with status <= statusFilter (2)
                        !r.exported &&
                        preismeldungenStatus[r.pmId] != null &&
                        preismeldungenStatus[r.pmId] <= statusFilter
                    );
                })
                .map((r, i) => ({
                    ...r,
                    values: r.values.map((c) => this.enhanceColumn(c)),
                    behindMarked: i < marked,
                    marked: i === marked,
                })),
        ),
        shareReplay({ bufferSize: 1, refCount: true }),
    );

    constructor(private domSanitizer: DomSanitizer, pefDialogService: PefDialogService) {
        super();

        this.reportData$.pipe(takeUntil(this.onDestroy$)).subscribe(this.cleanupMarked$);

        this.controllingType$ = this.reportData$.pipe(
            filter((x) => x != null),
            map((x) => x.controllingType),
        );
        this.preismeldungStatusFilter$.pipe(takeUntil(this.onDestroy$)).subscribe(this.cleanupMarked$);

        // Cleanup marked if amount of shown pm has changed
        this.preismeldungen$
            .pipe(
                map((pm) => pm && pm.length),
                distinctUntilChanged(),
            )
            .pipe(takeUntil(this.onDestroy$))
            .subscribe(this.cleanupMarked$);

        this.hiddenColumns$ = this.toggleColumn$.asObservable().pipe(
            scan((columns, i) => {
                columns[i] = !columns[i];
                return columns;
            }, [] as boolean[]),
            startWith([]),
            publishReplay(1),
            refCount(),
        );

        this.hasStatusInputDisabled$ = this.controllingTypeSelected$.pipe(
            startWith(first(this.controllings).name),
            mergeO(
                this.reportData$.pipe(
                    filter((x) => !!x && !!x.controllingType),
                    map((x) => x.controllingType),
                ),
            ),
            map((type) => ControllingTypesWithoutPmStatus.some((x) => x === type)),
            publishReplay(1),
            refCount(),
        );

        const confirmUpdateStatusDialog$ = (hasMarker: boolean) =>
            defer(() =>
                pefDialogService
                    .displayDialog(PefDialogPmStatusSelectionComponent, {
                        disableClose: true,
                        data: { hasMarker },
                    })
                    .pipe(filter(DialogPmStatusSelectionResult.is.CONFIRM_SAVE)),
            );

        this.updateAllPmStatus$ = this.updateAllPmStatusClicked$.pipe(
            withLatestFrom(this.currentlyMarked$),
            switchMap(([, marked]) =>
                confirmUpdateStatusDialog$(marked !== null).pipe(map((data) => ({ data, marked }))),
            ),
            withLatestFrom(this.preismeldungen$, this.preismeldungenStatus$),
            map(([{ data, marked }, preismeldungen, preismeldungenStatus]) =>
                (data.toMarker ? preismeldungen.slice(0, marked + 1) : preismeldungen)
                    .filter((pm) => pm.canView && preismeldungenStatus[pm.pmId] != null)
                    .map(({ pmId }) => ({ pmId, status: data.pmStatus })),
            ),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
    }

    public enhanceColumn(column: ColumnValue) {
        const formattedValue = this.formatValue(column);
        const value = column.value == null ? '' : column.value;
        return {
            ...column,
            width:
                column.size != null && column.size.fixed != null && value.toString().length > 0
                    ? this.domSanitizer.bypassSecurityTrustStyle(`calc(${column.size.fixed}ch + 11px)`)
                    : null,
            minWidth:
                column.size != null && column.size.min != null && value.toString().length > 0
                    ? this.domSanitizer.bypassSecurityTrustStyle(`calc(${column.size.min}ch + 11px)`)
                    : null,
            formattedValue,
            title: value
                .toString()
                .replace(/&nbsp;/g, ' ')
                .replace(/<br>/g, ' | ')
                .replace(/<.*?>/g, ''),
        };
    }

    public formatValue(column: ColumnValue) {
        if (!column.parseHtml) {
            return column.value;
        }
        return this.domSanitizer.bypassSecurityTrustHtml(column.value);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    public ngOnDestroy() {
        this.onDestroy$.next();
    }

    public trackByPmId(pm: { pmId: string }) {
        return pm.pmId;
    }
}
