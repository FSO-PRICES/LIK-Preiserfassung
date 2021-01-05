/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import { Component, EventEmitter, HostBinding, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { PopoverController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { map, merge, startWith } from 'rxjs/operators';

@Component({
    selector: 'dialog-choose-percentage-reduction',
    styleUrls: ['./dialog-choose-percentage-reduction.scss'],
    templateUrl: './dialog-choose-percentage-reduction.html',
})
export class DialogChoosePercentageReductionComponent implements OnDestroy {
    @HostBinding('class') classes = 'pef-dialog';

    public okClicked$ = new EventEmitter();
    public quickSelect$ = new EventEmitter<number>();
    public isValid$: Observable<boolean>;

    form: FormGroup;

    private subscription: Subscription;

    constructor(public viewCtrl: PopoverController, formBuilder: FormBuilder) {
        this.form = formBuilder.group({ percentage: [''] });

        this.isValid$ = this.form.valueChanges.pipe(
            map(x => x.percentage),
            map(x => !!x && !isNaN(+x) && +x > 0 && +x < 100),
            startWith(false),
        );

        this.subscription = this.okClicked$
            .pipe(
                map(() => this.form.value.percentage),
                merge(this.quickSelect$),
            )
            .subscribe(percentage => viewCtrl.dismiss({ type: 'OK', percentage }));
    }

    ngOnDestroy() {
        this.subscription.unsubscribe();
    }
}
