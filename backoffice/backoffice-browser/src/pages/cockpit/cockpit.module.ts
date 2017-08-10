import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

import { CockpitPage } from './cockpit';
import { CockpitReportComponent } from './cockpit-report/cockpit-report';
import { CockpitReportDetailComponent } from './cockpit-report-detail/cockpit-report-detail';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [
        CockpitPage,
        CockpitReportComponent,
        CockpitReportDetailComponent
    ],
    imports: [
        IonicPageModule.forChild(CockpitPage),
        PefComponentsModule,
        PefMenuModule,
        VirtualScrollModule
    ],
})
export class CockpitModule {
}
