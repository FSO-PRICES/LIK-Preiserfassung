import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';

import { PefComponentsModule } from 'lik-shared';

import { BearbeitungsTypeComponent } from './components/bearbeitungs-type/bearbeitungs-type';
import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { DialogChoosePercentageReductionComponent } from './components/dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';
import { PreismeldungPriceComponent } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-price';
import { PreismeldungInfoPopoverLeft } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-left/preismeldung-info-popover-left';
import { PreismeldungInfoPopoverRight } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-right/preismeldung-info-popover-right';
import { PreismeldungInfoWarenkorbComponent } from './components/preismeldung-detail-tabs/preismeldung-info-warenkorb/preismeldung-info-warenkorb';
import { PreismeldungToolbarComponent } from './components/preismeldung-toolbar/preismeldung-toolbar';

@NgModule({
    declarations: [
        BearbeitungsTypeComponent,
        DialogCancelEditComponent,
        DialogChoosePercentageReductionComponent,
        PreismeldungInfoPopoverLeft,
        PreismeldungInfoPopoverRight,
        PreismeldungInfoWarenkorbComponent,
        PreismeldungPriceComponent,
        PreismeldungToolbarComponent
    ],
    imports: [
        IonicModule,
        PefComponentsModule
    ],
    exports: [
        BearbeitungsTypeComponent,
        DialogCancelEditComponent,
        DialogChoosePercentageReductionComponent,
        PreismeldungInfoWarenkorbComponent,
        PreismeldungPriceComponent,
        PreismeldungToolbarComponent
    ]
})
export class PreismeldungSharedModule {
}
