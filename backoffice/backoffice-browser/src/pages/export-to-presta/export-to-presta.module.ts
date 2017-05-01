import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { ExportToPrestaPage } from './export-to-presta';
import { PreismeldungenExportComponent } from './preismeldungen/preismeldungen-export';
import { PreismeldestellenExportComponent } from './preismeldestellen/preismeldestellen-export';
import { PreiserheberExportComponent } from './preiserheber/preiserheber-export';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule],
    declarations: [
        ExportToPrestaPage,
        PreismeldungenExportComponent,
        PreismeldestellenExportComponent,
        PreiserheberExportComponent,
    ],
    entryComponents: [
        PreismeldungenExportComponent,
        PreismeldestellenExportComponent,
        PreiserheberExportComponent,
    ],
    exports: [ExportToPrestaPage, PreismeldungenExportComponent, PreismeldestellenExportComponent, PreiserheberExportComponent]
})
export class ExportToPrestaModule {
}
