import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';

import { InitializationPage } from './initialization';
import { WarenkorbImportComponent } from './warenkorb/warenkorb-import';
import { PreismeldestellenImportComponent } from './preismeldestellen/preismeldestellen-import';
import { PreismeldungenImportComponent } from './preismeldungen/preismeldungen-import';
import { PreiserheberToPmsComponent } from './pe-to-pms/pe-to-pms';
import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

@NgModule({
    imports: [CommonModule, IonicModule, PefMenuModule],
    declarations: [
        InitializationPage,
        WarenkorbImportComponent,
        PreismeldestellenImportComponent,
        PreismeldungenImportComponent,
        PreiserheberToPmsComponent
    ],
    entryComponents: [
        WarenkorbImportComponent,
        PreismeldestellenImportComponent,
        PreismeldungenImportComponent,
        PreiserheberToPmsComponent
    ],
    exports: [InitializationPage, WarenkorbImportComponent, PreismeldestellenImportComponent, PreismeldungenImportComponent, PreiserheberToPmsComponent]
})
export class InitializationModule {
}
