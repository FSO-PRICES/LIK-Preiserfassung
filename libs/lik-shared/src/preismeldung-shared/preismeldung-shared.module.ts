/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { NgxLetModule } from '@ngx-utilities/ngx-let';
import { NgxElectronModule } from 'ngx-electron';

import { PefDialogService } from '../common/pef-dialog-service';
import { PefMessageDialogService } from '../common/pef-message-dialog-service';
import { PefComponentsModule } from '../pef-components/';

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
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonicModule,
        NgxLetModule,
        PefComponentsModule,
        TranslateModule,
        NgxElectronModule,
    ],
    entryComponents: [DialogCancelEditComponent, DialogChoosePercentageReductionComponent],
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
    providers: [PefDialogService, PefMessageDialogService],
})
export class PreismeldungSharedModule {}
