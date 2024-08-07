/*
 * LIK-Preiserfassung
 * Copyright (C) 2024 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
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
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgxLetModule, PefComponentsModule, PreismeldungSharedModule } from '@lik-shared';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { PefPmStatusModule } from '../../components/pef-pm-status/pef-pm-status.module';

import { PefTypeaheadComponent } from './components/pef-typeahead/pef-typeahead';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';
import { PreismeldungPage } from './preismeldung';

@NgModule({
    declarations: [PreismeldungPage, PreismeldungListComponent, PefTypeaheadComponent],
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
        CommonModule,
        IonicModule,
        FormsModule,
        NgxLetModule,
        TranslateModule,
        ReactiveFormsModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
        PreismeldungSharedModule,
        PefPmStatusModule,
        ScrollingModule,
    ],
})
export class PreismeldungModule {}
