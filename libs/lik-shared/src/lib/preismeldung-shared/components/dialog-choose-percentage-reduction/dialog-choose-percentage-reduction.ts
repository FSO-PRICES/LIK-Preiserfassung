import { Component, EventEmitter, HostBinding, inject } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import * as O from '@effect/data/Option';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, merge } from 'rxjs';
import { map, startWith, withLatestFrom } from 'rxjs/operators';
import { UnionOf, ofType, unionize } from 'unionize';

import { OO } from '../../../common';
import { StronglyTypedDialog } from '../../../pef-components';

export const DialogChoosePercentageReductionResult = unionize({
    Ok: ofType<{ percentage: number }>(),
    Cancel: {},
});
export type DialogChoosePercentageReductionResult = UnionOf<typeof DialogChoosePercentageReductionResult>;

@UntilDestroy()
@Component({
    selector: 'dialog-choose-percentage-reduction',
    styleUrls: ['./dialog-choose-percentage-reduction.scss'],
    templateUrl: './dialog-choose-percentage-reduction.html',
})
export class DialogChoosePercentageReductionComponent extends StronglyTypedDialog<
    never,
    DialogChoosePercentageReductionResult
> {
    @HostBinding('class') classes = 'pef-dialog';

    public okClicked$ = new EventEmitter();
    public quickSelect$ = new EventEmitter<number>();
    public isValid$: Observable<boolean>;

    private formBuilder = inject(FormBuilder);
    form = this.formBuilder.group({ percentage: new FormControl('') });
    translateService = inject(TranslateService);

    constructor() {
        super();

        const percentage$ = this.form.valueChanges.pipe(
            map(({ percentage }) =>
                !!percentage && !isNaN(+percentage) && +percentage > 0 && +percentage < 100
                    ? O.some(+percentage)
                    : O.none(),
            ),
        );

        this.isValid$ = percentage$.pipe(map(O.isSome), startWith(false));

        merge(
            this.okClicked$.pipe(
                withLatestFrom(percentage$),
                map(([, a]) => a),
                OO.fromFilteredSome,
            ),
            this.quickSelect$,
        )
            .pipe(untilDestroyed(this))
            .subscribe((percentage) => this.closeDialog(DialogChoosePercentageReductionResult.Ok({ percentage })));
    }

    cancel() {
        this.closeDialog(DialogChoosePercentageReductionResult.Cancel());
    }
}
