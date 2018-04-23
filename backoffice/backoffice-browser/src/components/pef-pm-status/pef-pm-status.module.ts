import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';

import { PefPmStatusComponent } from './pef-pm-status.component';

@NgModule({
    imports: [CommonModule, IonicModule],
    declarations: [PefPmStatusComponent],
    exports: [PefPmStatusComponent],
})
export class PefPmStatusModule {}
