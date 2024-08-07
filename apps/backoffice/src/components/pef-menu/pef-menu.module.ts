import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { PefComponentsModule } from '@lik-shared';

import { PefMenuComponent } from './pef-menu';

@NgModule({
    imports: [RouterModule, CommonModule, TranslateModule, IonicModule, PefComponentsModule],
    declarations: [PefMenuComponent],
    exports: [PefMenuComponent],
})
export class PefMenuModule {}
