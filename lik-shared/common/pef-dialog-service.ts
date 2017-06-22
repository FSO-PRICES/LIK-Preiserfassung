import { Component, Injectable } from '@angular/core';
import { PopoverController, ModalController, LoadingController } from 'ionic-angular';
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
    constructor(private popoverController: PopoverController, private modalController: ModalController, private loadingController: LoadingController) { }

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

    displayLoading(text: string, requestDismiss$: Observable<{}>) {
        const loader = this.loadingController.create({
            content: text
        });
        if (requestDismiss$ !== null) {
            requestDismiss$.take(1).subscribe(() => loader.dismiss());
        }
        return Observable.fromPromise(loader.present());
    }
}

export const YesNoButtons = [
    {
        textKey: 'btn_yes',
        dismissValue: 'YES'
    },
    {
        textKey: 'btn_no',
        dismissValue: 'NO'
    },
];
