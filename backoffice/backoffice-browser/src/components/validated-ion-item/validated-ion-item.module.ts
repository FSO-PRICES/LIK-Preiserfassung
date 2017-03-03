import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from 'ionic-angular';
import { ValidatedIonItemComponent } from './validated-ion-item';

@NgModule({
    imports: [CommonModule, IonicModule],
    declarations: [
        ValidatedIonItemComponent
    ],
    entryComponents: [
        ValidatedIonItemComponent
    ],
    exports: [ValidatedIonItemComponent]
})
export class ValidatedIonItemModule {
}
