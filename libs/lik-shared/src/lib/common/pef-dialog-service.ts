import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { ComponentType } from '@angular/cdk/overlay';
import { Injectable } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { PopoverOptions } from '@ionic/core';
import { Observable, from } from 'rxjs';
import { shareReplay, switchMap, take } from 'rxjs/operators';

import { StronglyTypedDialog } from '../pef-components';

type TextDialogOptions = {
    requestDismiss$?: Observable<unknown>;
    dialogOptions?: Omit<PopoverOptions, 'component' | 'componentProps'>;
};

@Injectable()
export class PefDialogService {
    constructor(private loadingController: LoadingController, private dialog: Dialog) {}

    displayDialog<D, R, DisableClose extends boolean = false>(
        component: ComponentType<StronglyTypedDialog<D, R>>,
        config?: DialogConfig<D, DialogRef<R, StronglyTypedDialog<D, R>>> & { disableClose: DisableClose },
    ): Observable<DisableClose extends true ? R : R | undefined> {
        const dialogRef = this.dialog.open<R, D, StronglyTypedDialog<D, R>>(component, config);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return dialogRef.closed as any;
    }

    displayLoading(text: string, options: TextDialogOptions = {}) {
        const { requestDismiss$, dialogOptions } = { requestDismiss$: null, dialogOptions: null, ...options };
        const loader$ = from(
            this.loadingController.create({
                message: text,
                ...dialogOptions,
            }),
        ).pipe(
            switchMap((dialog) => dialog.present().then(() => dialog)),
            shareReplay({ bufferSize: 1, refCount: true }),
        );
        loader$.pipe(take(1)).subscribe();
        if (requestDismiss$ !== null) {
            requestDismiss$
                .pipe(
                    take(1),
                    switchMap(() => loader$),
                )
                .subscribe((loader) => loader.dismiss());
        }
        return loader$;
    }
}
