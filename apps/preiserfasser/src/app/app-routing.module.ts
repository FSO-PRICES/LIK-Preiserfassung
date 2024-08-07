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
