import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { ReportingPage } from './reporting';
import { MonthlyReportComponent } from './monthly/report';
import { OrganisationReportComponent } from './organisation/report';
import { PmsProblemeReportComponent } from './pms-probleme/report';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule } from 'lik-shared';

@NgModule({
    declarations: [ReportingPage, MonthlyReportComponent, OrganisationReportComponent, PmsProblemeReportComponent],
    imports: [IonicPageModule.forChild(ReportingPage), PefComponentsModule, PefMenuModule],
})
export class ReportModule {}