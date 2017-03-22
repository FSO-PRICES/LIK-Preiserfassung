import { EventEmitter, Output, Component, Input, SimpleChange, OnChanges } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'lodash';

import { ReactiveComponent } from 'lik-shared';

@Component({
    selector: 'preismeldungen-import',
    templateUrl: 'preismeldungen-import.html',
})
export class PreismeldungenImportComponent extends ReactiveComponent implements OnChanges {
    @Output('fileSelected')
    public fileSelected$: Observable<File>;
    @Output('import')
    public importPreismeldungenClicked$ = new EventEmitter<Event>();

    @Input() parsed: string[];
    @Input() importedCount: string[];

    public preismeldungenSelected$ = new EventEmitter<Event>();

    public preismeldungenAreParsed$: Observable<boolean>;
    public preismeldungenImportedCount$: Observable<number>;
    public arePreismeldungenImported$: Observable<boolean>;

    constructor() {
        super();

        this.fileSelected$ = this.preismeldungenSelected$
            .map(event => first((<HTMLInputElement>event.target).files));

        this.preismeldungenAreParsed$ = this.observePropertyCurrentValue<boolean>('parsed');
        this.preismeldungenImportedCount$ = this.observePropertyCurrentValue<number>('importedCount');

        this.arePreismeldungenImported$ = this.preismeldungenImportedCount$.map(x => x > 0);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
