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

import { EventEmitter, Output, Component, OnChanges, Input, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'lodash';

import { ReactiveComponent } from 'lik-shared';

@Component({
    selector: 'warenkorb-import',
    templateUrl: 'warenkorb-import.html',
})
export class WarenkorbImportComponent extends ReactiveComponent implements OnChanges {
    @Input() parsed: boolean;
    @Input() importedCount: string[];
    @Input() resetFileInput: {};

    @Output('fileSelected') public fileSelected$: Observable<File>;
    @Output('import') public importWarenkorbClicked$ = new EventEmitter<Event>();

    public warenkorbSelected$ = new EventEmitter<Event>();

    public warenkorbIsParsed$: Observable<boolean>;
    public warenkorbImportedCount$: Observable<number>;
    public isWarenkorbImported$: Observable<boolean>;

    public resetInputValue$: Observable<{ value: null }>;

    constructor() {
        super();

        this.fileSelected$ = this.warenkorbSelected$.map(event => first((<HTMLInputElement>event.target).files));

        this.warenkorbIsParsed$ = this.observePropertyCurrentValue<boolean>('parsed');
        this.warenkorbImportedCount$ = this.observePropertyCurrentValue<number>('importedCount');

        this.isWarenkorbImported$ = this.warenkorbImportedCount$.map(x => x > 0);

        this.resetInputValue$ = this.observePropertyCurrentValue<{}>('resetFileInput')
            .map(() => ({ value: null }))
            .publishReplay(1)
            .refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
