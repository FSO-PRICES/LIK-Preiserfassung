import { Component, Injectable } from '@angular/core';
import { PopoverController, ModalController } from 'ionic-angular';
import { Observable } from 'rxjs';

export interface DialogOptions {
    params?: any;
    enableBackdropDismiss?: boolean;
    requestDismiss$?: Observable<{}>;
}

const defaultOptions: DialogOptions = {
    params: null,
    enableBackdropDismiss: false,
    requestDismiss$: null
};

@Injectable()
export class PefDialogService {
    constructor(private popoverController: PopoverController, private modalController: ModalController) { }

    displayDialog(dialogComponent: Component, params: any, enableBackdropDismiss = false, requestDismiss$: Observable<{}> = null) {
        const dialog = this.popoverController.create(dialogComponent, { params }, { enableBackdropDismiss });
        dialog.present();
        if (requestDismiss$ !== null) {
            requestDismiss$.take(1).subscribe(() => dialog.dismiss());
        }
        return Observable.bindCallback(cb => dialog.onWillDismiss(cb))()
            .map(([data, role]) => ({ data, role }));
    }

    displayModal(dialogComponent: Component, options: DialogOptions = defaultOptions) {
        const dialog = this.modalController.create(dialogComponent, { params: options.params }, { enableBackdropDismiss: options.enableBackdropDismiss });
        dialog.present();
        if (options.requestDismiss$ !== null) {
            options.requestDismiss$.take(1).subscribe(() => dialog.dismiss());
        }
        return Observable.bindCallback(cb => dialog.onWillDismiss(cb))()
            .map(([data, role]) => ({ data, role }));
    }
}
