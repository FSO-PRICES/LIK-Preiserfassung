import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

import { PefComponentsModule } from 'lik-shared';

import { BearbeitungsTypeComponent } from './components/bearbeitungs-type/bearbeitungs-type';
import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { DialogChoosePercentageReductionComponent } from './components/dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';
import { PreismeldungAttributesComponent } from './components/preismeldung-detail-tabs/preismeldung-attributes/preismeldung-attributes';
import { PreismeldungPriceComponent } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-price';
import { PreismeldungInfoPopoverLeft } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-left/preismeldung-info-popover-left';
import { PreismeldungInfoPopoverRight } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-right/preismeldung-info-popover-right';
import { PreismeldungInfoComponent } from './components/preismeldung-detail-tabs/preismeldung-info/preismeldung-info';
import { PreismeldungInfoWarenkorbComponent } from './components/preismeldung-detail-tabs/preismeldung-info-warenkorb/preismeldung-info-warenkorb';
import { PreismeldungMessagesComponent } from './components/preismeldung-detail-tabs/preismeldung-messages/preismeldung-messages';
import { PreismeldungToolbarComponent } from './components/preismeldung-toolbar/preismeldung-toolbar';
import { PreismeldungReadonlyHeader } from './components/preismeldung-detail-tabs/preismeldung-readonly-header/preismeldung-readonly-header';

@NgModule({
    declarations: [
        BearbeitungsTypeComponent,
        DialogCancelEditComponent,
        DialogChoosePercentageReductionComponent,
        PreismeldungAttributesComponent,
        PreismeldungInfoPopoverLeft,
        PreismeldungInfoPopoverRight,
        PreismeldungInfoComponent,
        PreismeldungInfoWarenkorbComponent,
        PreismeldungMessagesComponent,
        PreismeldungPriceComponent,
        PreismeldungReadonlyHeader,
        PreismeldungToolbarComponent
    ],
    imports: [
        IonicModule,
        PefComponentsModule
    ],
    entryComponents: [
        DialogCancelEditComponent,
        DialogChoosePercentageReductionComponent
    ],
    exports: [
        BearbeitungsTypeComponent,
        DialogCancelEditComponent,
        DialogChoosePercentageReductionComponent,
        PreismeldungAttributesComponent,
        PreismeldungInfoComponent,
        PreismeldungInfoWarenkorbComponent,
        PreismeldungMessagesComponent,
        PreismeldungPriceComponent,
        PreismeldungReadonlyHeader,
        PreismeldungToolbarComponent
    ]
})
export class PreismeldungSharedModule {
}
