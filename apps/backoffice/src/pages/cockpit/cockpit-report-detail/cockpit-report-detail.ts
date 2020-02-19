import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChange } from '@angular/core';
import { NavController } from '@ionic/angular';
import { sortBy } from 'lodash';
import { Subject } from 'rxjs';
import { combineLatest, filter, map, publishReplay, refCount, takeUntil } from 'rxjs/operators';

import { ReactiveComponent } from '@lik-shared';

import * as P from '../../../common-models';

@Component({
    selector: 'cockpit-report-detail',
    templateUrl: 'cockpit-report-detail.html',
    styleUrls: ['cockpit-report-detail.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CockpitReportDetailComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preiserheber: P.CockpitPreiserheberSummary;
    @Input() erhebungsZeitpunktKey: string;

    private onDestroy$ = new Subject();

    public preiserheber$ = this.observePropertyCurrentValue<P.CockpitPreiserheberSummary>('preiserheber');
    public erhebungsZeitpunktKey$ = this.observePropertyCurrentValue<string>('erhebungsZeitpunktKey').pipe(
        publishReplay(1),
        refCount(),
    );
    public pmsSummaryList$ = this.preiserheber$.pipe(
        filter(x => !!x),
        combineLatest(this.erhebungsZeitpunktKey$.pipe(filter(x => !!x))),
        map(([preiserheber, erhebungsZeitpunktKey]) => {
            const showAll = erhebungsZeitpunktKey === 'indifferent';
            return sortBy(
                preiserheber.pmsPreismeldungSummary.filter(
                    summary => !!summary.pms && (showAll || summary.summary[erhebungsZeitpunktKey].total > 0),
                ),
                sum => sum.pms.name.toLocaleLowerCase(),
            );
        }),
    );
    public pmsSummaryList: any[];

    constructor(private navController: NavController) {
        super();

        this.erhebungsZeitpunktKey$.pipe(takeUntil(this.onDestroy$)).subscribe();
    }

    ngOnDestroy(): void {
        this.onDestroy$.next();
    }

    navigateToPmsEdit(pmsNummer) {
        return this.navController.navigateRoot(['pm', pmsNummer]);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
