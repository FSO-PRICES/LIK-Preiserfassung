import { NgModule } from '@angular/core';

import { PefComponentsModule } from '@lik-shared';

import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { MonthlyReportComponent } from './monthly/report';
import { OrganisationReportComponent } from './organisation/report';
import { PmsProblemeReportComponent } from './pms-probleme/report';

import { ReportingPage } from './reporting';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, PefMenuModule],
    declarations: [ReportingPage, MonthlyReportComponent, OrganisationReportComponent, PmsProblemeReportComponent],
})
export class ReportModule {}
