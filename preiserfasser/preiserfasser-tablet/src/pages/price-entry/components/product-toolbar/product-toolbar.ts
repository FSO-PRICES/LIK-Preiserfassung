import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';

import * as P from '../../../../common-models';

@Component({
    selector: 'product-toolbar',
    templateUrl: 'product-toolbar.html'
})
export class ProductToolbarComponent {
    @Input() product: P.Product;
    @Output('selectedTab') selectedTab$: Observable<string>;
    @Output('buttonClicked') buttonClicked$ = new EventEmitter<string>();

    public selectTab$ = new EventEmitter<string>();

    constructor() {
        this.selectedTab$ = this.selectTab$
            .startWith('PREISMELDUNG');
    }
}
