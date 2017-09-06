import { NgModule } from '@angular/core';
import { IonicModule } from 'ionic-angular';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from 'lik-shared';

import { DelayDragDirective } from './delay-drag.directive';
import { PefDisableInputNegativeNumberDirective } from './pef-disable-input-negative-number';

@NgModule({
    imports: [PefComponentsModule],
    declarations: [
        DelayDragDirective,
        PefDisableInputNegativeNumberDirective,
    ],
    exports: [
        DelayDragDirective,
        PefDisableInputNegativeNumberDirective,
    ]
})
export class PreiserfasserCommonModule { }
