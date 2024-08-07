import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { MonthlyReportComponent } from './monthly/report';
import { OrganisationReportComponent } from './organisation/report';
import { PmsProblemeReportComponent } from './pms-probleme/report';

import { ReportingPage } from './reporting';

@NgModule({
    imports: [CommonModule, IonicModule, TranslateModule, PefComponentsModule, PefMenuModule],
    declarations: [ReportingPage, MonthlyReportComponent, OrganisationReportComponent, PmsProblemeReportComponent],
})
export class ReportModule {}
