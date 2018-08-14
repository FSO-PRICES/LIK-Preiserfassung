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
