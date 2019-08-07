import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    SimpleChange,
} from '@angular/core';
import { WINDOW } from 'ngx-window-token';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount, withLatestFrom } from 'rxjs/operators';

import { parseErhebungsarten, ReactiveComponent } from '../../../../common';
import * as P from '../../../models';

@Component({
    selector: 'preismeldung-readonly-header',
    styleUrls: ['./preismeldung-readonly-header.scss'],
    templateUrl: 'preismeldung-readonly-header.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungReadonlyHeader extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isAdminApp: boolean;

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public isAdminApp$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isAdminApp');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle').pipe(
        publishReplay(1),
        refCount(),
    );

    public isInternet$: Observable<boolean>;
    public navigateToInternetLink$ = new EventEmitter();

    private subscriptions = [];

    constructor(@Inject(WINDOW) private wndw: Window) {
        super();

        this.subscriptions.push(
            this.navigateToInternetLink$
                .pipe(
                    withLatestFrom(this.preismeldestelle$, this.preismeldung$, (_, __, bag) => bag),
                    map(bag => bag.preismeldung.internetLink),
                )
                .subscribe(internetLink => {
                    if (!internetLink) return;
                    if (!internetLink.startsWith('http://') || !internetLink.startsWith('https://')) {
                        this.wndw.open(`http://${internetLink}`, '_blank');
                    }
                }),
        );

        this.isInternet$ = this.preismeldestelle$.pipe(map(p => !!p && this.isInternet(p.erhebungsart)));
    }

    isInternet(erhebungsart: string) {
        const _erhebungsart = parseErhebungsarten(erhebungsart);
        return _erhebungsart.internet;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    ngOnDestroy() {
        this.subscriptions.filter(s => !!s && !s.closed).forEach(s => s.unsubscribe());
    }
}
