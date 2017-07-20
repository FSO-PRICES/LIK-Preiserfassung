import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

import { StatusPage } from './status';
import { StatusReportComponent } from './status-report/status-report';
import { StatusReportDetailComponent } from './status-report-detail/status-report-detail';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [
        StatusPage,
        StatusReportComponent,
        StatusReportDetailComponent
    ],
    imports: [
        IonicPageModule.forChild(StatusPage),
        PefComponentsModule,
        PefMenuModule,
        VirtualScrollModule
    ],
})
export class StatusModule {
}
