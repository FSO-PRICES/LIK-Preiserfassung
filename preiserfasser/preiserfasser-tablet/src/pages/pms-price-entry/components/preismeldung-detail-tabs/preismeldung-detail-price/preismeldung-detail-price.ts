import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectorRef } from '@angular/core';
import { PopoverController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from 'ng2-translate';
import { keys } from 'lodash';

import { ReactiveComponent } from '../../../../../common/ReactiveComponent';
import { formatPercentageChange } from '../../../../../common/formatting-functions';
import { maxMinNumberValidatorFactory } from '../../../../../common/validators';

import * as P from '../../../../../common-models';

import { DialogCancelEditComponent } from './dialog-cancel-edit/dialog-cancel-edit';
import { DialogValidationErrorsComponent } from './dialog-validation-errors/dialog-validation-errors';

interface FormValues {
    currentPeriodPrice: string;
    currentPeriodQuantity: string;
}

interface PercentageValues {
    lastPeriodToThisPeriod: string;
}

@Component({
    selector: 'preismeldung-detail-price',
    templateUrl: 'preismeldung-detail-price.html'
})
export class PreismeldungDetailPriceComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.Preismeldung;
    @Output('preismeldungPricePayload') preismeldungPricePayload$: Observable<P.PreismeldungPricePayload>;
    @Output('save') save$: Observable<{}>;

    public preismeldung$: Observable<P.Preismeldung>;
    public showChainedReplacementFields$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();
    public formValueChanged$ = new EventEmitter();

    public toggleReduction$ = new EventEmitter<string>();
    public reduction$: Observable<string>;
    public showSaveWarning$: Observable<boolean>;
    public percentageValues$: Observable<PercentageValues>;
    public attemptSave$ = new EventEmitter();
    public showValidationHints$: Observable<boolean>;

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    form: FormGroup;

    constructor(formBuilder: FormBuilder, private popoverController: PopoverController, translateService: TranslateService) {
        super();

        // const dialogCancelEdit = popoverController.create(DialogCancelEditComponent);

        this.form = formBuilder.group({
            currentPeriodPrice: [null, Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999999.99, { padRight: 2, truncate: 2 })])],
            currentPeriodQuantity: [null, Validators.compose([Validators.required, maxMinNumberValidatorFactory(0.01, 99999.99, { padRight: 2, truncate: 2 })])],
            reductionType: [null],
            currentPeriodProcessingCode: [null, Validators.required],
            artikelNummer: [null],
            artikelText: [null, Validators.required]
        });

        this.preismeldung$ = this.observePropertyCurrentValue<P.Preismeldung>('preismeldung');

        this.preismeldung$
            .filter(x => !!x)
            .distinctUntilKeyChanged('_id')
            .subscribe(preismeldung => {
                this.form.patchValue({
                    currentPeriodPrice: preismeldung.currentPeriodPrice,
                    currentPeriodQuantity: preismeldung.currentPeriodQuantity,
                    reductionType: preismeldung.currentPeriodIsAktion ? 'aktion' : preismeldung.currentPeriodIsAusverkauf ? 'ausverkauf' : null,
                    currentPeriodProcessingCode: preismeldung.currentPeriodProcessingCode || 'STANDARD_ENTRY',
                    artikelNummer: preismeldung.artikelNummer,
                    artikelText: preismeldung.artikelText
                });
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
            .map(() => this.form.value);

        this.showChainedReplacementFields$ = this.selectedProcessingCode$
            .map(x => x.codeType === 'CHAINED_REPLACEMENT')
            .publishReplay(1).refCount();

        const canSave$ = this.attemptSave$.map(() => this.form.valid)
            .publishReplay(1).refCount();
        this.save$ = canSave$.filter(x => x)
            .publishReplay(1).refCount();

        this.showValidationHints$ = canSave$.distinctUntilChanged().mapTo(true);

        canSave$.filter(x => !x)
            .map(() =>
                keys(this.form.controls)
                    .filter(x => !!this.form.controls[x].errors)
                    .map(x => ({ controlName: x, control: this.form.controls[x] }))
                    .map(x => {
                        const errorKey = keys(x.control.errors)[0];
                        const errorParams = Object.assign({}, x.control.errors[errorKey], { controlName: translateService.instant(`control_${x.controlName}`) });
                        return translateService.instant(`validation_formatted_${errorKey}`, errorParams);
                    })
            )
            .flatMap(errorMessages => this.displayDialog(DialogValidationErrorsComponent, errorMessages, true))
            .subscribe();
    }

    displayDialog(dialogComponent: Component, params: any, enableBackdropDismiss = false) {
        const dialog = this.popoverController.create(dialogComponent, { params }, { enableBackdropDismiss });
        dialog.present();
        return Observable.bindCallback(cb => dialog.onWillDismiss(cb))()
            .map(([data, role]) => ({ data, role }));
    }

    // displayDialogCancelEdit() {
    //     const dialogCancelEdit = this.popoverController.create(DialogCancelEditComponent, {}, { enableBackdropDismiss: false });
    //     dialogCancelEdit.present();
    //     return Observable.bindCallback(cb => dialogCancelEdit.onWillDismiss(cb))()
    //         .map(([data, role]) => ({ data, role }));
    // }

    formatPercentageChange = percentageChange => formatPercentageChange(percentageChange, 2);

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
