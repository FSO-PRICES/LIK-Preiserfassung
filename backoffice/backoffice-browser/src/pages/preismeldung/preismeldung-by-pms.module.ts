import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreismeldungByPmsPage } from './preismeldung-by-pms';
import { PreismeldungPagesModule } from './preismeldung-pages.module';

@NgModule({
    declarations: [PreismeldungByPmsPage],
    imports: [PreismeldungPagesModule, IonicPageModule.forChild(PreismeldungByPmsPage)],
})
export class PreismeldungByPmsModule {}
