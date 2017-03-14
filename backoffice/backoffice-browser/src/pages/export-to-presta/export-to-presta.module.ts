import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { ExportToPrestaPage } from './export-to-presta';
import { PreismeldungenExportComponent } from './preismeldungen/preismeldungen-export';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule],
    declarations: [
        ExportToPrestaPage,
        PreismeldungenExportComponent,
    ],
    entryComponents: [
        PreismeldungenExportComponent,
    ],
    exports: [ExportToPrestaPage, PreismeldungenExportComponent]
})
export class ExportToPrestaModule {
}
