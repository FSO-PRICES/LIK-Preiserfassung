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
