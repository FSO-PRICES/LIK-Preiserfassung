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

import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NgxLetModule } from '@ngx-utilities/ngx-let';
import { NgxElectronModule } from 'ngx-electron';

import { PefComponentsModule } from '@lik-shared';

import { PefDialogCancelEditModule } from '../../components/pef-dialog-cancel-edit/pef-dialog-cancel-edit.module';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { SettingsPage } from './settings';

@NgModule({
    imports: [
        CommonModule,
        IonicModule,
        NgxElectronModule,
        NgxLetModule,
        ReactiveFormsModule,
        PefComponentsModule,
        PefDialogCancelEditModule,
        PefMenuModule,
    ],
    declarations: [SettingsPage],
})
export class SettingsModule {}
