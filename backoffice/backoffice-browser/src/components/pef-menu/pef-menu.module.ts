import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';

import { PefComponentsModule } from 'lik-shared';

import { PefMenuComponent } from './pef-menu';

@NgModule({
    imports: [CommonModule, IonicModule, PefComponentsModule],
    declarations: [
        PefMenuComponent
    ],
    exports: [PefMenuComponent]
})
export class PefMenuModule {
}
