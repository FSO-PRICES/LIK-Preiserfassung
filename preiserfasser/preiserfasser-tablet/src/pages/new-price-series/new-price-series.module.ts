import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from 'ng2-translate';

import { PreiserfasserCommonModule } from '../../common';
import { PefComponentsModule, PefDialogYesNoComponent } from 'lik-shared';

import { ChooseFromWarenkorbComponent } from './choose-from-warenkorb';
import { NewPriceSeriesPage } from './new-price-series';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule, PreiserfasserCommonModule, TranslateModule],
    declarations: [
        ChooseFromWarenkorbComponent,
        NewPriceSeriesPage,
    ],
    entryComponents: [
        NewPriceSeriesPage,
        PefDialogYesNoComponent,
    ],
    providers: [
        { provide: 'windowObject', useValue: window }
    ],
    exports: [ChooseFromWarenkorbComponent, PefComponentsModule]
})
export class NewPriceSeriesModule {
}
