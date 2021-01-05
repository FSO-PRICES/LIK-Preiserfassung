/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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

import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    OnInit,
    Output,
    SimpleChange,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { sortBy } from 'lodash';
import { Observable } from 'rxjs';
import {
    combineLatest,
    filter,
    map,
    mapTo,
    publishReplay,
    refCount,
    shareReplay,
    startWith,
    take,
} from 'rxjs/operators';

import { PefDialogService, pefSearch, ReactiveComponent } from '@lik-shared';

import * as P from '../../../common-models';
import { CockpitPreismeldungSummary } from '../../../common-models';

@Component({
    selector: 'cockpit-report',
    templateUrl: 'cockpit-report.html',
    styleUrls: ['cockpit-report.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CockpitReportComponent extends ReactiveComponent implements OnChanges, OnInit {
    @Input() reportExecuting: boolean;
    @Input() statusUpdatedCount: number | null;
    @Input() statusMissingCount: number | null;
    @Input() initializingPreismeldungenStatus: boolean;
    @Input() cockpitReportData: P.CockpitReportData;
    @Input() selectedPreiserheber: Observable<P.CockpitPreiserheberSummary>;
    @Output('loadData') loadData$ = new EventEmitter();
    @Output('initPreismeldungenStatus') initPreismeldungenStatus$ = new EventEmitter();
    @Output('checkPreismeldungStatus') checkPreismeldungStatus$ = new EventEmitter();
    @Output('preiserheberSelected') preiserheberSelected$: Observable<P.CockpitPreiserheberSummary>;

    public selectPreiserheber$ = new EventEmitter<P.CockpitPreiserheberSummary>();
    public selectedPreiserheber$ = this.observePropertyCurrentValue<P.CockpitPreiserheberSummary>(
        'selectedPreiserheber',
    );
    public reportExecuting$ = this.observePropertyCurrentValue<boolean>('reportExecuting');
    public initializingPreismeldungenStatus$ = this.observePropertyCurrentValue<boolean>(
        'initializingPreismeldungenStatus',
    );
    public cockpitReportData$ = this.observePropertyCurrentValue<P.CockpitReportData>('cockpitReportData');
    public hasExecutedOnce$: Observable<boolean>;
    public filteredPreiserheber$: Observable<P.CockpitPreiserheberSummary[]>;
    public filteredSummary$: Observable<P.CockpitPreismeldungSummary>;
    public notAssigned$: Observable<P.StichtagGroupedCockpitPreismeldungSummary>;
    public erhebungsZeitpunkt$: Observable<string>;
    public scrollList: Observable<P.CockpitPreiserheberSummary[]>;

    public form: FormGroup;

    private ngOnInit$ = new EventEmitter();

    constructor(private pefDialogService: PefDialogService, formBuilder: FormBuilder) {
        super();

        this.form = formBuilder.group({
            preiserheberFilter: [null],
            erhebungsZeitpunkt: ['indifferent'],
        });

        const formValueChange$ = this.form.valueChanges.pipe(
            publishReplay(1),
            refCount(),
        );

        this.erhebungsZeitpunkt$ = formValueChange$.pipe(
            map(x => x.erhebungsZeitpunkt),
            startWith('indifferent'),
        );

        this.reportExecuting$.pipe(filter(x => !!x)).subscribe(() =>
            this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', {
                requestDismiss$: this.reportExecuting$.pipe(
                    filter(x => !x),
                    take(1),
                ),
            }),
        );

        this.initializingPreismeldungenStatus$.pipe(filter(x => !!x)).subscribe(() =>
            this.pefDialogService.displayLoading('Prüfstatus wird zugewiesen, bitte warten...', {
                requestDismiss$: this.initializingPreismeldungenStatus$.pipe(
                    filter(x => !x),
                    take(1),
                ),
            }),
        );

        const filteredPreiserheber$ = formValueChange$.pipe(
            startWith({}),
            combineLatest(this.cockpitReportData$.pipe(filter(x => !!x))),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        this.notAssigned$ = filteredPreiserheber$.pipe(
            map(([form, cockpitReportData]) =>
                !form.preiserheberFilter ? cockpitReportData.unassigned.summary : null,
            ),
        );

        this.filteredPreiserheber$ = filteredPreiserheber$.pipe(
            map(([form, cockpitReportData]) => {
                const erhebungsZeitpunktKey = this.form.value.erhebungsZeitpunkt;
                const showAll = erhebungsZeitpunktKey === 'indifferent';
                const filterStichtage = (preiserhebers: P.CockpitPreiserheberSummary[]) => {
                    return showAll
                        ? preiserhebers
                        : preiserhebers.filter(pe => !!pe.summary && pe.summary[erhebungsZeitpunktKey].total > 0);
                };
                if (!form.preiserheberFilter) {
                    return filterStichtage(cockpitReportData.preiserheber);
                } else {
                    return pefSearch(form.preiserheberFilter, filterStichtage(cockpitReportData.preiserheber), [
                        x => x.erheber.firstName,
                        x => x.erheber.surname,
                        x => x.erheber.erhebungsregion,
                    ]);
                }
            }),
            map(x => sortBy(x, pe => pe.erheber.surname.toLocaleLowerCase())),
            startWith([]),
            publishReplay(1),
            refCount(),
        );

        this.filteredSummary$ = this.filteredPreiserheber$.pipe(
            map(preiserheber =>
                preiserheber.reduce(
                    (agg, v) =>
                        ({
                            total: agg.total + v.summary[this.form.value.erhebungsZeitpunkt].total,
                            newPreismeldungen:
                                agg.newPreismeldungen + v.summary[this.form.value.erhebungsZeitpunkt].newPreismeldungen,
                            todo: agg.todo + v.summary[this.form.value.erhebungsZeitpunkt].todo,
                            doneButNotUploaded:
                                agg.doneButNotUploaded +
                                v.summary[this.form.value.erhebungsZeitpunkt].doneButNotUploaded,
                            uploaded: agg.uploaded + v.summary[this.form.value.erhebungsZeitpunkt].uploaded,
                            synced: agg.synced && v.summary[this.form.value.erhebungsZeitpunkt].synced,
                            nothingTodo: agg.nothingTodo && v.summary[this.form.value.erhebungsZeitpunkt].nothingTodo,
                            nothingToUpload:
                                agg.nothingToUpload && v.summary[this.form.value.erhebungsZeitpunkt].nothingToUpload,
                            uploadedAll: agg.uploadedAll && v.summary[this.form.value.erhebungsZeitpunkt].doneAll,
                        } as CockpitPreismeldungSummary),
                    {
                        total: 0,
                        newPreismeldungen: 0,
                        todo: 0,
                        doneButNotUploaded: 0,
                        uploaded: 0,
                        synced: true,
                        nothingTodo: true,
                        nothingToUpload: true,
                        uploadedAll: true,
                    } as CockpitPreismeldungSummary,
                ),
            ),
            shareReplay(),
        );

        this.preiserheberSelected$ = this.selectPreiserheber$.pipe(
            combineLatest(this.filteredPreiserheber$, (clickedPreiserheber, filteredPreiserheber) => {
                if (!filteredPreiserheber.some(y => y.username === clickedPreiserheber.username)) return null;
                return clickedPreiserheber;
            }),
            publishReplay(1),
            refCount(),
        );

        this.hasExecutedOnce$ = this.cockpitReportData$.pipe(
            filter(x => !!x),
            mapTo(true),
            take(1),
        );
    }

    public updateScrollList(event) {
        this.scrollList = event;
    }

    public ngOnInit() {
        this.ngOnInit$.emit();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
