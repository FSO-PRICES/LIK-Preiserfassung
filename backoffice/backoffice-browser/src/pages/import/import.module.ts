import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { ImportPage } from './import';
import { WarenkorbImportComponent } from './warenkorb/warenkorb-import';
import { PreismeldestellenImportComponent } from './preismeldestellen/preismeldestellen-import';
import { PreismeldungenImportComponent } from './preismeldungen/preismeldungen-import';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule],
    declarations: [
        ImportPage,
        WarenkorbImportComponent,
        PreismeldestellenImportComponent,
        PreismeldungenImportComponent,
    ],
    entryComponents: [
        WarenkorbImportComponent,
        PreismeldestellenImportComponent,
        PreismeldungenImportComponent,
    ],
    exports: [ImportPage, WarenkorbImportComponent, PreismeldestellenImportComponent, PreismeldungenImportComponent]
})
export class ImportModule {
}
