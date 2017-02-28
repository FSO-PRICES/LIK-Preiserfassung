import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from 'ng2-translate';
import { MaterialModule } from '@angular/material';

import { PreiserfasserCommonModule } from '../../common';
import { PefComponentsModule } from 'lik-shared';

import { BearbeitungsTypeComponent } from './components/bearbeitungs-type/bearbeitungs-type';
import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { PmsPriceEntryPage } from './pms-price-entry';
import { PreismeldungAttributesComponent } from './components/preismeldung-detail-tabs/preismeldung-attributes';
import { PreismeldungInfoComponent } from './components/preismeldung-detail-tabs/preismeldung-info';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PreismeldungMessagesComponent } from './components/preismeldung-detail-tabs/preismeldung-messages';
import { PreismeldungPriceComponent, DialogValidationErrorsComponent } from './components/preismeldung-detail-tabs/preismeldung-price';
import { PreismeldungToolbarComponent } from './components/preismeldung-toolbar/preismeldung-toolbar';

@NgModule({
    imports: [CommonModule, IonicModule, MaterialModule, PefComponentsModule, PreiserfasserCommonModule, TranslateModule],
    declarations: [
        BearbeitungsTypeComponent,
        DialogCancelEditComponent,
        DialogValidationErrorsComponent,
        PmsPriceEntryPage,
        PreismeldungAttributesComponent,
        PreismeldungInfoComponent,
        PreismeldungListComponent,
        PreismeldungMessagesComponent,
        PreismeldungPriceComponent,
        PreismeldungToolbarComponent,
    ],
    entryComponents: [
        DialogCancelEditComponent,
        DialogValidationErrorsComponent
    ],
    exports: [PmsPriceEntryPage, DialogCancelEditComponent, DialogValidationErrorsComponent]
})
export class PmsPriceEntryModule {
}
