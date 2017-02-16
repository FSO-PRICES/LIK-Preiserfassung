import { Component, Injectable } from '@angular/core';
import { PopoverController } from 'ionic-angular';
import { Observable } from 'rxjs';

@Injectable()
export class PefDialogService {
    constructor(private popoverController: PopoverController) { }

    displayDialog(dialogComponent: Component, params: any, enableBackdropDismiss = false) {
        const dialog = this.popoverController.create(dialogComponent, { params }, { enableBackdropDismiss });
        dialog.present();
        return Observable.bindCallback(cb => dialog.onWillDismiss(cb))()
            .map(([data, role]) => ({ data, role }));
    }
}
