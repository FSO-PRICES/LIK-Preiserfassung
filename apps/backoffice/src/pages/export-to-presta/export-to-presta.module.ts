import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { NgxLetModule } from '@lik-shared';

import { PefMenuModule } from '../../components/pef-menu/pef-menu.module';

import { ExportToPrestaPage } from './export-to-presta';
@NgModule({
    imports: [CommonModule, IonicModule, TranslateModule, NgxLetModule, PefMenuModule],
    declarations: [ExportToPrestaPage],
})
export class ExportToPrestaModule {}
