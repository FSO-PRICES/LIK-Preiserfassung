import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { first } from 'lodash';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';
import { ControllingTypesWithoutPmStatus, CONTROLLING_TYPE } from '../../../actions/controlling';
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
    @Output('clearControlling') clearControlling$ = new EventEmitter();
    @Output('editPreismeldungId') editPreismeldungId$ = new EventEmitter<string>();
    @Output('completeAllPreismeldungenStatus') completeAllPreismeldungenStatus$: Observable<string[]>;

    public completeAllPreismeldungenStatusClicked$ = new EventEmitter();
    public setPreismeldungStatusFilter$ = new EventEmitter<number>();
    public preismeldungStatusFilter$: Observable<number>;
    public controllingTypeSelected$ = new EventEmitter<CONTROLLING_TYPE>();
    public zoomLevel$ = new EventEmitter<number>();
    public toggleColumn$ = new EventEmitter<number>();
    public hiddenColumns$: Observable<boolean[]>;
    public hasStatusInputDisabled$: Observable<boolean>;
    public shortColumnNames = ShortColumnNames;

    public controllings = [
        { name: 'CONTROLLING_0100', label: '0100: Heizöl, Treibstoffe (Stichtag 1): Vollständigkeit' },
        { name: 'CONTROLLING_0110', label: '0110: Heizöl, Treibstoffe (Stichtag 1): Preistrend' },
        { name: 'CONTROLLING_0120', label: '0120: Heizöl, Treibstoffe (Stichtag 1): Niveauvergleich nach EP' },
        { name: 'CONTROLLING_0200', label: '0200: Heizöl, Treibstoffe (Stichtag 2): Vollständigkeit' },
        { name: 'CONTROLLING_0210', label: '0210: Heizöl, Treibstoffe (Stichtag 2): Preistrend' },
        { name: 'CONTROLLING_0220', label: '0220: Heizöl, Treibstoffe (Stichtag 2): Niveauvergleich nach EP' },
        { name: 'CONTROLLING_0230', label: '0230: Früchte, Gemüse (Woche 1): Vollständigkeit' },
        { name: 'CONTROLLING_0240', label: '0240: Früchte, Gemüse (Woche 2): Vollständigkeit' },
        { name: 'CONTROLLING_0250', label: '0250: Früchte, Gemüse: Codefehler (0, R, S)' },
        { name: 'CONTROLLING_0300', label: '0300: Bekleidung, Schuhe: Codefehler (7, R, S)' },
        { name: 'CONTROLLING_0310', label: '0310: Bekleidung, Schuhe: gelöschte Preise (Code 0)' },
        { name: 'CONTROLLING_0320', label: '0320: Bekleidung, Schuhe: Ersatz im Ausverkauf (Code 1+A)' },
        { name: 'CONTROLLING_0400', label: '0400: Gelöschte Preise (Code 0, ohne Bekleidung, Früchte, Gemüse)' },
        {
            name: 'CONTROLLING_0410',
            label: '0410: Direktersatz mit Aktion (Code 1+A, ohne Bekleidung, Früchte, Gemüse)',
        },
        { name: 'CONTROLLING_0420', label: '0420: Qualität Ersterfassung: Ersatz (Code 1, 7)' },
        { name: 'CONTROLLING_0430', label: '0430: Qualität Ersterfassung: Neue Artikel (Code 2, 3)' },
        { name: 'CONTROLLING_0440', label: '0440: Neue Artikel: Qualität Ersterfassung (Code 2, 3)' },
        { name: 'CONTROLLING_0500', label: '0500: Ausreisser (-75%/+250%)' },
        { name: 'CONTROLLING_0510', label: '0510: Preisentwicklung auffällig: alle' },
        { name: 'CONTROLLING_0520', label: '0520: Preisentwicklung auffällig: Ersatz (Code 1, 7)' },
        { name: 'CONTROLLING_0530', label: '0530: Preisentwicklung auffällig: Aktionen (A)' },
        { name: 'CONTROLLING_0540', label: '0540: Preisentwicklung auffällig: ohne Aktionen' },
        { name: 'CONTROLLING_0600', label: '0600: Bemerkungen ans BFS' },
        { name: 'CONTROLLING_0700', label: '0700: Preise/EP: Abweichung von Vorgabe (gemäss ES)' },
        { name: 'CONTROLLING_0810', label: '0810: Ungeprüfte Preismeldungen' },
        { name: 'CONTROLLING_0820', label: '0820: Blockierte Preismeldungen' },
        { name: 'CONTROLLING_0830', label: '0830: Geprüfte Preismeldungen' },
    ];

    public reportData$ = this.observePropertyCurrentValue<P.ControllingReportData>('reportData')
        .publishReplay(1)
        .refCount();
    public preismeldungenStatus$ = this.observePropertyCurrentValue<{ [pmId: string]: P.Models.PreismeldungStatus }>(
        'preismeldungenStatus'
    )
        .publishReplay(1)
        .refCount();

    public preismeldungen$: Observable<
        {
            exported: boolean;
            pmId: string;
            canView: boolean;
            values: (string | number)[];
        }[]
    >;

    constructor() {
        super();
        this.preismeldungStatusFilter$ = this.setPreismeldungStatusFilter$
            .asObservable()
            .startWith(P.Models.PreismeldungStatusFilter.exportiert)
            .publishReplay(1)
            .refCount();
        this.preismeldungen$ = this.reportData$
            .combineLatest(this.preismeldungStatusFilter$, this.preismeldungenStatus$)
            .filter(([x]) => !!x && !!x.rows)
            .map(([x, statusFilter, preismeldungenStatus]) =>
                x.rows.filter(r => {
                    if (ControllingTypesWithoutPmStatus.some(t => t === x.controllingType)) {
                        return !r.exported;
                    }
                    if (statusFilter === P.Models.PreismeldungStatusFilter['exportiert']) {
                        return r.exported || preismeldungenStatus[r.pmId] != null;
                    }
                    return (
                        !r.exported &&
                        preismeldungenStatus[r.pmId] != null &&
                        preismeldungenStatus[r.pmId] <= statusFilter
                    );
                })
            );
        this.completeAllPreismeldungenStatus$ = this.completeAllPreismeldungenStatusClicked$
            .withLatestFrom(this.preismeldungen$)
            .map(([_, preismeldungen]) => preismeldungen.filter(pm => pm.canView).map(pm => pm.pmId));

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

        this.hasStatusInputDisabled$ = this.controllingTypeSelected$
            .startWith(first(this.controllings).name)
            .merge(this.reportData$.filter(x => !!x && !!x.controllingType).map(x => x.controllingType))
            .map(type => ControllingTypesWithoutPmStatus.some(x => x === type))
            .publishReplay(1)
            .refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
