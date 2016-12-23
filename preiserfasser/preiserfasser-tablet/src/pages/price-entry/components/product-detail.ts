import { Component, EventEmitter, Input, Output, SimpleChange, OnChanges } from '@angular/core'; // tslint:disable-line
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms'; // tslint:disable-line

import { ReactiveComponent } from '../../../common/ReactiveComponent';

import * as P from '../../../common-models';

@Component({
    selector: 'product-detail',
    templateUrl: 'product-detail.html'
})
export class ProductDetailComponent extends ReactiveComponent implements OnChanges {
    @Input() product: P.Product;

    public product$: Observable<P.Product>;

    constructor(formBuilder: FormBuilder) {
        super();

        this.product$ = this.observePropertyCurrentValue<P.Product>('product');
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
