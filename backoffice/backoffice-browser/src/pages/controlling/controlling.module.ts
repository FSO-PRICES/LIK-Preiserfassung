import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { ControllingPage } from './controlling';
import { ControllingReportComponent } from './controlling-report/controlling-report';
import { EditPreismeldungComponent } from './edit-preismeldung/edit-preismeldung';
import { PefComponentsModule, PreismeldungSharedModule } from 'lik-shared';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefZoomModule } from '../../components/pef-zoom';
import { PefPmStatusModule } from '../../components/pef-pm-status/pef-pm-status.module';

@NgModule({
    declarations: [ControllingPage, ControllingReportComponent, EditPreismeldungComponent],
    imports: [
        IonicPageModule.forChild(ControllingPage),
        PefComponentsModule,
        PreismeldungSharedModule,
        PefMenuModule,
        PefZoomModule,
        PefPmStatusModule,
    ],
})
export class ControllingModule {}
