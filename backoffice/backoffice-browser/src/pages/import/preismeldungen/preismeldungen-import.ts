import { EventEmitter, Output, Component, Input, SimpleChange, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'lodash';

import { ReactiveComponent } from 'lik-shared';

@Component({
    selector: 'preismeldungen-import',
    templateUrl: 'preismeldungen-import.html',
})
export class PreismeldungenImportComponent extends ReactiveComponent implements OnChanges {
    @Input() parsed: string[];
    @Input() importedCount: string[];
    @Input() resetFileInput: {};

    @Output('fileSelected') public fileSelected$: Observable<File>;
    @Output('import') public importPreismeldungenClicked$ = new EventEmitter<Event>();

    public preismeldungenSelected$ = new EventEmitter<Event>();

    public preismeldungenAreParsed$: Observable<boolean>;
    public preismeldungenImportedCount$: Observable<number>;
    public arePreismeldungenImported$: Observable<boolean>;

    public resetInputValue$: Observable<null>;

    constructor() {
        super();

        this.fileSelected$ = this.preismeldungenSelected$
            .map(event => first((<HTMLInputElement>event.target).files));

        this.preismeldungenAreParsed$ = this.observePropertyCurrentValue<boolean>('parsed');
        this.preismeldungenImportedCount$ = this.observePropertyCurrentValue<number>('importedCount');

        this.arePreismeldungenImported$ = this.preismeldungenImportedCount$.map(x => x > 0);

        this.resetInputValue$ = this.observePropertyCurrentValue<{}>('resetFileInput')
            .map(() => ({ value: null }))
            .publishReplay(1).refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
