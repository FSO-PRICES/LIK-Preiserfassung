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

import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Loading, LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { sortBy } from 'lodash';

import { ReactiveComponent, PefDialogService, pefSearch, PefVirtualScrollComponent } from 'lik-shared';

import * as P from '../../../common-models';
import { CockpitPreismeldungSummary } from '../../../common-models';

@Component({
    selector: 'cockpit-report',
    templateUrl: 'cockpit-report.html',
})
export class CockpitReportComponent extends ReactiveComponent implements OnChanges, OnInit {
    @Input('report-executing') reportExecuting: boolean;
    @Input('status-updated-count') statusUpdatedCount: number | null;
    @Input('status-missing-count') statusMissingCount: number | null;
    @Input('initializing-preismeldungen-status') initializingPreismeldungenStatus: boolean;
    @Input('cockpit-report-data') cockpitReportData: P.CockpitReportData;
    @Input('selected-preiserheber') selectedPreiserheber: Observable<P.CockpitPreiserheberSummary>;
    @Output('load-data') loadData$ = new EventEmitter();
    @Output('init-preismeldungen-status') initPreismeldungenStatus$ = new EventEmitter();
    @Output('preiserheberSelected') preiserheberSelected$: Observable<P.CockpitPreiserheberSummary>;

    public selectPreiserheber$ = new EventEmitter<P.CockpitPreiserheberSummary>();
    public selectedPreiserheber$ = this.observePropertyCurrentValue<P.CockpitPreiserheberSummary>(
        'selectedPreiserheber'
    );
    public reportExecuting$ = this.observePropertyCurrentValue<boolean>('reportExecuting');
    public initializingPreismeldungenStatus$ = this.observePropertyCurrentValue<boolean>(
        'initializingPreismeldungenStatus'
    );
    public cockpitReportData$ = this.observePropertyCurrentValue<P.CockpitReportData>('cockpitReportData');
    public hasExecutedOnce$: Observable<boolean>;
    public filteredPreiserheber$: Observable<P.CockpitPreiserheberSummary[]>;
    public filteredSummary$: Observable<P.CockpitPreismeldungSummary>;
    public erhebungsZeitpunkt$: Observable<string>;
    public scrollList: Observable<P.CockpitPreiserheberSummary[]>;

    private form: FormGroup;

    private ngOnInit$ = new EventEmitter();
    @ViewChild(PefVirtualScrollComponent) private virtualScroll: any;

    constructor(private pefDialogService: PefDialogService, private formBuilder: FormBuilder) {
        super();

        this.form = formBuilder.group({
            preiserheberFilter: [null],
            erhebungsZeitpunkt: ['indifferent'],
        });

        const formValueChange$ = this.form.valueChanges.publishReplay(1).refCount();

        this.erhebungsZeitpunkt$ = formValueChange$.map(x => x.erhebungsZeitpunkt).startWith('indifferent');

        this.reportExecuting$
            .filter(x => !!x)
            .subscribe(() =>
                this.pefDialogService.displayLoading(
                    'Daten werden zusammengefasst, bitte warten...',
                    this.reportExecuting$.filter(x => !x).take(1)
                )
            );

        this.initializingPreismeldungenStatus$
            .filter(x => !!x)
            .subscribe(() =>
                this.pefDialogService.displayLoading(
                    'Prüfstatus wird zugewiesen, bitte warten...',
                    this.initializingPreismeldungenStatus$.filter(x => !x).take(1)
                )
            );

        this.filteredPreiserheber$ = formValueChange$
            .startWith({})
            .combineLatest(this.cockpitReportData$.filter(x => !!x), (form, cockpitReportData) => {
                const erhebungsZeitpunktKey = this.form.value.erhebungsZeitpunkt;
                const showAll = erhebungsZeitpunktKey === 'indifferent';
                const filterStichtage = (preiserhebers: P.CockpitPreiserheberSummary[]) => {
                    return showAll
                        ? preiserhebers
                        : preiserhebers.filter(pe => !!pe.summary && pe.summary[erhebungsZeitpunktKey].total > 0);
                };
                if (!form.preiserheberFilter) {
                    const unassigned = {
                        username: 'unassigned',
                        erheber: {
                            firstName: 'Nicht zugeordnete Preismeldestellen',
                            surname: '',
                            erhebungsregion: '',
                        } as P.Models.Erheber,
                        lastSyncedAt: '',
                        summary: cockpitReportData.unassigned.summary,
                        pmsPreismeldungSummary: cockpitReportData.unassigned.pmsPreismeldungSummary,
                    } as P.CockpitPreiserheberSummary;
                    return [unassigned].concat(filterStichtage(cockpitReportData.preiserheber));
                } else {
                    return pefSearch(form.preiserheberFilter, filterStichtage(cockpitReportData.preiserheber), [
                        x => x.erheber.firstName,
                        x => x.erheber.surname,
                        x => x.erheber.erhebungsregion,
                    ]);
                }
            })
            .map(x => sortBy(x, pe => pe.erheber.surname.toLocaleLowerCase()))
            .startWith([])
            .publishReplay(1)
            .refCount();

        this.filteredSummary$ = this.filteredPreiserheber$
            .map(preiserheber =>
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
                    } as CockpitPreismeldungSummary
                )
            )
            .shareReplay();

        this.preiserheberSelected$ = this.selectPreiserheber$
            .combineLatest(this.filteredPreiserheber$, (clickedPreiserheber, filteredPreiserheber) => {
                if (!filteredPreiserheber.some(y => y.username === clickedPreiserheber.username)) return null;
                return clickedPreiserheber;
            })
            .publishReplay(1)
            .refCount();

        this.hasExecutedOnce$ = this.cockpitReportData$
            .filter(x => !!x)
            .mapTo(true)
            .take(1);
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
