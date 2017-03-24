import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from 'ng2-translate';

import { PreiserfasserCommonModule } from '../../common';
import { PefComponentsModule, PefDialogYesNoComponent } from 'lik-shared';

import { BearbeitungsTypeComponent } from './components/bearbeitungs-type/bearbeitungs-type';
import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { PmsPriceEntryPage } from './pms-price-entry';
import { PreismeldungAttributesComponent } from './components/preismeldung-detail-tabs/preismeldung-attributes';
import { PreismeldungenSortComponent } from './components/preismeldungen-sort/preismeldungen-sort';
import { PreismeldungInfoComponent } from './components/preismeldung-detail-tabs/preismeldung-info';
import { PreismeldungInfoPopover } from './components/preismeldung-info-popover/preismeldung-info-popover';
import { PreismeldungInfoWarenkorbComponent } from './components/preismeldung-detail-tabs/preismeldung-info-warenkorb';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PreismeldungMessagesComponent } from './components/preismeldung-detail-tabs/preismeldung-messages';
import { PreismeldungPriceComponent, DialogValidationErrorsComponent } from './components/preismeldung-detail-tabs/preismeldung-price';
import { PreismeldungReadonlyHeader } from './components/preismeldung-detail-tabs/preismeldung-readonly-header';
import { PreismeldungToolbarComponent } from './components/preismeldung-toolbar/preismeldung-toolbar';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, PreiserfasserCommonModule, TranslateModule],
    declarations: [
        BearbeitungsTypeComponent,
        DialogCancelEditComponent,
        DialogValidationErrorsComponent,
        PmsPriceEntryPage,
        PreismeldungAttributesComponent,
        PreismeldungenSortComponent,
        PreismeldungInfoComponent,
        PreismeldungInfoPopover,
        PreismeldungInfoWarenkorbComponent,
        PreismeldungListComponent,
        PreismeldungMessagesComponent,
        PreismeldungPriceComponent,
        PreismeldungReadonlyHeader,
        PreismeldungToolbarComponent,
    ],
    entryComponents: [
        DialogCancelEditComponent,
        DialogValidationErrorsComponent,
        PefDialogYesNoComponent,
    ],
    providers: [
        { provide: 'windowObject', useValue: window }
    ],
    exports: [
        PmsPriceEntryPage,
        DialogCancelEditComponent,
        DialogValidationErrorsComponent,
    ]
})
export class PmsPriceEntryModule {
}
