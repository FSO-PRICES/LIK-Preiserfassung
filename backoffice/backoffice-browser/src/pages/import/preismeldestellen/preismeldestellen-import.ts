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

import { EventEmitter, Output, Component, Input, SimpleChange, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'lodash';

import { ReactiveComponent } from 'lik-shared';

@Component({
    selector: 'preismeldestellen-import',
    templateUrl: 'preismeldestellen-import.html',
})
export class PreismeldestellenImportComponent extends ReactiveComponent implements OnChanges {
    @Input() parsed: string[];
    @Input() importedCount: string[];
    @Input() resetFileInput: {};

    @Output('fileSelected') public fileSelected$: Observable<File>;
    @Output('import') public importPreismeldestellenClicked$ = new EventEmitter<Event>();

    public preismeldestellenSelected$ = new EventEmitter<Event>();

    public preismeldestellenAreParsed$: Observable<boolean>;
    public preismeldestellenImportedCount$: Observable<number>;
    public arePreismeldestellenImported$: Observable<boolean>;

    public resetInputValue$: Observable<null>;

    constructor() {
        super();

        this.fileSelected$ = this.preismeldestellenSelected$
            .map(event => first((<HTMLInputElement>event.target).files));

        this.preismeldestellenAreParsed$ = this.observePropertyCurrentValue<boolean>('parsed');
        this.preismeldestellenImportedCount$ = this.observePropertyCurrentValue<number>('importedCount');

        this.arePreismeldestellenImported$ = this.preismeldestellenImportedCount$.map(x => x > 0);

        this.resetInputValue$ = this.observePropertyCurrentValue<{}>('resetFileInput')
            .map(() => ({ value: null }))
            .publishReplay(1).refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
