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
