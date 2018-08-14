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
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PreiserfasserCommonModule } from '../../common';
import { PefComponentsModule, PreismeldungSharedModule } from 'lik-shared';
import { PreismeldungListComponent } from './components/preismeldung-list/preismeldung-list';

import { PmsPriceEntryPage } from './pms-price-entry';

@NgModule({
    imports: [
        IonicPageModule.forChild(PmsPriceEntryPage),
        PefComponentsModule,
        PreiserfasserCommonModule,
        PreismeldungSharedModule
    ],
    declarations: [
        PreismeldungListComponent,
        PmsPriceEntryPage,
    ],
    providers: [
        { provide: 'windowObject', useValue: window }
    ],
    exports: [
        PmsPriceEntryPage
    ]
})
export class PmsPriceEntryModule {
}
