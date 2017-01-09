import { Component, EventEmitter, Input, SimpleChange, OnChanges, ElementRef } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ReactiveComponent } from '../../../../../common/ReactiveComponent';

import * as P from '../../../../../common-models';

@Component({
    selector: 'product-detail-preismeldung',
    templateUrl: 'product-detail-preismeldung.html'
})
export class ProductDetailPreismeldungComponent extends ReactiveComponent implements OnChanges {
    @Input() product: P.Product;

    public product$: Observable<P.Product>;

    constructor(formBuilder: FormBuilder, private elementRef: ElementRef) {
        super();

        this.product$ = this.observePropertyCurrentValue<P.Product>('product');
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    foobar() {
        console.log('qqqqqqq')
    }
}
