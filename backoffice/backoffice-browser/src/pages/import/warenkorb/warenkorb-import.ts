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

    @Output('fileSelected') public fileSelected$: Observable<{ file: File, language: string }>;
    @Output('import') public importWarenkorbClicked$ = new EventEmitter<Event>();

    public warenkorbSelectedDe$ = new EventEmitter<Event>();
    public warenkorbSelectedFr$ = new EventEmitter<Event>();
    public warenkorbSelectedIt$ = new EventEmitter<Event>();

    public warenkorbIsParsed$: Observable<boolean>;
    public warenkorbImportedCount$: Observable<number>;
    public isWarenkorbImported$: Observable<boolean>;

    public resetInputValue$: Observable<null>;

    constructor() {
        super();

        this.fileSelected$ = Observable.merge(
            this.warenkorbSelectedDe$
                .map(event => ({ file: first((<HTMLInputElement>event.target).files), language: 'de' })),
            this.warenkorbSelectedFr$
                .map(event => ({ file: first((<HTMLInputElement>event.target).files), language: 'fr' })),
            this.warenkorbSelectedIt$
                .map(event => ({ file: first((<HTMLInputElement>event.target).files), language: 'it' }))
        );

        this.warenkorbIsParsed$ = this.observePropertyCurrentValue<boolean>('parsed');
        this.warenkorbImportedCount$ = this.observePropertyCurrentValue<number>('importedCount');

        this.isWarenkorbImported$ = this.warenkorbImportedCount$.map(x => x > 0);

        this.resetInputValue$ = this.observePropertyCurrentValue<{}>('resetFileInput')
            .map(() => ({ value: null }))
            .publishReplay(1).refCount();
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
