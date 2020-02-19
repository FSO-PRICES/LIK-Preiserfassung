import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgxLetModule } from '@ngx-utilities/ngx-let';
import { VirtualScrollModule } from 'angular2-virtual-scroll';

import { PefComponentsModule } from '@lik-shared';

import { CockpitPage } from './cockpit';
import { CockpitReportDetailComponent } from './cockpit-report-detail/cockpit-report-detail';
import { CockpitReportComponent } from './cockpit-report/cockpit-report';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        IonicModule,
        NgxLetModule,
        PefComponentsModule,
        PefMenuModule,
        VirtualScrollModule,
    ],
    declarations: [CockpitPage, CockpitReportComponent, CockpitReportDetailComponent],
})
export class CockpitModule {}
