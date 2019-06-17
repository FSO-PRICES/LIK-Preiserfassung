import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount, withLatestFrom } from 'rxjs/operators';

import { parseErhebungsarten, ReactiveComponent } from '../../../../';

import * as P from '../../../models';

@Component({
    selector: 'preismeldung-readonly-header',
    template: `
        <div class="pms-heading" *ngIf="isAdminApp$ | async">
            {{ (preismeldestelle$ | async)?.pmsNummer }} {{ (preismeldestelle$ | async)?.name }}
        </div>
        <div class="header-line" *ngIf="!!(preismeldung$ | async)">
            <div class="product-heading">
                {{ (preismeldung$ | async).warenkorbPosition.gliederungspositionsnummer }}
                {{ (preismeldung$ | async).warenkorbPosition.positionsbezeichnung | pefPropertyTranslate }}
            </div>
            <ion-item class="pef-item on-dark" *ngIf="!(isInternet$ | async)">
                <ion-label>{{ 'label_artikelnummer' | translate }}</ion-label>
                <ion-input
                    type="text"
                    [readonly]="true"
                    [class.readonly]="true"
                    [value]="(preismeldung$ | async)?.preismeldung.artikelnummer"
                ></ion-input>
            </ion-item>
            <ion-item class="pef-item on-dark" *ngIf="isInternet$ | async">
                <ion-label> {{ 'label_internetlink' | translate }} </ion-label>
                <ion-input
                    type="text"
                    [readonly]="true"
                    [class.readonly]="true"
                    [value]="(preismeldung$ | async)?.preismeldung.internetLink"
                ></ion-input>
            </ion-item>
            <button
                class="pef-icon-secondary server-url-button"
                ion-button
                icon-only
                (click)="navigateToInternetLink$.emit()"
                [disabled]="!(preismeldung$ | async)?.preismeldung.internetLink"
                *ngIf="(preismeldestelle$ | async)?.erhebungsart == 'internet'"
            >
                <pef-icon name="server_url"></pef-icon>
            </button>
            <div
                class="right-column price-count-status"
                [ngClass]="{
                    ok: (preismeldung$ | async)?.priceCountStatus?.ok,
                    'not-ok': !(preismeldung$ | async)?.priceCountStatus?.ok
                }"
            >
                <span
                    >{{ (preismeldung$ | async).priceCountStatus.numActivePrices }}/{{
                        (preismeldung$ | async).priceCountStatus.anzahlPreiseProPMS
                    }}</span
                >
            </div>
        </div>
        <div class="header-line" *ngIf="!!(preismeldung$ | async)">
            <ion-item class="pef-item on-dark">
                <ion-label
                    >{{ 'label_artikeltext' | translate }}<span style="visibility: hidden">&nbsp;*</span>
                </ion-label>
                <ion-input
                    type="text"
                    [readonly]="true"
                    [class.readonly]="true"
                    [value]="(preismeldung$ | async)?.preismeldung.artikeltext"
                ></ion-input>
            </ion-item>
            <div class="right-column"></div>
        </div>
    `,
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

    constructor(@Inject('windowObject') public window: any) {
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
                        this.window.open(`http://${internetLink}`, '_blank');
                    }
                }),
        );

        this.isInternet$ = this.preismeldestelle$.map(p => !!p && this.isInternet(p.erhebungsart));
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
