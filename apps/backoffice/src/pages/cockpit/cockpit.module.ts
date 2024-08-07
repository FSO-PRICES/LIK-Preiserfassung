import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgxLetModule, PefComponentsModule } from '@lik-shared';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

import { CockpitPage } from './cockpit';
import { CockpitReportComponent } from './cockpit-report/cockpit-report';
import { CockpitReportDetailComponent } from './cockpit-report-detail/cockpit-report-detail';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonicModule,
        NgxLetModule,
        PefComponentsModule,
        PefMenuModule,
        TranslateModule,
        ScrollingModule,
    ],
    declarations: [CockpitPage, CockpitReportComponent, CockpitReportDetailComponent],
})
export class CockpitModule {}
