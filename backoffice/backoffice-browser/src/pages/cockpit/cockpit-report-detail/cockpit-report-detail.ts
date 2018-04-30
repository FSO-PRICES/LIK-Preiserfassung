import { Component, EventEmitter, Input, Output, OnChanges, SimpleChange, ViewChild, OnInit } from '@angular/core';
import { NavController } from 'ionic-angular';
import { sortBy } from 'lodash';

import { ReactiveComponent } from 'lik-shared';
import * as P from '../../../common-models';

@Component({
    selector: 'cockpit-report-detail',
    templateUrl: 'cockpit-report-detail.html',
})
export class CockpitReportDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() preiserheber: P.CockpitPreiserheberSummary;
    @Input() erhebungsZeitpunktKey: string;

    public preiserheber$ = this.observePropertyCurrentValue<P.CockpitPreiserheberSummary>('preiserheber').filter(
        x => !!x
    );
    public pmsSummaryList$ = this.preiserheber$.map(preiserheber =>
        sortBy(preiserheber.pmsPreismeldungSummary.filter(summary => !!summary.pms), sum =>
            sum.pms.name.toLocaleLowerCase()
        )
    );

    constructor(private navController: NavController) {
        super();
    }

    navigateToPmsEdit(pmsNummer) {
        return this.navController.setRoot('PreismeldungByPmsPage', { pmsNummer });
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
