import { Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { reverse } from 'lodash';

import { ReactiveComponent } from '../../../../';

import * as P from '../../../models';
import { Observable } from 'rxjs';

@Component({
    selector: 'preismeldung-info-warenkorb',
    template: `
        <preismeldung-readonly-header [preismeldung]="preismeldung$ | async" [preismeldestelle]="preismeldestelle$ | async" [isAdminApp]="isAdminApp$ | async"></preismeldung-readonly-header>

        <ion-content pef-perfect-virtualscroll-scrollbar [enabled]="isDesktop$ | async">
            <div class="detail-tab-bottom-part">
                <div pef-perfect-scrollbar [enabled]="isDesktop$ | async">
                    <h5 class="large">{{ 'heading_information-about-warenkorbposition' | translate }}</h5>

                    <div class="info-warenkorb-table">
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_standardmenge' | translate }} </div>
                            <div class="info-warenkorb-cell value">
                                {{ (preismeldung$ | async)?.warenkorbPosition.standardmenge }} {{ (preismeldung$ | async)?.warenkorbPosition.standardeinheit
                                | pefPropertyTranslate }}
                            </div>
                        </div>
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_info' | translate }} </div>
                            <div class="info-warenkorb-cell value" [innerHTML]="(preismeldung$ | async)?.warenkorbPosition.info || '&ndash;'"></div>
                        </div>
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_beispiele' | translate }} </div>
                            <div class="info-warenkorb-cell value" [innerHTML]="((preismeldung$ | async)?.warenkorbPosition.beispiele | pefPropertyTranslate) || '&ndash;'"></div>
                        </div>
                        <div class="info-warenkorb-row" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_erfassungszeitraum' | translate }} </div>
                            <div class="info-warenkorb-cell value">
                                Von {{ (preismeldung$ | async)?.refPreismeldung?.erhebungsAnfangsDatum }} <br/> bis {{ (preismeldung$
                                | async)?.refPreismeldung?.erhebungsEndDatum }}
                            </div>
                        </div>
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_periodizitaet' | translate }} </div>
                            <div class="info-warenkorb-cell value">
                                {{ 'label_info-warenkorb_preismeldung-wird-erhoben-im' | translate }}:
                                <ul class="month-list">
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 0)">{{ 1 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 1)">{{ 2 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 2)">{{ 3 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 3)">{{ 4 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 4)">{{ 5 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 5)">{{ 6 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 6)">{{ 7 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 7)">{{ 8 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 8)">{{ 9 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 9)">{{ 10 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 10)">{{ 11 | pefMonthTranslate }}</li>
                                    <li *ngIf="ifMonth((preismeldung$ | async)?.warenkorbPosition.periodizitaetMonat, 11)">{{ 12 | pefMonthTranslate }}</li>
                                </ul>
                            </div>
                        </div>
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_position-im-warenkorb' | translate }} </div>
                            <div class="info-warenkorb-cell value">
                                <div>TOTAL (100)</div>
                                <div *ngFor="let warenkorbInfo of (parentHierarchy$ | async); let i = index" [style.paddingLeft]="'calc(' + (i + 1) + 'em)'">
                                    {{ warenkorbInfo.warenkorbItem.positionsbezeichnung | pefPropertyTranslate }} ({{ warenkorbInfo.warenkorbItem.gliederungspositionsnummer
                                    }})
                                </div>
                            </div>
                        </div>
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_erlaubte-normalpreisentwicklung' | translate }}</div>
                            <div class="info-warenkorb-cell value">
                                {{ (preismeldung$ | async)?.warenkorbPosition.negativeLimite }}%&nbsp;/&nbsp;+{{ (preismeldung$ | async)?.warenkorbPosition.positiveLimite
                                }}%
                            </div>
                        </div>
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_erlaubte-normalpreisentwicklung' | translate }} ({{ 'label_info-warenkorb_code'
                                | translate }}&nbsp;1) </div>
                            <div class="info-warenkorb-cell value">
                                {{ (preismeldung$ | async)?.warenkorbPosition.negativeLimite_1 }}%&nbsp;/&nbsp;+{{ (preismeldung$ | async)?.warenkorbPosition.positiveLimite_1
                                }}%
                            </div>
                        </div>
                        <div class="info-warenkorb-row">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_erlaubte-normalpreisentwicklung' | translate }} ({{ 'label_info-warenkorb_code'
                                | translate }}&nbsp;7) </div>
                            <div class="info-warenkorb-cell value">
                                {{ (preismeldung$ | async)?.warenkorbPosition.negativeLimite_7 }}%&nbsp;/&nbsp;+{{ (preismeldung$ | async)?.warenkorbPosition.positiveLimite_7
                                }}%
                            </div>
                        </div>
                        <div class="info-warenkorb-row" *ngIf="!!((preismeldung$ | async)?.priceCountStatus)">
                            <div class="info-warenkorb-cell heading"> {{ 'label_info-warenkorb_anzahl-preismeldungen' | translate }} </div>
                            <div class="info-warenkorb-cell value">
                                ({{ (preismeldung$ | async)?.priceCountStatus.numActivePrices }}&nbsp;/&nbsp;{{ (preismeldung$ | async)?.priceCountStatus.anzahlPreiseProPMS
                                }})
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ion-content>`
})
export class PreismeldungInfoWarenkorbComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() warenkorb: P.WarenkorbInfo[];
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;

    public preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isAdminApp');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle').publishReplay(1).refCount();

    public parentHierarchy$: Observable<P.WarenkorbInfo[]>;

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor() {
        super();

        const warenkorb$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('warenkorb');

        this.parentHierarchy$ = warenkorb$.combineLatest(this.preismeldung$.filter(x => !!x), (warenkorb, preismeldung) => {
            let warenkorbInfo = warenkorb.find(x => x.warenkorbItem.gliederungspositionsnummer === preismeldung.warenkorbPosition.parentGliederungspositionsnummer);
            let parentHierarchy = [];
            while (!!warenkorbInfo) {
                parentHierarchy = [...parentHierarchy, warenkorbInfo];
                warenkorbInfo = warenkorb.find(x => x.warenkorbItem.gliederungspositionsnummer === warenkorbInfo.warenkorbItem.parentGliederungspositionsnummer);
            }
            return reverse(parentHierarchy);
        });
    }

    ifMonth(v: number, m: number) {
        return v & (1 << m);
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
