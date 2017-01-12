import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges, ChangeDetectorRef } from '@angular/core';
import { PopoverController } from 'ionic-angular';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveComponent } from '../../../../../common/ReactiveComponent';
import { isNil } from 'lodash';

import * as format from 'format-number';

import * as P from '../../../../../common-models';

import { DialogCancelEditComponent } from './dialog-cancel-edit/dialog-cancel-edit';

interface FormValues {
    currentPeriodPrice: string;
    currentPeriodQuantity: string;
}

interface PercentageValues {
    lastPeriodToThisPeriod: string;
}

@Component({
    selector: 'product-detail-preismeldung',
    templateUrl: 'product-detail-preismeldung.html'
})
export class ProductDetailPreismeldungComponent extends ReactiveComponent implements OnChanges {
    @Input() product: P.Product;
    @Output() isSaved: Observable<boolean>;

    public product$: Observable<P.Product>;
    public showChainedReplacementFields$: Observable<boolean>;
    public selectedProcessingCode$ = new EventEmitter<any>();
    public formValueChanged$ = new EventEmitter();

    public save$ = new EventEmitter();
    public showSaveWarning$: Observable<boolean>;

    public percentageValues$: Observable<PercentageValues>;

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    form: FormGroup;

    constructor(formBuilder: FormBuilder, private popoverController: PopoverController) {
        super();

        // const dialogCancelEdit = popoverController.create(DialogCancelEditComponent);

        this.form = formBuilder.group({
            currentPeriodPrice: [null],
            currentPeriodQuantity: [null],
            processingCode: ['']
        });

        this.product$ = this.observePropertyCurrentValue<P.Product>('product');

        this.product$
            .filter(x => !!x)
            .subscribe(product => {
                this.form.patchValue({
                    currentPeriodPrice: product.currentPrice,
                    currentPeriodQuantity: product.currentQuantity
                });
            });

        this.percentageValues$ = this.formValueChanged$.startWith(null)
            .combineLatest(this.product$, (_, product) => createPercentages(product, this.form.value));

        this.showChainedReplacementFields$ = this.selectedProcessingCode$
            .map(x => x.codeType === 'CHAINED_REPLACEMENT')
            .publishReplay(1).refCount();

        this.isSaved = this.form.valueChanges
            .map(() => this.form.dirty);

        // this.save$
        //     .flatMap(ev => this.displayDialogCancelEdit())
        //     .subscribe(x => console.log('dialog value', x));
    }

    displayDialogCancelEdit() {
        const dialogCancelEdit = this.popoverController.create(DialogCancelEditComponent, {}, { enableBackdropDismiss: false });
        dialogCancelEdit.present();
        return Observable.bindCallback(cb => dialogCancelEdit.onWillDismiss(cb))()
            .map(([data, role]) => ({ data, role }));
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

const percentageFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '', suffix: '%' };

function createPercentages(product: P.Product, formValues: FormValues): PercentageValues {
    return {
        lastPeriodToThisPeriod: createFormattedPercentageChange(product.preisT, product.mengeT, formValues.currentPeriodPrice, formValues.currentPeriodQuantity)
    }
}

const emptyPercentageChange = '&mdash;';
function createFormattedPercentageChange(originalPrice: number, originalQuantity: number, newPrice: string, newQuantity: string) {
    const newPriceAsNumber = parseFloat(newPrice);
    const newQuantityAsNumber = parseFloat(newQuantity);

    if (isNaN(newPriceAsNumber) || newPriceAsNumber === 0 || isNaN(newQuantityAsNumber) || newQuantityAsNumber === 0) return emptyPercentageChange;

    const originalPriceFactored = originalPrice / originalQuantity;
    const newPriceFactored = newPriceAsNumber / newQuantityAsNumber;

    const percentageChange = (newPriceFactored - originalPriceFactored) / originalPriceFactored * 100;

    const prefix = percentageChange > 0 ? '+' : '';
    return `${prefix}${format(percentageFormattingOptions)(percentageChange)}`;
}
