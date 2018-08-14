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

import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefComponentsModule, PreismeldungSharedModule } from 'lik-shared';
import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefTypeaheadComponent } from './components/pef-typeahead/pef-typeahead';
import { PefPmStatusModule } from '../../components/pef-pm-status/pef-pm-status.module';

@NgModule({
    declarations: [PreismeldungListComponent, PefTypeaheadComponent],
    exports: [
        PreismeldungListComponent,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PreismeldungSharedModule,
        PefTypeaheadComponent,
        PefPmStatusModule,
    ],
    imports: [
        IonicPageModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PreismeldungSharedModule,
        PefPmStatusModule,
    ],
})
export class PreismeldungPagesModule {}
// Shared module used by preismeldung-by-pms and preismeldung modules
