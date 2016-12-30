import { Component, Input } from '@angular/core';

import * as P from '../../../common-models';

@Component({
    selector: 'product-detail-messages',
    templateUrl: 'product-detail-messages.html'
})
export class ProductDetailMessagesComponent {
    @Input() product: P.Product;
}
