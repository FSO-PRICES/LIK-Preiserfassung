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
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { canDeactivateGuard } from '../guards/can-deactivate-guard';
import { settingsValidGuard } from '../guards/settings-valid-guard';
import { CockpitPage } from '../pages/cockpit';
import { ControllingPage } from '../pages/controlling';
import { ExportToPrestaPage } from '../pages/export-to-presta';
import { ImportPage } from '../pages/import';
import { PreiserheberPage } from '../pages/preiserheber';
import { PreismeldestellePage } from '../pages/preismeldestelle';
import { PreismeldungPage } from '../pages/preismeldung';
import { ReportingPage } from '../pages/reporting';
import { SettingsPage } from '../pages/settings';

const routes: Routes = [
    { path: '', redirectTo: 'cockpit', pathMatch: 'full' },
    {
        path: 'cockpit',
        canActivate: [settingsValidGuard],
        component: CockpitPage,
    },
    {
        path: 'import',
        canActivate: [settingsValidGuard],
        component: ImportPage,
    },
    {
        path: 'preismeldestellen',
        canActivate: [settingsValidGuard],
        canDeactivate: [canDeactivateGuard],
        component: PreismeldestellePage,
    },
    {
        path: 'pe',
        canActivate: [settingsValidGuard],
        canDeactivate: [canDeactivateGuard],
        component: PreiserheberPage,
    },
    {
        path: 'pm',
        canActivate: [settingsValidGuard],
        component: PreismeldungPage,
    },
    {
        path: 'pm/:pmsNummer',
        canActivate: [settingsValidGuard],
        component: PreismeldungPage,
    },
    {
        path: 'controlling',
        canActivate: [settingsValidGuard],
        component: ControllingPage,
    },
    {
        path: 'report',
        canActivate: [settingsValidGuard],
        component: ReportingPage,
    },
    {
        path: 'export',
        canActivate: [settingsValidGuard],
        component: ExportToPrestaPage,
    },
    {
        path: 'settings',
        canDeactivate: [canDeactivateGuard],
        component: SettingsPage,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
