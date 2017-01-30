import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { keys } from 'lodash';

import { ReactiveComponent } from '../../../../../common/ReactiveComponent';
import { formatPercentageChange } from '../../../../../common/formatting-functions';
import { maxMinNumberValidatorFactory } from '../../../../../common/validators';

import * as P from '../../../../../common-models';
import { PefDialogService } from '../../../../../common/pef-dialog-service';

import { DialogCancelEditComponent } from './dialog-cancel-edit/dialog-cancel-edit';
import { DialogValidationErrorsComponent } from './dialog-validation-errors/dialog-validation-errors';

interface PercentageValues {
    lastPeriodToThisPeriod: string;
}

@Component({
    selector: 'preismeldung-detail-price',
    templateUrl: 'preismeldung-detail-price.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreismeldungDetailPriceComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.Preismeldung;
    @Input() requestPreismeldungSave: string;
    @Input() requestPreismeldungQuickEqual: string;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<{ saveAction: P.SavePreismeldungPricePayloadType }>;

    public preismeldung$: Observable<P.Preismeldung>;
    public requestPreismeldungSave$: Observable<string>;
    public requestPreismeldungQuickEqual$: Observable<string>;

    public showChainedReplacementFields$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();
    public formValueChanged$ = new EventEmitter<string>();

    public toggleReduction$ = new EventEmitter<string>();
    public reduction$: Observable<string>;
    public showSaveWarning$: Observable<boolean>;
    public percentageValues$: Observable<PercentageValues>;
    public attemptSave$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;
    public applyUnitQuickEqual$ = new EventEmitter();

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    form: FormGroup;

    constructor(formBuilder: FormBuilder, pefDialogService: PefDialogService, translateService: TranslateService) {
        super();

        this.form = formBuilder.group({
            currentPeriodPrice: [null, Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 2 })])],
            currentPeriodQuantity: [null, Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999.99, { padRight: 2, truncate: 2 })])],
            reductionType: [null],
            currentPeriodProcessingCode: ['STANDARD_ENTRY', Validators.required],
            artikelNummer: [null],
            artikelText: [null, Validators.required]
        });

        this.preismeldung$ = this.observePropertyCurrentValue<P.Preismeldung>('preismeldung');
        this.requestPreismeldungSave$ = this.observePropertyCurrentValue<string>('requestPreismeldungSave').filter(x => !!x);
        this.requestPreismeldungQuickEqual$ = this.observePropertyCurrentValue<string>('requestPreismeldungQuickEqual').filter(x => !!x);

        const distinctPreismeldung$ = this.preismeldung$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_id');

        distinctPreismeldung$
            .subscribe(preismeldung => {
                this.form.patchValue({
                    currentPeriodPrice: preismeldung.currentPeriodPrice,
                    currentPeriodQuantity: preismeldung.currentPeriodQuantity,
                    reductionType: preismeldung.currentPeriodIsAktion ? 'aktion' : preismeldung.currentPeriodIsAusverkauf ? 'ausverkauf' : null,
                    currentPeriodProcessingCode: preismeldung.currentPeriodProcessingCode,
                    artikelNummer: preismeldung.artikelNummer,
                    artikelText: preismeldung.artikelText
                });
            });

        this.requestPreismeldungQuickEqual$.withLatestFrom(this.preismeldung$, (_, preismeldung: P.CurrentPreismeldung) => preismeldung)
            .subscribe(preismeldung => {
                this.form.patchValue({
                    currentPeriodPrice: preismeldung.preisT,
                    currentPeriodQuantity: preismeldung.mengeT,
                });
                this.formValueChanged$.emit();
            });

        this.applyUnitQuickEqual$.withLatestFrom(this.preismeldung$, (_, preismeldung: P.CurrentPreismeldung) => preismeldung)
            .subscribe(preismeldung => {
                this.form.patchValue({
                    currentPeriodQuantity: preismeldung.mengeT,
                });
                this.formValueChanged$.emit();
            });

        this.reduction$ = this.toggleReduction$
            .scan((currentReduction, toggledReduction) => {
                if (currentReduction === toggledReduction) return null;
                return toggledReduction;
            })
            .publishReplay(1).refCount();

        const distinctReduction$ = this.reduction$.distinctUntilChanged();

        distinctReduction$
            .subscribe(x => this.form.patchValue({ reductionType: x }));

        this.preismeldungPricePayload$ = this.formValueChanged$
            .merge(distinctReduction$)
            .map(() => this.formValue);

        this.showChainedReplacementFields$ = this.formValueChanged$
            .map(() => this.formValue.currentPeriodProcessingCode === 'CHAINED_REPLACEMENT')
            .publishReplay(1).refCount();

        const canSave$ = this.attemptSave$.map(() => ({ saveAction: 'JUST_SAVE' })).merge(this.requestPreismeldungSave$.map(() => ({ saveAction: 'SAVE_AND_MOVE_TO_NEXT' })))
            .map(x => ({ saveAction: x, isValid: this.form.valid }))
            .publishReplay(1).refCount();
        this.save$ = canSave$.filter(x => x.isValid)
            .map(x => x.saveAction)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true)
            .merge(distinctPreismeldung$.mapTo(false));

        canSave$.filter(x => !x)
            .map(() =>
                keys(this.form.controls)
                    .filter(x => !!this.form.controls[x].errors)
                    .map(controlName => {
                        const control = this.form.controls[controlName];
                        const errorKey = keys(control.errors)[0];
                        const errorParams = Object.assign({}, control.errors[errorKey], { controlName: translateService.instant(`control_${controlName}`) });
                        return translateService.instant(`validation_formatted_${errorKey}`, errorParams);
                    })
            )
            .flatMap(errorMessages => pefDialogService.displayDialog(DialogValidationErrorsComponent, errorMessages, true))
            .subscribe();
    }

    get formValue(): P.PreismeldungPricePayload {
        return this.form.value;
    }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 2);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
