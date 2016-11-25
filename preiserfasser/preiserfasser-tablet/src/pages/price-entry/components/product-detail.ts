import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { FormBuilder, FormGroup } from '@angular/forms';

import { ReactiveComponent } from '../../../common/ReactiveComponent';

import * as P from '../../../preiserfasser-types';

@Component({
    selector: 'product-detail',
    templateUrl: 'product-detail.html'
})
export class ProductDetailComponent extends ReactiveComponent {
    @Input() product: P.Product;

    public product$: Observable<P.Product>;

    constructor(formBuilder: FormBuilder) {
        super();

        this.product$ = this.observePropertyCurrentValue<P.Product>('product');
    }
}
