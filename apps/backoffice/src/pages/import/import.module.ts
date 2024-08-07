import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';
import { ImportPage } from './import';
import { PreismeldestellenImportComponent } from './preismeldestellen/preismeldestellen-import';
import { PreismeldungenImportComponent } from './preismeldungen/preismeldungen-import';
import { WarenkorbImportComponent } from './warenkorb/warenkorb-import';

@NgModule({
    imports: [CommonModule, TranslateModule, IonicModule, PefMenuModule],
    declarations: [
        ImportPage,
        WarenkorbImportComponent,
        PreismeldestellenImportComponent,
        PreismeldungenImportComponent,
    ],
})
export class ImportModule {}
