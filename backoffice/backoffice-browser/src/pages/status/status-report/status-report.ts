import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Loading, LoadingController } from 'ionic-angular';
import { Observable } from 'rxjs';

import { ReactiveComponent, PefDialogService, pefSearch } from 'lik-shared';

import * as P from '../../../common-models';
import { PefVirtualScrollComponent } from 'lik-shared';

@Component({
    selector: 'status-report',
    templateUrl: 'status-report.html'
})
export class StatusReportComponent extends ReactiveComponent implements OnChanges, OnInit {
    @Input('report-executing') reportExecuting: boolean;
    @Input('cockpit-report-data') cockpitReportData: P.CockpitReportData;
    @Output('load-data') loadData$ = new EventEmitter();

    public selectPreiserheber$ = new EventEmitter<P.CockpitPreiserheberSummary>();
    public selectedPreiserheber$: Observable<P.CockpitPreiserheberSummary>;

    public reportExecuting$ = this.observePropertyCurrentValue<boolean>('reportExecuting');
    public cockpitReportData$ = this.observePropertyCurrentValue<P.CockpitReportData>('cockpitReportData');
    public filteredPreiserheber$: Observable<P.CockpitPreiserheberSummary[]>;
    public filteredSummary$: Observable<P.CockpitPreismeldungSummary>;
    public scrollList: Observable<P.CockpitPreiserheberSummary[]>;

    private form: FormGroup;

    private ngOnInit$ = new EventEmitter();
    @ViewChild(PefVirtualScrollComponent)
    private virtualScroll: any;

    constructor(private pefDialogService: PefDialogService, private formBuilder: FormBuilder) {
        super();

        this.form = formBuilder.group({
            preiserheberFilter: [null],
            erhebungsZeitpunkt: ['indifferent']
        });

        this.reportExecuting$.filter(x => !!x)
            .subscribe(() => this.pefDialogService.displayLoading('Daten werden zusammengefasst, bitte warten...', this.reportExecuting$.filter(x => !x).take(1)));

        this.filteredPreiserheber$ = this.form.valueChanges.startWith({})
            .combineLatest(this.cockpitReportData$.filter(x => !!x), (form, cockpitReportData) => {
                if (!form.preiserheberFilter) {
                    const unassigned = {
                        username: 'unassigned',
                        erheber: { firstName: 'Nicht zugeordnete Preismeldestellen', surname: '', erhebungsregion: '' } as P.Models.Erheber,
                        lastSyncedAt: '',
                        summary: cockpitReportData.unassigned.summary,
                        pmsPreismeldungSummary: cockpitReportData.unassigned.pmsPreismeldungSummary
                    } as P.CockpitPreiserheberSummary;
                    return [unassigned].concat(cockpitReportData.preiserheber);
                } else {
                    return pefSearch(form.preiserheberFilter, cockpitReportData.preiserheber, [x => x.erheber.firstName, x => x.erheber.surname, x => x.erheber.erhebungsregion])
                }
            })
            .startWith([])
            .publishReplay(1).refCount();

        this.filteredSummary$ = this.filteredPreiserheber$
            .map(preiserheber =>
                preiserheber.reduce((agg, v) => ({
                    todo: agg.todo + v.summary[this.form.value.erhebungsZeitpunkt].todo,
                    todoSynced: agg.todoSynced + v.summary[this.form.value.erhebungsZeitpunkt].todoSynced,
                    done: agg.done + v.summary[this.form.value.erhebungsZeitpunkt].done,
                    doneUploaded: agg.doneUploaded + v.summary[this.form.value.erhebungsZeitpunkt].doneUploaded,
                    newPreismeldungen: agg.newPreismeldungen + v.summary[this.form.value.erhebungsZeitpunkt].newPreismeldungen,
                    newPreismeldungenUploaded: agg.newPreismeldungenUploaded + v.summary[this.form.value.erhebungsZeitpunkt].newPreismeldungenUploaded,
                }), { todo: 0, todoSynced: 0, done: 0, doneUploaded: 0, newPreismeldungen: 0, newPreismeldungenUploaded: 0 })
            )
            .shareReplay();

        this.selectedPreiserheber$ = this.selectPreiserheber$
            .combineLatest(this.filteredPreiserheber$, (clickedPreiserheber, filteredPreiserheber) => {
                if (!filteredPreiserheber.some(y => y.username === clickedPreiserheber.username)) return null;
                return clickedPreiserheber;
            })
            .startWith(null)
            .publishReplay(1).refCount();

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
