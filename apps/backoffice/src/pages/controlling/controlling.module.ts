import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgxLetModule, PefComponentsModule, PreismeldungSharedModule } from '@lik-shared';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefPmStatusModule } from '../../components/pef-pm-status/pef-pm-status.module';
import { PefZoomModule } from '../../components/pef-zoom';

import { ControllingPage } from './controlling';
import { ControllingReportComponent } from './controlling-report/controlling-report';
import { EditPreismeldungComponent } from './edit-preismeldung/edit-preismeldung';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        NgxLetModule,
        TranslateModule,
        PefComponentsModule,
        PreismeldungSharedModule,
        PefMenuModule,
        PefZoomModule,
        PefPmStatusModule,
    ],
    declarations: [ControllingPage, ControllingReportComponent, EditPreismeldungComponent],
})
export class ControllingModule {}
