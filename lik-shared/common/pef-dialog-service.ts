import { Component, Injectable } from '@angular/core';
import { LoadingController, ModalController, PopoverController } from 'ionic-angular';
import { bindCallback, from, Observable } from 'rxjs';
import { take } from 'rxjs/operators';

export interface DialogOptions {
    params?: any;
    enableBackdropDismiss?: boolean;
    requestDismiss$?: Observable<{}>;
}

const defaultOptions: DialogOptions = {
    params: null,
    enableBackdropDismiss: false,
    requestDismiss$: null,
};

@Injectable()
export class PefDialogService {
    constructor(
        private popoverController: PopoverController,
        private modalController: ModalController,
        private loadingController: LoadingController,
    ) {}

    displayDialog(
        dialogComponent: any,
        params: any,
        enableBackdropDismiss = false,
        requestDismiss$: Observable<{}> = null,
    ) {
        const dialog = this.popoverController.create(dialogComponent, { params }, { enableBackdropDismiss });
        dialog.present();
        if (requestDismiss$ !== null) {
            requestDismiss$.pipe(take(1)).subscribe(() => dialog.dismiss());
        }
        return bindCallback<any[]>(cb => dialog.onWillDismiss(cb))().map(([data, role]) => ({ data, role }));
    }

    displayModal(dialogComponent: Component, options: DialogOptions = defaultOptions) {
        const dialog = this.modalController.create(
            dialogComponent,
            { params: options.params },
            { enableBackdropDismiss: options.enableBackdropDismiss },
        );
        dialog.present();
        if (options.requestDismiss$ !== null) {
            options.requestDismiss$.pipe(take(1)).subscribe(() => dialog.dismiss());
        }
        return bindCallback<any[]>(cb => dialog.onWillDismiss(cb))().map(([data, role]) => ({ data, role }));
    }

    displayLoading(text: string, requestDismiss$: Observable<{}>) {
        const loader = this.loadingController.create({
            content: text,
        });
        if (requestDismiss$ !== null) {
            requestDismiss$.pipe(take(1)).subscribe(() => loader.dismiss());
        }
        return from(loader.present());
    }
}
