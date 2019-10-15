import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NgxLetModule } from '@ngx-utilities/ngx-let';

import { PefComponentsModule, PreismeldungSharedModule } from '@lik-shared';

import { ControllingPage } from './controlling';
import { ControllingReportComponent } from './controlling-report/controlling-report';
import { EditPreismeldungComponent } from './edit-preismeldung/edit-preismeldung';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefPmStatusModule } from '../../components/pef-pm-status/pef-pm-status.module';
import { PefZoomModule } from '../../components/pef-zoom';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        NgxLetModule,
        PefComponentsModule,
        PreismeldungSharedModule,
        PefMenuModule,
        PefZoomModule,
        PefPmStatusModule,
    ],
    declarations: [ControllingPage, ControllingReportComponent, EditPreismeldungComponent],
})
export class ControllingModule {}
