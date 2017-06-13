import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PreiserfasserCommonModule } from '../../common';
import { PefComponentsModule, PefDialogOneButtonComponent, PefDialogYesNoComponent, PefDialogYesNoEditComponent } from 'lik-shared';

import { BearbeitungsTypeComponent } from './components/bearbeitungs-type/bearbeitungs-type';
import { DialogCancelEditComponent } from './components/dialog-cancel-edit/dialog-cancel-edit';
import { DialogChoosePercentageReductionComponent } from './components/dialog-choose-percentage-reduction/dialog-choose-percentage-reduction';
import { PmsPriceEntryPage } from './pms-price-entry';
import { PreismeldungAttributesComponent } from './components/preismeldung-detail-tabs/preismeldung-attributes';
import { PreismeldungenSortComponent } from './components/preismeldungen-sort/preismeldungen-sort';
import { PreismeldungInfoComponent } from './components/preismeldung-detail-tabs/preismeldung-info';
import { PreismeldungInfoPopoverLeft } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-left/preismeldung-info-popover-left';
import { PreismeldungInfoPopoverRight } from './components/preismeldung-detail-tabs/preismeldung-price/preismeldung-info-popover-right/preismeldung-info-popover-right';
import { PreismeldungInfoWarenkorbComponent } from './components/preismeldung-detail-tabs/preismeldung-info-warenkorb';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PreismeldungMessagesComponent } from './components/preismeldung-detail-tabs/preismeldung-messages';
import { PreismeldungPriceComponent } from './components/preismeldung-detail-tabs/preismeldung-price';
import { PreismeldungReadonlyHeader } from './components/preismeldung-detail-tabs/preismeldung-readonly-header';
import { PreismeldungToolbarComponent } from './components/preismeldung-toolbar/preismeldung-toolbar';

@NgModule({
    imports: [
        IonicPageModule.forChild(PmsPriceEntryPage),
        PefComponentsModule,
        PreiserfasserCommonModule
    ],
    declarations: [
        BearbeitungsTypeComponent,
        DialogCancelEditComponent,
        DialogChoosePercentageReductionComponent,
        PmsPriceEntryPage,
        PreismeldungAttributesComponent,
        PreismeldungenSortComponent,
        PreismeldungInfoComponent,
        PreismeldungInfoPopoverLeft,
        PreismeldungInfoPopoverRight,
        PreismeldungInfoWarenkorbComponent,
        PreismeldungListComponent,
        PreismeldungMessagesComponent,
        PreismeldungPriceComponent,
        PreismeldungReadonlyHeader,
        PreismeldungToolbarComponent
    ],
    entryComponents: [
        DialogCancelEditComponent,
        DialogChoosePercentageReductionComponent,
        PefDialogOneButtonComponent,
        PefDialogYesNoComponent,
        PefDialogYesNoEditComponent,
    ],
    providers: [
        { provide: 'windowObject', useValue: window }
    ],
    exports: [
        PmsPriceEntryPage
    ]
})
export class PmsPriceEntryModule {
}
