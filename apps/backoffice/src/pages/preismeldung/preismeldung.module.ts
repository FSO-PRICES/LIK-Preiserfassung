import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';

import { PreismeldungPage } from './preismeldung';
import { PreismeldungPagesModule } from './preismeldung-pages.module';

@NgModule({
    imports: [CommonModule, IonicModule, PreismeldungPagesModule],
    declarations: [PreismeldungPage],
})
export class PreismeldungModule {}
