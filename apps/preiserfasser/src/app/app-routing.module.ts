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
import { PreloadAllModules, RouterModule, Routes, UrlSegment } from '@angular/router';

import { canDeactivateGuard } from '../guards/can-deactivate-guard';
import { settingsValidGuard } from '../guards/settings-valid-guard';
import { DashboardPage } from '../pages/dashboard/dashboard.page';
import { NewPriceSeriesPage } from '../pages/new-price-series/new-price-series.page';
import { PeDetailsPage } from '../pages/pe-details/pe-details.page';
import { PmsDetailsPage } from '../pages/pms-details/pms-details.page';
import { PmsPriceEntryPage } from '../pages/pms-price-entry/pms-price-entry.page';
import { PmsSortPage } from '../pages/pms-sort/pms-sort.page';
import { SettingsPage } from '../pages/settings/settings.page';

export function priceEntryPageMatcher(segments: UrlSegment[]) {
    if (segments.length > 1 && segments[0].path === 'pms-price-entry') {
        if (segments.length >= 2 && segments.length <= 3) {
            let posParams: Record<string, UrlSegment> = { pmsNummer: segments[1] };

            if (segments.length === 3) {
                posParams = { ...posParams, pmId: segments[2] };
            }
            return { consumed: segments, posParams };
        }
    }
    return null;
}

const routes: Routes = [
    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    {
        path: 'dashboard',
        canActivate: [settingsValidGuard],
        component: DashboardPage,
    },
    {
        path: 'pe-details',
        canActivate: [settingsValidGuard],
        canDeactivate: [canDeactivateGuard],
        component: PeDetailsPage,
    },
    {
        path: 'pms-details/:pmsNummer',
        canActivate: [settingsValidGuard],
        canDeactivate: [canDeactivateGuard],
        component: PmsDetailsPage,
    },
    {
        matcher: priceEntryPageMatcher,
        canActivate: [settingsValidGuard],
        component: PmsPriceEntryPage,
    },
    {
        path: 'new-price-series/:pmsNummer',
        canActivate: [settingsValidGuard],
        component: NewPriceSeriesPage,
    },
    {
        path: 'pms-sort/:pmsNummer',
        canActivate: [settingsValidGuard],
        component: PmsSortPage,
    },
    {
        path: 'settings',
        canDeactivate: [canDeactivateGuard],
        component: SettingsPage,
    },
];

@NgModule({
    imports: [
        RouterModule.forRoot(routes, {
            preloadingStrategy: PreloadAllModules,
        }),
    ],
    exports: [RouterModule],
})
export class AppRoutingModule {}
