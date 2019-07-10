import { Injectable } from '@angular/core';
import { LoadingController, ModalController, PopoverController } from '@ionic/angular';
import { from, Observable } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { InputP } from './dialog';

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

    displayDialog<T extends Function, K extends keyof T['prototype']>(
        dialogComponent: T,
        params: { [P in K]: T['prototype'][P] extends InputP<unknown> ? T['prototype'][P] : never },
        backdropDismiss = false,
        requestDismiss$: Observable<{}> = null,
    ) {
        const dialog$ = from(
            this.popoverController.create({ component: dialogComponent, componentProps: params, backdropDismiss }),
        ).pipe(switchMap(dialog => dialog.present().then(() => dialog)));
        if (requestDismiss$ !== null) {
            requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => dialog$),
                )
                .subscribe(dialog => dialog.dismiss());
        }
        return dialog$.pipe(switchMap(dialog => dialog.onWillDismiss()));
    }

    displayModal(dialogComponent: any, options: DialogOptions = defaultOptions) {
        const dialog$ = from(
            this.modalController.create({
                component: dialogComponent,
                componentProps: options.params,
                backdropDismiss: options.enableBackdropDismiss,
            }),
        ).pipe(switchMap(dialog => dialog.present().then(() => dialog)));
        if (options.requestDismiss$ !== null) {
            options.requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => dialog$),
                )
                .subscribe(dialog => dialog.dismiss());
        }
        return dialog$.pipe(switchMap(dialog => dialog.onWillDismiss()));
    }

    displayLoading(text: string, requestDismiss$: Observable<{}>) {
        const loader$ = from(
            this.loadingController.create({
                message: text,
            }),
        ).pipe(switchMap(dialog => dialog.present().then(() => dialog)));
        if (requestDismiss$ !== null) {
            requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => loader$),
                )
                .subscribe(loader => loader.dismiss());
        }
        return loader$;
    }
}
