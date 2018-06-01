import {
    Component,
    EventEmitter,
    Input,
    Output,
    SimpleChange,
    OnChanges,
    ChangeDetectionStrategy,
    OnDestroy,
    Inject,
} from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { keys, assign } from 'lodash';
import { isBefore } from 'date-fns';

import {
    ReactiveComponent,
    formatPercentageChange,
    maxMinNumberValidatorFactory,
    PefDialogService,
    PefMessageDialogService,
    preisNumberFormattingOptions,
    preisFormatFn,
    mengeNumberFormattingOptions,
    mengeFormatFn,
    parseErhebungsarten,
    PefDialogValidationErrorsComponent,
} from '../../../../';
import { DialogChoosePercentageReductionComponent } from '../../dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';
import { ElectronService } from '../../../services/electron.service';

import * as P from '../../../models';

@Component({
    selector: 'preismeldung-price',
    template: `
        <form [formGroup]="form" [class.form-show-validation-hints]="showValidationHints$ | async" novalidate>
            <div class="pm-header">
                <div class="pms-heading" *ngIf="isAdminApp$ | async">
                    {{ (preismeldestelle$ | async)?.pmsNummer }} {{ (preismeldestelle$ | async)?.name }}
                </div>
                <div class="header-line">
                    <div class="product-heading">
                        {{ (preismeldung$ | async)?.warenkorbPosition.gliederungspositionsnummer }} {{ (preismeldung$ | async)?.warenkorbPosition.positionsbezeichnung
                        | pefPropertyTranslate }}
                    </div>
                    <ion-item class="pef-item on-dark" *ngIf="!(isInternet$ | async)">
                        <ion-label>{{ 'label_artikelnummer' | translate }}</ion-label>
                        <ion-input type="text" formControlName="artikelnummer" [readonly]="isReadonly$ | async" [class.readonly]="isReadonly$ | async"></ion-input>
                    </ion-item>
                    <ion-item class="pef-item on-dark" *ngIf="isInternet$ | async">
                        <ion-label> {{ 'label_internetlink' | translate }} </ion-label>
                        <ion-input type="text" formControlName="internetLink" [readonly]="isReadonly$ | async" [class.readonly]="isReadonly$ | async"></ion-input>
                    </ion-item>
                    <button class="pef-icon-secondary server-url-button" ion-button icon-only (click)="navigateToInternetLink(form.value.internetLink)"
                        [disabled]="!form.value.internetLink" *ngIf="isInternet$ | async">
                            <pef-icon name="server_url"></pef-icon>
                        </button>
                    <div class="right-column price-count-status" [ngClass]="{ 'ok': (preismeldung$ | async)?.priceCountStatus?.ok, 'not-ok': !(preismeldung$ | async)?.priceCountStatus?.ok }">
                        <span>{{ (preismeldung$ | async)?.priceCountStatus.numActivePrices }}/{{ (preismeldung$ | async)?.priceCountStatus.anzahlPreiseProPMS }}</span>
                    </div>
                </div>
                <div class="header-line">
                    <ion-item class="pef-item on-dark">
                        <ion-label>{{ 'label_artikeltext' | translate }}&nbsp;*</ion-label>
                        <ion-textarea rows="2" type="text" formControlName="artikeltext" [class.validation-error]="true" [readonly]="isReadonly$ | async"
                            [class.readonly]="isReadonly$ | async"></ion-textarea>
                    </ion-item>
                    <div class="right-column">
                        <button *ngIf="!(isAdminApp$ | async)" ion-button icon-only class="pef-icon-secondary duplicate" (click)="duplicatePreismeldung$.emit()"
                            [disabled]="(preismeldung$ | async)?.isModified || (preismeldung$ | async)?.isNew">
                            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                                <g fill="none" fill-rule="evenodd" transform="translate(6 5)">
                                    <polygon class="background-plus" points="6 6 0 6 0 8 6 8 6 14 8 14 8 8 14 8 14 6 8 6 8 0 6 0"/>
                                    <polygon class="foreground-plus" points="6 6 0 6 0 8 6 8 6 14 8 14 8 8 14 8 14 6 8 6 8 0 6 0" transform="translate(5 5)"/>
                                </g>
                            </svg>
                        </button>
                        <ng-content select=".additional-actions"></ng-content>
                    </div>
                </div>
            </div>
            <ion-content pef-perfect-scrollbar [enabled]="true">
                <div class="product-detail-body">
                    <div class="columns product-detail-row row-1">
                        <div class="last-period">
                            <h5 class="large">{{ 'heading_vorperiode' | translate }}</h5>
                            <preismeldung-info-popover-left [class.hidden]="!(preismeldung$ | async)?.refPreismeldung || !(preismeldung$ | async)?.refPreismeldung.aktion"
                                [preismeldung]="preismeldung$ | async" [forceClose]="distinctPreismeldung$ | async" [extraWidth]="window.document.getElementById('row-1-middle-section').offsetWidth + 'px'"
                                [height]="'0px'" (popoverActive)="infoPopoverLeftActive$.emit($event)"></preismeldung-info-popover-left>
                        </div>
                        <div class="middle-section" id="row-1-middle-section"></div>
                        <div class="current-period" id="row-1-current-period">
                            <h5 class="large">{{ 'heading_aktuelle_periode' | translate }}</h5>
                            <preismeldung-info-popover-right [class.hidden]="(preismeldung$ | async)?.preismeldung.bearbeitungscode != 1 || !(preismeldung$ | async)?.preismeldung.aktion"
                                [preismeldung]="preismeldung$ | async" [forceClose]="closePopoverRight$ | async" [popoverLeft]="window.document.getElementById('row-1-middle-section').offsetWidth + 'px + ' + window.document.getElementById('row-1-current-period').offsetWidth + 'px'"
                                [width]="window.document.getElementById('row-1-current-period').offsetWidth + 'px'" [height]="'0px'"
                                (popoverActive)="infoPopoverRightActive$.emit($event)"></preismeldung-info-popover-right>
                        </div>
                    </div>
                    <div class="columns product-detail-row row-2" [class.info-popover-active]="infoPopoverLeftActive$ | async">
                        <div class="last-period" *ngIf="!(preismeldung$ | async)?.refPreismeldung">
                            {{ 'text_nicht_zutreffend' | translate }}
                        </div>
                        <div class="last-period" *ngIf="(preismeldung$ | async)?.refPreismeldung" id="row-2-last-period">
                            <div class="data-input-area" id="last-period-data-input-area">
                                <h6>{{ ((infoPopoverLeftActive$ | async) ? 'heading_artikel-vor-reduktion' : 'heading_artikel') | translate
                                    }} </h6>
                                <div class="last-period-price">
                                    <div class="number">{{ ((infoPopoverLeftActive$ | async) ? (preismeldung$ | async)?.refPreismeldung.preisVorReduktion
                                        : (preismeldung$ | async)?.refPreismeldung.preis) | pefFormatNumber: preisNumberFormattingOptions
                                        }} </div>
                                    <div class="unit">{{ 'text_chf' | translate }}</div>
                                </div>
                                <div class="last-period-quantity">
                                    <div class="number">{{ ((infoPopoverLeftActive$ | async) ? (preismeldung$ | async)?.refPreismeldung.mengeVorReduktion
                                        : (preismeldung$ | async)?.refPreismeldung.menge) | pefFormatNumber: mengeNumberFormattingOptions
                                        }} </div>
                                    <div class="unit">{{ (preismeldung$ | async)?.warenkorbPosition.standardeinheit | pefPropertyTranslate }}</div>
                                </div>
                                <div class="last-period-bottom-row" [class.visibility-hidden]="infoPopoverLeftActive$ | async">
                                    <ion-list radio-group>
                                        <ion-item>
                                            <ion-label>{{ 'text_aktion' | translate }}</ion-label>
                                            <ion-radio value="aktion" [disabled]="true" [checked]="(preismeldung$ | async)?.refPreismeldung?.aktion"></ion-radio>
                                        </ion-item>
                                    </ion-list>
                                    <div class="code">{{ formatFehlendePreiseR((preismeldung$ | async)?.refPreismeldung?.fehlendePreiseR) }}</div>
                                </div>
                            </div>
                            <div class="box-container" [class.visibility-hidden]="!(showVPArtikelNeu$ | async)">
                                <div class="box">
                                    <div class="percentage-wrapper">
                                        <div [innerHTML]="formatPercentageChange((arrowDown$ | async)?.percentage)"></div>
                                        <pef-floating-icon [icon-name]="(arrowDown$ | async)?.warning ? 'warning' : ''"></pef-floating-icon>
                                    </div>
                                </div>
                                <div class="arrow down"></div>
                            </div>
                        </div>
                        <div class="middle-section">
                            <div class="box-container" *ngIf="!!(preismeldung$ | async)?.refPreismeldung">
                                <div class="box">
                                    <div class="percentage-wrapper">
                                        <div [innerHTML]="formatPercentageChange((arrowRight$ | async)?.percentage)"></div>
                                        <pef-floating-icon [icon-name]="(arrowRight$ | async)?.warning ? 'warning' : ''"></pef-floating-icon>
                                    </div>
                                </div>
                                <div class="arrow right"></div>
                            </div>
                        </div>
                        <div class="current-period" id="row-2-current-period">
                            <div class="data-input-area">
                                <h6 [innerHTML]="currentPeriodHeading$ | async | translate"></h6>
                                <ion-list *ngIf="!(infoPopoverRightActive$ | async)">
                                    <ion-item class="pef-item" [class.ng-invalid]="createInvalidObservableFor('preis') | async">
                                        <ion-label class="currency-label">{{ 'text_chf' | translate }}</ion-label>
                                        <ion-input #preis type="number" min="0.00" step="0.01" pef-highlight-on-focus pef-disable-input-number-behaviour pef-disable-input-negative-number
                                            [class.ng-invalid]="createInvalidObservableFor('preis') | async" [readonly]="preisAndMengeDisabled$ | async"
                                            [class.readonly]="preisAndMengeDisabled$ | async" (blur)="preisChanged$.emit(preis.value)" (input)="preisInput$.emit($event.target.value)"
                                            [value]="(preisCurrentValue$ | async)?.value"></ion-input>
                                    </ion-item>
                                    <div class="unit-item-wrapper">
                                        <ion-item class="pef-item" [class.ng-invalid]="createInvalidObservableFor('menge') | async">
                                            <ion-input #menge type="number" step="any" pef-disable-input-number-behaviour pef-disable-input-negative-number [class.ng-invalid]="createInvalidObservableFor('menge') | async"
                                                [readonly]="preisAndMengeDisabled$ | async" [class.readonly]="preisAndMengeDisabled$ | async"
                                                (blur)="mengeChanged$.emit(menge.value)" [value]="form.value.menge" (input)="mengeInput$.emit($event.target.value)"></ion-input>
                                        </ion-item>
                                        <div class="unit-button-wrapper">
                                            <button class="unit-button" ion-button color="mercury" (click)="applyUnitQuickEqual$.emit()" [disabled]="preisAndMengeDisabled$ | async">{{ (preismeldung$ | async)?.warenkorbPosition.standardeinheit | pefPropertyTranslate }}</button>
                                        </div>
                                    </div>
                                </ion-list>
                                <ion-list *ngIf="infoPopoverRightActive$ | async">
                                    <ion-item class="pef-item" [class.ng-invalid]="createInvalidObservableFor('preisVorReduktion') | async">
                                        <ion-label class="currency-label">{{ 'text_chf' | translate }}</ion-label>
                                        <ion-input #preisVorReduktion type="number" min="0.00" step="0.01" pef-highlight-on-focus pef-disable-input-number-behaviour
                                            pef-disable-input-negative-number [class.ng-invalid]="createInvalidObservableFor('preisVorReduktion') | async"
                                            (blur)="preisVorReduktionChanged$.emit(preisVorReduktion.value)" (input)="preisVorReduktionInput$.emit($event.target.value)" [readonly]="isReadonly$ | async"
                                            [class.readonly]="isReadonly$ | async" [value]="form.value.preisVorReduktion"></ion-input>
                                    </ion-item>
                                    <div class="unit-item-wrapper">
                                        <ion-item class="pef-item" [class.ng-invalid]="createInvalidObservableFor('mengeVorReduktion') | async">
                                            <ion-input #mengeVorReduktion type="number" step="any" pef-highlight-on-focus pef-disable-input-number-behaviour pef-disable-input-negative-number
                                                [class.ng-invalid]="createInvalidObservableFor('mengeVorReduktion') | async" (blur)="mengeVorReduktionChanged$.emit(mengeVorReduktion.value)" (input)="mengeVorReduktionInput$.emit($event.target.value)"
                                                [readonly]="isReadonly$ | async" [class.readonly]="isReadonly$ | async" [value]="form.value.mengeVorReduktion"></ion-input>
                                        </ion-item>
                                        <div class="unit-button-wrapper">
                                            <button class="unit-button" ion-button color="mercury" (click)="applyUnitQuickEqual$.emit()" [disabled]="preisAndMengeDisabled$ | async">{{ (preismeldung$ | async)?.warenkorbPosition.standardeinheit | pefPropertyTranslate }}</button>
                                        </div>
                                    </div>
                                </ion-list>
                                <div class="current-period-aktion-row">
                                    <ion-list radio-group class="reduction-radio-group-list" [class.visibility-hidden]="infoPopoverRightActive$ | async">
                                        <ion-item>
                                            <ion-label>{{ 'text_aktion' | translate }}</ion-label>
                                            <ion-radio [checked]="form.value.aktion" (click)="toggleAktion$.emit(!form.value.aktion)" [disabled]="aktionDisabled$ | async"></ion-radio>
                                        </ion-item>
                                    </ion-list>
                                    <div class="aktion-percent-container" [class.visibility-hidden]="!form.value.aktion || !(preismeldung$ | async)?.refPreismeldung || (infoPopoverRightActive$ | async) || (isReadonly$ | async)">
                                        <button class="aktion-percent-button" ion-button color="mercury" (click)="chooseReductionPercentage$.emit()">%</button>
                                    </div>
                                    <div class="code" [class.visibility-hidden]="!formatFehlendePreiseR((preismeldung$ | async)?.preismeldung.fehlendePreiseR)">{{ formatFehlendePreiseR((preismeldung$ | async)?.preismeldung.fehlendePreiseR) }}</div>
                                </div>
                                <bearbeitungs-type [class.visibility-hidden]="infoPopoverRightActive$ | async" formControlName="bearbeitungscode" (change)="changeBearbeitungscode$.emit($event)"
                                    [codeListType]="codeListType$ | async" [readonly]="isReadonly$ | async" [nichtEmpfohleneBc]="(distinctPreismeldung$ | async)?.warenkorbPosition.nichtEmpfohleneBc"></bearbeitungs-type>
                            </div>
                        </div>
                    </div>
                    <div class="columns product-detail-row row-3">
                        <div class="last-period">
                            <div class="data-input-area" *ngIf="showVPArtikelNeu$ | async">
                                <h6 [innerHTML]="'heading_artikel-neu' | translate"></h6>
                                <ion-list>
                                    <ion-item class="pef-item" [class.ng-invalid]="createInvalidObservableFor('preisVPK') | async">
                                        <ion-label>{{ 'text_chf' | translate }}</ion-label>
                                        <ion-input #preisVPK type="number" min="0.00" step="0.01" pef-highlight-on-focus pef-disable-input-number-behaviour pef-disable-input-negative-number
                                            [class.ng-invalid]="createInvalidObservableFor('preisVPK') | async" (blur)="preisVPKChanged$.emit(preisVPK.value)"
                                            [readonly]="isReadonly$ | async" [class.readonly]="isReadonly$ | async" [value]="(preisVPKCurrentValue$ | async)?.value"></ion-input>
                                    </ion-item>
                                    <div class="unit-item-wrapper">
                                        <ion-item class="pef-item" [class.ng-invalid]="createInvalidObservableFor('mengeVPK') | async">
                                            <ion-input #mengeVPK type="number" step="any" pef-highlight-on-focus pef-disable-input-number-behaviour pef-disable-input-negative-number
                                                [class.ng-invalid]="createInvalidObservableFor('mengeVPK') | async" (blur)="mengeVPKChanged$.emit(mengeVPK.value)"
                                                [readonly]="isReadonly$ | async" [class.readonly]="isReadonly$ | async" [value]="form.value.mengeVPK"></ion-input>
                                        </ion-item>
                                        <div class="unit-button-wrapper">
                                            <button class="unit-button" ion-button color="mercury" (click)="applyUnitQuickEqualVP$.emit()" [disabled]="preisAndMengeDisabled$ | async">{{ (preismeldung$ | async)?.warenkorbPosition.standardeinheit | pefPropertyTranslate }}</button>
                                        </div>
                                    </div>
                                </ion-list>
                            </div>
                        </div>
                        <div class="middle-section">
                            <div class="middle-section-container-wrapper">
                                <div class="box-container" *ngIf="showVPArtikelNeu$ | async">
                                    <div class="arrow up-right"></div>
                                    <div class="box">
                                        <div class="percentage-wrapper">
                                            <div [innerHTML]="formatPercentageChange((preismeldung$ | async)?.preismeldung.d_DPToVPK.percentage)"></div>
                                            <pef-floating-icon [icon-name]="(preismeldung$ | async)?.preismeldung.d_DPToVPK.warning ? 'warning' : ''" [bottom-right]="true"></pef-floating-icon>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="current-period">
                            <div class="textzeil" *ngIf="(preismeldung$ | async)?.textzeile?.length">
                                <span *ngFor="let textzeil of (preismeldung$ | async)?.textzeile" [innerHTML]="(textzeil | translate) + '\u00a0'"></span>
                            </div>
                            <div class="buttons-container">
                                <button ion-button color="java" class="save-button" (click)="attemptSave$.emit($event)" [class.look-disabled]="isSaveLookDisabled$ | async">{{ 'btn_erfassung_speichern' | translate }}</button>
                                <button *ngIf="!(isAdminApp$ | async)" ion-button icon-only color="primary" class="next-button" (click)="requestSelectNextPreismeldung$.emit({})">
                                    <pef-icon name="arrow_right"></pef-icon>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="columns product-detail-row row-4">
                        <div class="textzeil">
                            <span *ngFor="let textzeil of (preismeldung$ | async)?.textzeile" [innerHTML]="(textzeil | translate) + '\u00a0'"></span>
                        </div>
                        <button ion-button color="primary" class="save-button" [class.with-top-margin]="!(showChainedReplacementFields$ | async)"
                            (click)="attemptSave$.emit($event)" [class.look-disabled]="isSaveLookDisabled$ | async">{{ 'btn_erfassung_speichern' | translate }}</button>
                        <button *ngIf="!(isAdminApp$ | async)" ion-button icon-only color="primary" class="next-button" [class.with-top-margin]="!(showChainedReplacementFields$ | async)"
                            (click)="requestSelectNextPreismeldung$.emit({})">
                            <pef-icon name="arrow_right"></pef-icon>
                        </button>
                    </div>
                </div>
            </ion-content>
        </form>`,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungPriceComponent extends ReactiveComponent implements OnChanges, OnDestroy {
    @Input() preismeldung: P.CurrentPreismeldungViewBag;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Input() isAdminApp: boolean;
    @Input() requestPreismeldungSave: P.SavePreismeldungPriceSaveAction;
    @Input() requestPreismeldungQuickEqual: string;
    @Input() isDesktop: boolean;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<P.SavePreismeldungPriceSaveAction>;
    @Output('duplicatePreismeldung') duplicatePreismeldung$ = new EventEmitter();
    @Output('requestSelectNextPreismeldung') requestSelectNextPreismeldung$ = new EventEmitter<{}>();
    @Output('requestThrowChanges') requestThrowChanges$: Observable<{}>;
    @Output('isSaveLookDisabled') public isSaveLookDisabled$: Observable<boolean>;
    @Output('disableQuickEqual') disableQuickEqual$: Observable<boolean>;

    public isReadonly$: Observable<boolean>;

    public preismeldung$: Observable<P.CurrentPreismeldungViewBag>;
    public distinctPreismeldung$: Observable<P.CurrentPreismeldungViewBag>;
    public requestPreismeldungSave$: Observable<P.SavePreismeldungPriceSaveAction>;
    public requestPreismeldungQuickEqual$: Observable<string>;
    public codeListType$: Observable<string>;

    public changeBearbeitungscode$ = new EventEmitter<P.Models.Bearbeitungscode>();
    public preisAndMengeDisabled$: Observable<boolean>;
    public aktionDisabled$: Observable<boolean>;
    public showVPArtikelNeu$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();

    public preisChanged$ = new EventEmitter<string>();
    public preisCurrentValue$: Observable<{ value: string }>;
    public mengeChanged$ = new EventEmitter<string>();
    public preisVorReduktionChanged$ = new EventEmitter<string>();
    public mengeVorReduktionChanged$ = new EventEmitter<string>();
    public createInvalidObservableFor: (controlName: string) => Observable<boolean>;

    public preisVPKChanged$ = new EventEmitter<string>();
    public preisVPKCurrentValue$: Observable<{ value: string }>;
    public mengeVPKChanged$ = new EventEmitter<string>();

    public toggleAktion$ = new EventEmitter<boolean>();
    public showSaveWarning$: Observable<boolean>;
    public attemptSave$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;
    public applyUnitQuickEqual$ = new EventEmitter();
    public applyUnitQuickEqualVP$ = new EventEmitter();
    public chooseReductionPercentage$ = new EventEmitter();
    public infoPopoverLeftActive$ = new EventEmitter<boolean>();
    public infoPopoverRightActive$ = new EventEmitter<boolean>();
    public closePopoverRight$: Observable<any>;
    public preisNumberFormattingOptions = preisNumberFormattingOptions;
    public mengeNumberFormattingOptions = mengeNumberFormattingOptions;

    public arrowDown$: Observable<P.Models.PercentageWithWarning>;
    public arrowRight$: Observable<P.Models.PercentageWithWarning>;

    public currentPeriodHeading$: Observable<string>;
    public isSaveDisabled$: Observable<boolean>;

    public isInternet$: Observable<boolean>;

    public preisInput$ = new EventEmitter<string>();
    public mengeInput$ = new EventEmitter<string>();
    public preisVorReduktionInput$ = new EventEmitter<string>();
    public mengeVorReduktionInput$ = new EventEmitter<string>();

    priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    isDesktop$ = this.observePropertyCurrentValue<boolean>('isDesktop');
    isAdminApp$ = this.observePropertyCurrentValue<boolean>('isAdminApp')
        .publishReplay(1)
        .refCount();

    form: FormGroup;

    private subscriptions: Subscription[] = [];

    constructor(
        formBuilder: FormBuilder,
        pefDialogService: PefDialogService,
        pefMessageDialogService: PefMessageDialogService,
        translateService: TranslateService,
        private electronService: ElectronService,
        @Inject('windowObject') public window: any
    ) {
        super();

        const infoPopoverLeftActive$ = this.infoPopoverLeftActive$
            .startWith(false)
            .publishReplay(1)
            .refCount();
        const infoPopoverRightActive$ = this.infoPopoverRightActive$
            .startWith(false)
            .publishReplay(1)
            .refCount();

        this.disableQuickEqual$ = infoPopoverRightActive$;

        this.subscriptions.push(
            this.preisChanged$.subscribe(x => this.form.patchValue({ preis: `${preisFormatFn(x)}` }))
        );
        this.subscriptions.push(
            this.mengeChanged$.subscribe(x => this.form.patchValue({ menge: `${mengeFormatFn(x)}` }))
        );
        this.subscriptions.push(
            this.preisVorReduktionChanged$.subscribe(x =>
                this.form.patchValue({ preisVorReduktion: `${preisFormatFn(x)}` })
            )
        );
        this.subscriptions.push(
            this.mengeVorReduktionChanged$.subscribe(x =>
                this.form.patchValue({ mengeVorReduktion: `${mengeFormatFn(x)}` })
            )
        );
        this.subscriptions.push(
            this.preisVPKChanged$.subscribe(x => this.form.patchValue({ preisVPK: `${preisFormatFn(x)}` }))
        );
        this.subscriptions.push(
            this.mengeVPKChanged$.subscribe(x => this.form.patchValue({ mengeVPK: `${mengeFormatFn(x)}` }))
        );

        this.isInternet$ = this.preismeldestelle$.map(p => !!p && this.isInternet(p.erhebungsart));

        this.form = formBuilder.group(
            {
                pmId: [''],
                preis: [
                    '',
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ]),
                ],
                menge: [
                    '',
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 3 }),
                    ]),
                ],
                preisVorReduktion: [''],
                mengeVorReduktion: [''],
                preisVPK: [''],
                mengeVPK: [''],
                aktion: [false],
                bearbeitungscode: [100, Validators.required],
                artikelnummer: [''],
                internetLink: [''],
                artikeltext: ['', Validators.required],
            },
            { validator: this.formLevelValidationFactory() }
        );

        this.preismeldung$ = this.observePropertyCurrentValue<P.CurrentPreismeldungViewBag>('preismeldung')
            .publishReplay(1)
            .refCount();
        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<P.SavePreismeldungPriceSaveAction>(
            'requestPreismeldungSave'
        ).filter(x => !!x);
        this.requestPreismeldungQuickEqual$ = this.observePropertyCurrentValue<string>(
            'requestPreismeldungQuickEqual'
        ).filter(x => !!x);

        this.distinctPreismeldung$ = this.preismeldung$
            .filter(x => !!x)
            .distinctUntilChanged((x, y) => x.pmId === y.pmId && x.resetEvent === y.resetEvent)
            .publishReplay(1)
            .refCount();

        this.preisCurrentValue$ = this.form.valueChanges
            .map(() => this.form.value.preis)
            .merge(this.distinctPreismeldung$.map(x => x.preismeldung.preis))
            .map(x => ({ value: `${preisFormatFn(x)}` }))
            .publishReplay(1)
            .refCount();
        this.subscriptions.push(this.preisCurrentValue$.subscribe());

        this.preisVPKCurrentValue$ = this.form.valueChanges
            .map(() => this.form.value.preisVPK)
            .merge(this.distinctPreismeldung$.map(x => x.preismeldung.preisVPK))
            .map(x => ({ value: `${preisFormatFn(x)}` }));

        this.closePopoverRight$ = this.distinctPreismeldung$.merge(
            this.preismeldung$.filter(x => !!x && !x.preismeldung.aktion).map(() => ({}))
        );

        this.subscriptions.push(
            this.distinctPreismeldung$.subscribe(bag => {
                this.form.reset({
                    pmId: bag.pmId,
                    preis: bag.preismeldung.preis,
                    menge: bag.preismeldung.menge,
                    preisVorReduktion: bag.preismeldung.preisVorReduktion,
                    mengeVorReduktion: bag.preismeldung.mengeVorReduktion,
                    aktion: bag.preismeldung.aktion,
                    preisVPK: bag.preismeldung.preisVPK,
                    mengeVPK: bag.preismeldung.mengeVPK,
                    bearbeitungscode: bag.preismeldung.bearbeitungscode,
                    artikelnummer: bag.preismeldung.artikelnummer,
                    internetLink: bag.preismeldung.internetLink,
                    artikeltext: bag.preismeldung.artikeltext,
                });
            })
        );

        this.subscriptions.push(
            this.preismeldung$.filter(x => !!x).subscribe(preismeldung => {
                this.form.patchValue(
                    {
                        aktion: preismeldung.preismeldung.aktion,
                    },
                    { emitEvent: false }
                );
            })
        );

        this.subscriptions.push(
            this.requestPreismeldungQuickEqual$
                .withLatestFrom(this.distinctPreismeldung$, (_, currentPm: P.CurrentPreismeldungBag) => currentPm)
                .subscribe(currentPm => {
                    this.form.patchValue({
                        preis: `${currentPm.refPreismeldung ? preisFormatFn(currentPm.refPreismeldung.preis) : ''}`,
                        menge: `${currentPm.refPreismeldung ? mengeFormatFn(currentPm.refPreismeldung.menge) : ''}`,
                        aktion: currentPm.refPreismeldung.aktion,
                    });
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqual$
                .withLatestFrom(
                    this.distinctPreismeldung$,
                    infoPopoverRightActive$,
                    (_, preismeldung: P.CurrentPreismeldungBag, infoPopoverRightActive: boolean) => ({
                        preismeldung,
                        infoPopoverRightActive,
                    })
                )
                .subscribe(({ preismeldung, infoPopoverRightActive }) => {
                    if (!infoPopoverRightActive) {
                        this.form.patchValue({
                            menge: `${
                                preismeldung.refPreismeldung
                                    ? mengeFormatFn(preismeldung.refPreismeldung.menge)
                                    : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)
                            }`,
                        });
                    } else {
                        this.form.patchValue({
                            mengeVorReduktion: `${
                                preismeldung.refPreismeldung
                                    ? mengeFormatFn(preismeldung.refPreismeldung.menge)
                                    : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)
                            }`,
                        });
                    }
                })
        );

        this.subscriptions.push(
            this.applyUnitQuickEqualVP$
                .withLatestFrom(this.distinctPreismeldung$, (_, preismeldung: P.CurrentPreismeldungBag) => preismeldung)
                .subscribe(preismeldung => {
                    this.form.patchValue({
                        mengeVPK: `${
                            preismeldung.refPreismeldung
                                ? mengeFormatFn(preismeldung.refPreismeldung.menge)
                                : mengeFormatFn(preismeldung.warenkorbPosition.standardmenge)
                        }`,
                    });
                })
        );

        this.subscriptions.push(
            this.toggleAktion$.subscribe(newAktionValue => {
                this.form.patchValue({
                    aktion: newAktionValue,
                });
            })
        );

        const bearbeitungscodeChanged$ = this.changeBearbeitungscode$
            .merge(this.distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .publishReplay(1)
            .refCount();

        this.subscriptions.push(
            this.toggleAktion$
                .combineLatest(bearbeitungscodeChanged$, (newAktionValue, bearbeitungscode) => ({
                    newAktionValue,
                    bearbeitungscode,
                }))
                .subscribe(x => {
                    if (!x.newAktionValue || x.bearbeitungscode !== 1) {
                        this.form.patchValue({
                            preisVorReduktion: '',
                            mengeVorReduktion: '',
                        });
                    }
                })
        );

        this.subscriptions.push(
            this.chooseReductionPercentage$
                .flatMap(() =>
                    pefDialogService
                        .displayDialog(DialogChoosePercentageReductionComponent, null, true)
                        .map(x => x.data)
                )
                .filter(x => !!x && x.type === 'OK')
                .subscribe(({ percentage }) => {
                    const currentPreis = parseFloat(this.form.value.preis);
                    if (isNaN(currentPreis)) return;
                    this.form.patchValue({
                        preis: `${(currentPreis - currentPreis * (percentage / 100)).toFixed(2)}`,
                    });
                })
        );

        this.codeListType$ = this.distinctPreismeldung$.map(
            x =>
                x.preismeldung.bearbeitungscode === 2 || x.preismeldung.bearbeitungscode === 3 ? 'NEW_PM' : 'STANDARD'
        );

        this.preismeldungPricePayload$ = this.form.valueChanges.map(() => ({
            preis: this.form.value.preis,
            menge: this.form.value.menge,
            aktion: this.form.value.aktion,
            preisVorReduktion: this.form.value.preisVorReduktion,
            mengeVorReduktion: this.form.value.mengeVorReduktion,
            preisVPK: this.form.value.preisVPK,
            mengeVPK: this.form.value.mengeVPK,
            bearbeitungscode: this.form.value.bearbeitungscode,
            artikelnummer: this.form.value.artikelnummer,
            internetLink: this.form.value.internetLink,
            artikeltext: this.form.value.artikeltext,
        }));

        this.isReadonly$ = this.distinctPreismeldung$
            .map(x => x.isReadonly)
            .publishReplay(1)
            .refCount();

        this.isSaveDisabled$ = this.preismeldung$
            .filter(x => !!x)
            .combineLatest(this.isReadonly$, (bag, isReadonly) => !bag.isModified || isReadonly)
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();

        const hasChanged = (
            input$: Observable<string>,
            changed$: Observable<string>,
            selector: (bag: P.CurrentPreismeldungViewBag) => string
        ) =>
            input$.withLatestFrom(
                changed$.merge(this.preismeldung$.filter(x => !!x).map(selector)),
                (i, c) => +i === +c
            );

        this.isSaveLookDisabled$ = this.distinctPreismeldung$
            .combineLatest(
                hasChanged(this.preisInput$, this.preisChanged$, bag => bag.preismeldung.preis)
                    .merge(
                        hasChanged(this.mengeInput$, this.mengeChanged$, bag => bag.preismeldung.menge),
                        hasChanged(
                            this.preisVorReduktionInput$,
                            this.preisVorReduktionChanged$,
                            bag => bag.preismeldung.preisVorReduktion
                        ),
                        hasChanged(
                            this.mengeVorReduktionInput$,
                            this.mengeVorReduktionChanged$,
                            bag => bag.preismeldung.mengeVorReduktion
                        ),
                        this.preismeldung$
                            .filter(x => !!x)
                            .map(x => x.isModified)
                            .distinctUntilChanged()
                            .map(x => !x)
                    )
                    .startWith(true)
                    .distinctUntilChanged(),
                (bag, changed) => (!bag || bag.isReadonly ? true : changed)
            )
            .distinctUntilChanged()
            .publishReplay(1)
            .refCount();

        this.preisAndMengeDisabled$ = bearbeitungscodeChanged$
            .map(x => this.calcPreisAndMengeDisabled(x))
            .combineLatest(
                this.isReadonly$,
                (disabledBasedOnBearbeitungsCode, isReadonly) => disabledBasedOnBearbeitungsCode || isReadonly
            )
            .publishReplay(1)
            .refCount();

        this.aktionDisabled$ = this.preisAndMengeDisabled$
            .combineLatest(
                bearbeitungscodeChanged$,
                (preisAndMengeDisabled, bearbeitungsCode) => preisAndMengeDisabled || bearbeitungsCode === 3
            )
            .publishReplay(1)
            .refCount();

        this.showVPArtikelNeu$ = bearbeitungscodeChanged$
            .map(x => x === 7 || x === 2)
            .publishReplay(1)
            .refCount();

        this.subscriptions.push(
            this.showVPArtikelNeu$.filter(x => !x && this.form.dirty).subscribe(() => {
                this.form.patchValue({
                    preisVPK: '',
                    mengeVPK: '',
                });
            })
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .filter(x => x && this.form.dirty)
                .withLatestFrom(
                    this.distinctPreismeldung$.map(x => x.refPreismeldung),
                    (_, refPreismeldung) => refPreismeldung
                )
                .subscribe(refPreismeldung => {
                    this.form.patchValue({
                        preis: `${preisFormatFn(refPreismeldung.preis)}`,
                        menge: `${refPreismeldung.menge}`,
                        aktion: refPreismeldung.aktion,
                    });
                })
        );

        this.subscriptions.push(
            bearbeitungscodeChanged$
                .map(x => x === 3)
                .filter(x => x)
                .subscribe(() => {
                    this.form.patchValue({
                        aktion: false,
                    });
                })
        );

        this.subscriptions.push(
            this.preisAndMengeDisabled$
                .distinctUntilChanged()
                .filter(x => !x && this.form.dirty)
                .subscribe(() => {
                    this.form.patchValue({
                        preis: '',
                        menge: '',
                        aktion: false,
                    });
                })
        );

        const canSave$ = this.attemptSave$
            .mapTo({ type: 'JUST_SAVE' } as P.SavePreismeldungPriceSaveAction)
            .merge(this.requestPreismeldungSave$)
            .withLatestFrom(this.isSaveDisabled$, (saveAction, isSaveDisabled) => ({ saveAction, isSaveDisabled }))
            .filter(x => !x.isSaveDisabled)
            .map(({ saveAction }) => ({ saveAction, isValid: this.form.valid }))
            .publishReplay(1)
            .refCount();

        const saveWithBag$ = canSave$
            .filter(x => x.isValid)
            .map(x => x.saveAction)
            .withLatestFrom(this.preismeldung$, (saveAction, bag) => ({ saveAction, bag }))
            .publishReplay(1)
            .refCount();

        this.subscriptions.push(
            saveWithBag$
                .filter(x => x.bag.hasAttributeWarning)
                .flatMap(() =>
                    pefDialogService.displayDialog(
                        PefDialogValidationErrorsComponent,
                        [translateService.instant('validation_produktMerkmale_erfassen')],
                        true
                    )
                )
                .subscribe()
        );

        const saveLogic$ = saveWithBag$
            .withLatestFrom(this.isAdminApp$.startWith(false), (x, isAdminApp) => assign({}, x, { isAdminApp }))
            .filter(x => !x.bag.hasAttributeWarning)
            .flatMap(({ saveAction, bag, isAdminApp }) => {
                const alerts: {
                    condition: () => boolean;
                    observable: () => Observable<P.SavePreismeldungPriceSaveAction>;
                }[] = [
                    {
                        condition: () =>
                            !isAdminApp &&
                            !!bag.refPreismeldung &&
                            !!bag.refPreismeldung.bemerkungen &&
                            bag.messages.bemerkungen === '',
                        observable: () =>
                            pefDialogService
                                .displayDialog(
                                    PefDialogValidationErrorsComponent,
                                    [translateService.instant('validation_frage-antworten')],
                                    true
                                )
                                .map(
                                    () =>
                                        ({
                                            type: 'NO_SAVE_NAVIGATE',
                                            tabName: 'MESSAGES',
                                        } as P.SavePreismeldungPriceSaveAction)
                                ),
                    },
                    {
                        condition: () => !isAdminApp && bag.hasPriceWarning,
                        observable: () =>
                            Observable.if(
                                () => !bag.messages.kommentar,
                                Observable.defer(() =>
                                    pefMessageDialogService.displayMessageDialog(
                                        [
                                            { textKey: 'btn_yes', dismissValue: 'YES' },
                                            { textKey: 'btn_verwerfen', dismissValue: 'THROW_CHANGES' },
                                            { textKey: 'btn_edit-comment', dismissValue: 'EDIT' },
                                        ],
                                        'dialogText_abnormal-preisentwicklung'
                                    )
                                ),
                                // Always write autotext for "hasPriceWarning" https://github.com/Lambda-IT/lik-studio/issues/339
                                Observable.of({ data: 'YES' })
                            ).map(res => {
                                switch (res.data) {
                                    case 'YES':
                                        return {
                                            type: saveAction.type,
                                            saveWithData: [
                                                {
                                                    type: 'COMMENT',
                                                    comments: [
                                                        'kommentar-autotext_abnormale-preisentwicklung-bestaetigt',
                                                    ],
                                                },
                                            ],
                                        };
                                    case 'THROW_CHANGES':
                                        return 'THROW_CHANGES';
                                    case 'EDIT':
                                        return { type: 'CANCEL' };
                                }
                            }),
                    },
                    {
                        condition: () =>
                            !isAdminApp &&
                            [1, 7].some(code => code === this.form.value.bearbeitungscode) &&
                            bag.refPreismeldung.artikeltext === this.form.value.artikeltext &&
                            bag.refPreismeldung.artikelnummer === this.form.value.artikelnummer,
                        observable: () =>
                            pefMessageDialogService.displayDialogYesNo('dialogText_unveraendert-pm-text').map(
                                res =>
                                    res.data === 'YES'
                                        ? {
                                              type: saveAction.type,
                                              saveWithData: [
                                                  {
                                                      type: 'COMMENT',
                                                      comments: [
                                                          'kommentar-autotext_artikeltext-unveraendert-bestaetigt',
                                                      ],
                                                  },
                                              ],
                                          }
                                        : { type: 'CANCEL' }
                            ),
                    },
                    {
                        // Issue #94
                        // Codes 99, 1
                        // Falls mehrmals hintereinander A gesetzt wird, kann Preis theoretisch höher, gleich oder unter VP-Meldung liegen. Normalfall ist im Ausverkauf jedoch, dass die „Aktion“ unverändert oder tiefer als VP zu liegen kommt.
                        // -> Falls Aktionspreis/ Menge in T über VP: Warnmeldung im Sinne von „Ist der Preis noch in Aktion ? Bitte überprüfen und [zurück zur Eingabe] / [verwerfen] / [bestätigen]“.
                        condition: () =>
                            !isAdminApp &&
                            [99, 1].some(x => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            bag.refPreismeldung.aktion &&
                            bag.preismeldung.d_DPToVP.percentage > 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayDialogYesNoEdit('dialogText_aktion-message-preis-hoeher')
                                .map(
                                    res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                                ? {
                                                      type: saveAction.type,
                                                      saveWithData: [
                                                          {
                                                              type: 'COMMENT',
                                                              comments: [
                                                                  'kommentar-autotext_steigender-aktionspreis-bestaetigt',
                                                              ],
                                                          },
                                                      ],
                                                  }
                                                : {
                                                      type: saveAction.type,
                                                      saveWithData: [{ type: 'AKTION', value: false }],
                                                  }
                                ),
                    },
                    {
                        // Issue #94
                        // Codes 99, 1
                        // Falls Preis/Menge in T gleich/kleiner Aktionspreis/Menge VP, jedoch kein Flag A in T gesetzt ist, Message: „Ist Artikel aktuell in Aktion?“
                        // [JA](Flag A in T schreiben/Speichern/Forward) / [NEIN](Bemerkung: „Nicht mehr Aktion bei unverändertem Preis“/Speichern/Forward)
                        condition: () =>
                            !isAdminApp &&
                            [99, 1].some(x => x === this.form.value.bearbeitungscode) &&
                            !this.form.value.aktion &&
                            !!bag.refPreismeldung &&
                            bag.refPreismeldung.aktion &&
                            bag.preismeldung.d_DPToVP.percentage <= 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayDialogYesNoEdit(
                                    'dialogText_vp_aktionspreis-gleich-hoeher-aktueller-normalpreis'
                                )
                                .map(
                                    res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                                ? {
                                                      type: saveAction.type,
                                                      saveWithData: [{ type: 'AKTION', value: true }],
                                                  }
                                                : {
                                                      type: saveAction.type,
                                                      saveWithData: [
                                                          {
                                                              type: 'COMMENT',
                                                              comments: [
                                                                  'kommentar-autotext_aktueller-normalpreis-billiger-aktionspreis_vp',
                                                              ],
                                                          },
                                                      ],
                                                  }
                                ),
                    },
                    {
                        // Issue #94
                        // Codes 99, 1, 77
                        // Falls Aktionspreis/Menge in T grösser/gleich Preis/Menge VP, jedoch kein Aktionsflag in VP gesetzt ist, Dialog öffnen: „Aktueller Aktionspreis ist gleich oder grösser als Normalpreis in VP. Stimmt der erfasste Preis?“ mit [JA]
                        // -> autotext / [EDIT] / [Kommentar] -> falls möglich direkt zu Kommentarfeld wechseln (oder falls aufwändig zurück zur normalen Maske, also EDIT)
                        condition: () =>
                            !isAdminApp &&
                            [99, 1].some(x => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            !!bag.refPreismeldung &&
                            !bag.refPreismeldung.aktion &&
                            bag.preismeldung.d_DPToVP.percentage >= 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayMessageDialog(
                                    [
                                        { textKey: 'btn_yes', dismissValue: 'YES' },
                                        { textKey: 'btn_edit', dismissValue: 'EDIT' },
                                        { textKey: 'btn_comment', dismissValue: 'COMMENT' },
                                    ],
                                    'dialogText_aktueller-aktionspreis-gleich-groesser-vp-normalpreis'
                                )
                                .map(
                                    res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                                ? {
                                                      type: saveAction.type,
                                                      saveWithData: [
                                                          {
                                                              type: 'COMMENT',
                                                              comments: [
                                                                  'kommentar-autotext_aktueller-aktionspreis-teuerer-normalpreis-vp',
                                                              ],
                                                          },
                                                      ],
                                                  }
                                                : {
                                                      type: 'SAVE_AND_NAVIGATE_TAB',
                                                      saveWithData: [{ type: 'COMMENT', comments: [] }],
                                                      tabName: 'MESSAGES',
                                                  }
                                ),
                    },
                    {
                        // Issue #151
                        // Code 2
                        // Falls Aktionspreis/Menge in T grösser/gleich Preis/Menge VPK, Dialog öffnen: „Aktueller Aktionspreis ist gleich oder grösser als Normalpreis in VP. Stimmt der erfasste Preis?“ mit [JA]
                        // -> autotext / [EDIT] / [Kommentar] -> falls möglich direkt zu Kommentarfeld wechseln (oder falls aufwändig zurück zur normalen Maske, also EDIT)
                        condition: () =>
                            !isAdminApp &&
                            [2, 7].some(x => x === this.form.value.bearbeitungscode) &&
                            this.form.value.aktion &&
                            bag.preismeldung.d_DPToVPK.percentage >= 0,
                        observable: () =>
                            pefMessageDialogService
                                .displayMessageDialog(
                                    [
                                        { textKey: 'btn_yes', dismissValue: 'YES' },
                                        { textKey: 'btn_edit', dismissValue: 'EDIT' },
                                        { textKey: 'btn_comment', dismissValue: 'COMMENT' },
                                    ],
                                    'dialogText_aktueller-aktionspreis-gleich-groesser-vp-normalpreis'
                                )
                                .map(
                                    res =>
                                        res.data === 'EDIT'
                                            ? { type: 'CANCEL' }
                                            : res.data === 'YES'
                                                ? {
                                                      type: saveAction.type,
                                                      saveWithData: [
                                                          {
                                                              type: 'COMMENT',
                                                              comments: [
                                                                  'kommentar-autotext_aktueller-aktionspreis-teuerer-normalpreis-vp',
                                                              ],
                                                          },
                                                      ],
                                                  }
                                                : {
                                                      type: 'SAVE_AND_NAVIGATE_TAB',
                                                      saveWithData: [{ type: 'COMMENT', comments: [] }],
                                                      tabName: 'MESSAGES',
                                                  }
                                ),
                    },
                    {
                        condition: () =>
                            !isAdminApp &&
                            this.form.value.bearbeitungscode === 101 &&
                            /^R+$/.exec(bag.refPreismeldung.fehlendePreiseR) &&
                            bag.refPreismeldung.fehlendePreiseR.length >= 2,
                        observable: () =>
                            pefMessageDialogService
                                .displayDialogYesNo('dialogText_rrr-message-mit-aufforderung-zu-produktersatz')
                                .map(
                                    res =>
                                        res.data === 'YES'
                                            ? { type: 'CANCEL' }
                                            : {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: ['kommentar-autotext_keine-ersatzprodukte'],
                                                      },
                                                  ],
                                              }
                                ),
                    },
                    {
                        condition: () =>
                            !isAdminApp &&
                            this.form.value.bearbeitungscode === 0 &&
                            bag.priceCountStatus.numActivePrices < bag.priceCountStatus.anzahlPreiseProPMS,
                        observable: () => {
                            const params = {
                                numActivePrices: bag.priceCountStatus.numActivePrices,
                                anzahlPreiseProPMS: bag.priceCountStatus.anzahlPreiseProPMS,
                            };
                            return pefMessageDialogService
                                .displayDialogYesNo('dialogText_aufforderung-ersatzsuche', params)
                                .map(
                                    res =>
                                        res.data === 'YES'
                                            ? {
                                                  type: 'SAVE_AND_DUPLICATE_PREISMELDUNG',
                                                  saveWithData: [{ type: 'COMMENT', comments: [] }],
                                              }
                                            : {
                                                  type: saveAction.type,
                                                  saveWithData: [
                                                      {
                                                          type: 'COMMENT',
                                                          comments: ['kommentar-autotext_keine-produkte'],
                                                      },
                                                  ],
                                              }
                                );
                        },
                    },
                ];

                const alertsToExecute = alerts.filter(x => x.condition()).map(x => x.observable);

                return alertsToExecute.length > 0
                    ? (alertsToExecute.reduce((agg, v) => {
                          if (!agg) return v();
                          return (agg as any).flatMap(lastAlertResult => {
                              if (
                                  lastAlertResult === 'THROW_CHANGES' ||
                                  ['CANCEL', 'NO_SAVE_NAVIGATE'].some(x => x === lastAlertResult.type)
                              )
                                  return Observable.of(lastAlertResult);
                              return v().map(thisAlertResult => {
                                  if (
                                      P.isSavePreismeldungPriceSaveActionSave(lastAlertResult) &&
                                      P.isSavePreismeldungPriceSaveActionSave(thisAlertResult)
                                  ) {
                                      return assign({}, thisAlertResult, {
                                          saveWithData: (thisAlertResult as P.SavePreismeldungPriceSaveActionSave).saveWithData.concat(
                                              lastAlertResult.saveWithData
                                          ),
                                      });
                                  } else {
                                      return thisAlertResult;
                                  }
                              });
                          });
                      }, null) as Observable<P.SavePreismeldungPriceSaveAction | string>)
                    : Observable.of({ type: saveAction.type, saveWithData: [{ type: 'COMMENT', comments: [] }] } as
                          | P.SavePreismeldungPriceSaveAction
                          | string);
            })
            .publishReplay(1)
            .refCount();

        this.save$ = saveLogic$.filter(
            x => x !== 'THROW_CHANGES' && (x as P.SavePreismeldungPriceSaveAction).type !== 'CANCEL'
        );
        this.requestThrowChanges$ = saveLogic$.filter(x => x === 'THROW_CHANGES').mapTo({});

        this.showValidationHints$ = canSave$
            .distinctUntilChanged()
            .mapTo(true)
            .merge(this.distinctPreismeldung$.mapTo(false));

        this.subscriptions.push(
            canSave$
                .filter(x => !x.isValid)
                .map(() =>
                    keys(this.form.controls)
                        .filter(x => !!this.form.controls[x].errors)
                        .map(controlName => {
                            const control = this.form.controls[controlName];
                            const errorKey = keys(control.errors)[0];
                            const errorParams = assign({}, control.errors[errorKey], {
                                controlName: translateService.instant(`control_${controlName}`),
                            });
                            return translateService.instant(`validation_formatted_${errorKey}`, errorParams);
                        })
                )
                .flatMap(errorMessages =>
                    pefDialogService.displayDialog(PefDialogValidationErrorsComponent, errorMessages, true)
                )
                .subscribe()
        );

        this.currentPeriodHeading$ = this.changeBearbeitungscode$
            .merge(this.distinctPreismeldung$.map(x => x.preismeldung.bearbeitungscode))
            .combineLatest(infoPopoverRightActive$, (bearbeitungscode, infoPopoverRightActive) => {
                if (infoPopoverRightActive) {
                    return 'heading_artikel-ausser-aktion';
                }
                return [7, 2, 3].some(x => x === bearbeitungscode) ? 'heading_artikel-neu' : 'heading_artikel';
            });

        const showInvalid$ = this.form.valueChanges
            .merge(this.attemptSave$)
            .publishReplay(1)
            .refCount();
        this.createInvalidObservableFor = (controlName: string) =>
            showInvalid$.map(() => !!this.form.controls[controlName].errors);

        this.arrowDown$ = infoPopoverLeftActive$
            .combineLatest(this.preismeldung$, (infoPopoverLeftActive, bag) => ({ infoPopoverLeftActive, bag }))
            .filter(x => !!x.bag)
            .map(
                x =>
                    x.infoPopoverLeftActive
                        ? x.bag.preismeldung.d_VPKToVPVorReduktion
                        : x.bag.preismeldung.d_VPKToVPAlterArtikel
            )
            .publishReplay(1)
            .refCount();

        this.arrowRight$ = this.preismeldung$
            .combineLatest(
                infoPopoverLeftActive$,
                infoPopoverRightActive$,
                (bag, infoPopoverLeftActive, infoPopoverRightActive) => ({
                    bag,
                    infoPopoverLeftActive,
                    infoPopoverRightActive,
                })
            )
            .filter(x => !!x.bag)
            .map(x => {
                if (x.infoPopoverLeftActive && x.infoPopoverRightActive)
                    return x.bag.preismeldung.d_DPVorReduktionToVPVorReduktion;
                if (!x.infoPopoverLeftActive && x.infoPopoverRightActive)
                    return x.bag.preismeldung.d_DPVorReduktionToVP;
                if (x.infoPopoverLeftActive && !x.infoPopoverRightActive)
                    return x.bag.preismeldung.d_DPToVPVorReduktion;
                return x.bag.preismeldung.d_DPToVP;
            })
            .publishReplay(1)
            .refCount();
    }

    calcPreisAndMengeDisabled(bearbeitungscode: P.Models.Bearbeitungscode) {
        return [0, 44, 101].some(x => x === bearbeitungscode);
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 1);

    formatFehlendePreiseR(fehlendePreiseR: string) {
        if (!/.^R*$/.exec(fehlendePreiseR)) return fehlendePreiseR;
        return fehlendePreiseR.length >= 4 ? `R${fehlendePreiseR.length}` : fehlendePreiseR;
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

    foobar(e) {
        console.log('asdfasdf', e);
    }

    formLevelValidationFactory() {
        return (group: FormGroup) => {
            const bearbeitungscode = group.get('bearbeitungscode');
            const aktion = group.get('aktion');
            if (!![2, 7].some(x => x === bearbeitungscode.value)) {
                const preisVPK = group.get('preisVPK');
                preisVPK.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ])(preisVPK)
                );
                const mengeVPK = group.get('mengeVPK');
                mengeVPK.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 2 }),
                    ])(mengeVPK)
                );
            } else if (bearbeitungscode.value === 1 && !!aktion.value) {
                const preisVorReduktion = group.get('preisVorReduktion');
                preisVorReduktion.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 4 }),
                    ])(preisVorReduktion)
                );
                const mengeVorReduktion = group.get('mengeVorReduktion');
                mengeVorReduktion.setErrors(
                    Validators.compose([
                        Validators.required,
                        maxMinNumberValidatorFactory(0.01, 9999999.99, { padRight: 2, truncate: 2 }),
                    ])(mengeVorReduktion)
                );
            }
        };
    }

    navigateToInternetLink(internetLink: string) {
        if (!internetLink) return;

        let _internetLink = internetLink;
        if (!internetLink.startsWith('http://') || !internetLink.startsWith('https://')) {
            _internetLink = `http://${internetLink}`;
        }
        if (this.isDesktop) {
            this.electronService.openExternal(_internetLink);
        } else {
            this.window.open(_internetLink, '_blank');
        }
    }
}
