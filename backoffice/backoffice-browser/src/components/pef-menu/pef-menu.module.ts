import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';
import { PefMenuComponent } from './pef-menu';

@NgModule({
    imports: [CommonModule, IonicModule],
    declarations: [
        PefMenuComponent
    ],
    entryComponents: [
        PefMenuComponent
    ],
    exports: [PefMenuComponent]
})
export class PefMenuModule {
}
