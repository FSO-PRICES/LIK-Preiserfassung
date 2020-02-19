import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { PreismeldungByPmsPage } from './preismeldung-by-pms';
import { PreismeldungPagesModule } from './preismeldung-pages.module';

@NgModule({
    imports: [CommonModule, IonicModule, PreismeldungPagesModule],
    declarations: [PreismeldungByPmsPage],
})
export class PreismeldungByPmsModule {}
