/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

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
