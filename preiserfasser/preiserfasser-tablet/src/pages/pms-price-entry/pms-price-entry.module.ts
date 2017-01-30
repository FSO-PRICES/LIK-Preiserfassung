import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from 'ng2-translate';

import { PefComponentsModule } from '../../components';

import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { PmsPriceEntryPage } from './pms-price-entry';
import { PreismeldungDetailMessagesComponent } from './components/preismeldung-detail-tabs/messages';
import { PreismeldungDetailPriceComponent, DialogValidationErrorsComponent } from './components/preismeldung-detail-tabs/preismeldung-detail-price';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PreismeldungToolbarComponent } from './components/preismeldung-toolbar/preismeldung-toolbar';
import { ProcessingCodeComponent } from './components/processing-code/processing-code';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, TranslateModule],
    declarations: [
        DialogCancelEditComponent,
        DialogValidationErrorsComponent,
        PmsPriceEntryPage,
        PreismeldungDetailMessagesComponent,
        PreismeldungDetailPriceComponent,
        PreismeldungListComponent,
        PreismeldungToolbarComponent,
        ProcessingCodeComponent
    ],
    entryComponents: [
        DialogCancelEditComponent,
        DialogValidationErrorsComponent
    ],
    exports: [PmsPriceEntryPage, DialogCancelEditComponent, DialogValidationErrorsComponent]
})
export class PmsPriceEntryModule {
}
