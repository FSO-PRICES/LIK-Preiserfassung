import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { PefComponentsModule } from '../';

import { BearbeitungsTypeComponent } from './components/bearbeitungs-type/bearbeitungs-type';
import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { DialogChoosePercentageReductionComponent } from './components/dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';
import { PreismeldungAttributesComponent } from './components/preismeldung-detail-tabs/preismeldung-attributes/preismeldung-attributes';
import { PreismeldungInfoWarenkorbComponent } from './components/preismeldung-detail-tabs/preismeldung-info-warenkorb/preismeldung-info-warenkorb';
import { PreismeldungInfoComponent } from './components/preismeldung-detail-tabs/preismeldung-info/preismeldung-info';
import { PreismeldungMessagesComponent } from './components/preismeldung-detail-tabs/preismeldung-messages/preismeldung-messages';
import { PreismeldungInfoPopoverLeft } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-left/preismeldung-info-popover-left';
import { PreismeldungInfoPopoverRight } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-right/preismeldung-info-popover-right';
import { PreismeldungPriceComponent } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-price';
import { PreismeldungReadonlyHeader } from './components/preismeldung-detail-tabs/preismeldung-readonly-header/preismeldung-readonly-header';
import { PreismeldungToolbarComponent } from './components/preismeldung-toolbar/preismeldung-toolbar';

import { ElectronService } from './services/electron.service';

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
        PreismeldungToolbarComponent,
    ],
    imports: [IonicModule, PefComponentsModule],
    entryComponents: [DialogCancelEditComponent, DialogChoosePercentageReductionComponent],
    providers: [ElectronService],
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
        PreismeldungToolbarComponent,
    ],
})
export class PreismeldungSharedModule {}
