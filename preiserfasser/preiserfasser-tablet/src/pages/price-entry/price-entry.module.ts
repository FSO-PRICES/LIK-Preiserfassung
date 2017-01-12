import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { PefComponentsModule } from '../../components';

import { PriceEntryPage } from './price-entry';
import { ProcessingCodeComponent } from './components/processing-code/processing-code';
import { ProductListComponent } from './components/product-list/product-list';
import { ProductDetailMessagesComponent } from './components/product-detail-tabs/messages';
import { ProductDetailPreismeldungComponent, DialogCancelEditComponent } from './components/product-detail-tabs/preismeldung';
import { ProductToolbarComponent } from './components/product-toolbar/product-toolbar';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule],
    declarations: [
        DialogCancelEditComponent,
        ProcessingCodeComponent,
        ProductDetailMessagesComponent,
        ProductDetailPreismeldungComponent,
        PriceEntryPage,
        ProductListComponent,
        ProductToolbarComponent
    ],
    entryComponents: [
        DialogCancelEditComponent
    ],
    exports: [PriceEntryPage, DialogCancelEditComponent]
})
export class PriceEntryModule {
}
