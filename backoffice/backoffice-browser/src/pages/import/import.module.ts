import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { ImportPage } from './import';

import { WarenkorbImportComponent } from './warenkorb/warenkorb-import';
import { PreismeldestellenImportComponent } from './preismeldestellen/preismeldestellen-import';
import { PreismeldungenImportComponent } from './preismeldungen/preismeldungen-import';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    declarations: [
        ImportPage,
        WarenkorbImportComponent,
        PreismeldestellenImportComponent,
        PreismeldungenImportComponent,
    ],
    imports: [
        IonicPageModule.forChild(ImportPage),
        PefMenuModule
    ],
})
export class ImportModule {
}
