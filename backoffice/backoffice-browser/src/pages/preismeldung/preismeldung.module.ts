import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';

import { PreismeldungPage } from './preismeldung';
import { PreismeldungPagesModule } from './preismeldung-pages.module';

@NgModule({
    declarations: [PreismeldungPage],
    imports: [PreismeldungPagesModule, IonicPageModule.forChild(PreismeldungPage)],
})
export class PreismeldungModule {}
