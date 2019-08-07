import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

import { CockpitPage } from '../pages/cockpit';
import { ControllingPage } from '../pages/controlling';
import { ExportToPrestaPage } from '../pages/export-to-presta';
import { ImportPage } from '../pages/import';
import { PreiserheberPage } from '../pages/preiserheber';
import { PreismeldestellePage } from '../pages/preismeldestelle';
import { PreismeldungPage } from '../pages/preismeldung';
import { ReportingPage } from '../pages/reporting';
import { SettingsPage } from '../pages/settings';
import { AppGuard } from '../services/app-guard';

const routes: Routes = [
    { path: '', redirectTo: 'cockpit', pathMatch: 'full' },
    {
        path: 'cockpit',
        canActivate: [AppGuard],
        component: CockpitPage,
    },
    {
        path: 'import',
        canActivate: [AppGuard],
        component: ImportPage,
    },
    {
        path: 'preismeldestellen',
        canActivate: [AppGuard],
        component: PreismeldestellePage,
    },
    {
        path: 'pe',
        canActivate: [AppGuard],
        component: PreiserheberPage,
    },
    {
        path: 'pm',
        canActivate: [AppGuard],
        component: PreismeldungPage,
    },
    {
        path: 'pm/:pmsNummer',
        canActivate: [AppGuard],
        component: PreismeldungPage,
    },
    {
        path: 'controlling',
        canActivate: [AppGuard],
        component: ControllingPage,
    },
    {
        path: 'report',
        canActivate: [AppGuard],
        component: ReportingPage,
    },
    {
        path: 'export',
        canActivate: [AppGuard],
        component: ExportToPrestaPage,
    },
    {
        path: 'settings',
        component: SettingsPage,
    },
];

@NgModule({
    imports: [RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })],
    exports: [RouterModule],
})
export class AppRoutingModule {}
