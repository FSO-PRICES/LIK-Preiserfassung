import { ErrorHandler, NgModule, LOCALE_ID } from '@angular/core';
import { StoreModule } from '@ngrx/store';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { PefDialogService } from 'lik-shared';
import { PefComponentsModule } from 'lik-shared';

import { Backoffice } from './app.component';
import { SettingsLoadedService } from '../common/settings-loaded-service';
import { PefMenuModule, PefMenuComponent } from '../components/pef-menu';
import { PefDialogLoginModule, PefDialogLoginComponent } from '../components/pef-dialog-login';

import { PreiserheberModule, PreiserheberPage } from '../pages/preiserheber';
import { PreismeldestelleModule, PreismeldestellePage } from '../pages/preismeldestelle';
import { PreismeldungModule, PreismeldungPage } from '../pages/preismeldung';
import { RegionModule, RegionPage } from '../pages/region';
import { ImportModule, ImportPage } from '../pages/import';
import { ExportToPrestaModule, ExportToPrestaPage } from '../pages/export-to-presta';
import { SettingsPage, SettingsModule } from '../pages/settings';

import { BO_EFFECTS } from '../effects';
import { reducer } from '../reducers';

@NgModule({
    declarations: [
        Backoffice
    ],
    imports: [
        IonicModule.forRoot(Backoffice, {}, {
            links: [
                { component: ImportPage, name: 'Import', segment: 'import' },
                { component: ExportToPrestaPage, name: 'Export', segment: 'export' },
                { component: PreiserheberPage, name: 'Preiserfasser', segment: 'pe' },
                { component: PreismeldestellePage, name: 'Preismeldestelle', segment: 'pms' },
                { component: PreismeldungPage, name: 'Preismeldung', segment: 'pm' },
                { component: RegionPage, name: 'Region', segment: 'reg' },
                { component: SettingsPage, name: 'Settings', segment: 'settings' },
            ]
        }),
        PefComponentsModule,
        PefDialogLoginModule,
        PefMenuModule,
        ImportModule,
        ExportToPrestaModule,
        SettingsModule,
        PreiserheberModule,
        PreismeldestelleModule,
        PreismeldungModule,
        RegionModule,
        StoreModule.provideStore(reducer),
        ...BO_EFFECTS
    ],
    bootstrap: [IonicApp],
    entryComponents: [
        Backoffice,
        PefMenuComponent,
        PefDialogLoginComponent,
        ImportPage,
        ExportToPrestaPage,
        SettingsPage,
        PreiserheberPage,
        PreismeldestellePage,
        PreismeldungPage,
        RegionPage
    ],
    providers: [
        { provide: ErrorHandler, useClass: IonicErrorHandler },
        { provide: LOCALE_ID, useValue: 'de-CH' },
        PefDialogService,
        SettingsLoadedService
    ]
})
export class AppModule { }
