import {
    Component,
    Input,
    Output,
    OnChanges,
    SimpleChange,
    EventEmitter,
    ChangeDetectionStrategy,
} from '@angular/core';

import { ReactiveComponent } from '../../../../';

import * as P from '../../../models';
import { Observable } from 'rxjs/Observable';

@Component({
    selector: 'preismeldung-info',
    template: `
        <preismeldung-readonly-header [preismeldung]="preismeldung$ | async" [preismeldestelle]="preismeldestelle$ | async" [isAdminApp]="isAdminApp$ | async"></preismeldung-readonly-header>

        <ion-content pef-perfect-virtualscroll-scrollbar [enabled]="isDesktop$ | async">
            <div class="detail-tab-bottom-part">
                <h5 class="large">{{ 'heading_information-about-preismeldung' | translate }}</h5>

                <div class="info-table">
                    <div class="info-table-row">
                        <div class="info-table-cell-heading">
                            {{ 'label_preismeldung-id' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ formatPreismeldungId(preismeldung$ | async) }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_artikeltext-geliefert' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.artikeltext }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_preis-vor-reduktion' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.preisVorReduktion | pefFormatNumber: numberFormattingOptions }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_menge-vor-reduktion' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.mengeVorReduktion }} {{ (preismeldung$ | async)?.warenkorbPosition.standardeinheit
                            | pefPropertyTranslate }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_datum-vor-reduktion' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.datumVorReduktion }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_anzahl-fehlende-preis-r' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.fehlendePreiseR.length }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_basispreis' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.basisPreis | pefFormatNumber: numberFormattingOptions }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_basismenge' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.basisMenge }} {{ (preismeldung$ | async)?.warenkorbPosition.standardeinheit |
                            pefPropertyTranslate }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_preis-gefuehrt-seit' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.refPreismeldung.preisGueltigSeitDatum }}
                        </div>
                    </div>
                    <div class="info-table-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                        <div class="info-table-cell-heading">
                            {{ 'label_artikelnummer' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            {{ (preismeldung$ | async)?.preismeldung.artikelnummer || '&#x2013;' }}
                        </div>
                    </div>
                    <div class="info-table-row">
                        <div class="info-table-cell-heading">
                            {{ 'label_internetlink' | translate }}
                        </div>
                        <div class="info-table-cell-value">
                            <a *ngIf="(preismeldung$ | async)?.preismeldung.internetLink" href="{{ (formatInternetLink((preismeldung$ | async)?.preismeldung.internetLink)) }}"
                                target="_blank">{{ (preismeldung$ | async)?.preismeldung.internetLink }}</a>
                            <span *ngIf="!(preismeldung$ | async)?.preismeldung.internetLink">&ndash;</span>
                        </div>
                    </div>
                </div>
                <button ion-button class="reset-button" (click)="resetClicked$.emit()" [disabled]="!(canReset$ | async)">{{ (!(preismeldung$ | async)?.refPreismeldung ? 'btn_pm-delete' : 'btn_pm-reset') | translate}}</button>
            </div>
        </ion-content>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungInfoComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Output('resetClicked') resetClicked$ = new EventEmitter();
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isAdminApp');
    public canReset$: Observable<boolean>;

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor() {
        super();

        this.canReset$ = this.preismeldung$
            .withLatestFrom(this.isAdminApp$)
            .filter(([pm]) => !!pm)
            .map(
                ([pm, isAdminApp]) =>
                    !isAdminApp
                        ? !pm.preismeldung.uploadRequestedAt
                        : !!pm.preismeldung.uploadRequestedAt && !pm.exported
            );
    }

    formatPreismeldungId(bag: P.PreismeldungBag) {
        return !bag ? '' : `${bag.preismeldung.pmsNummer}/${bag.preismeldung.epNummer}/${bag.preismeldung.laufnummer}`;
    }

    formatInternetLink(link: string) {
        if (!link) return link;
        return !link.startsWith('http://') || !link.startsWith('https://') ? `http://${link}` : link;
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
