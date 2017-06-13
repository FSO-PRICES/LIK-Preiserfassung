import { EventEmitter, Output, Component, OnChanges, Input, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';
import { first } from 'lodash';

import { ReactiveComponent } from 'lik-shared';

@Component({
    selector: 'warenkorb-import',
    templateUrl: 'warenkorb-import.html',
})
export class WarenkorbImportComponent extends ReactiveComponent implements OnChanges {
    @Output('fileSelected')
    public fileSelected$: Observable<{ file: File, language: string }>;
    @Output('import')
    public importWarenkorbClicked$ = new EventEmitter<Event>();

    @Input() parsed: boolean;
    @Input() importedCount: string[];

    public warenkorbSelectedDe$ = new EventEmitter<Event>();
    public warenkorbSelectedFr$ = new EventEmitter<Event>();
    public warenkorbSelectedIt$ = new EventEmitter<Event>();

    public warenkorbIsParsed$: Observable<boolean>;
    public warenkorbImportedCount$: Observable<number>;
    public isWarenkorbImported$: Observable<boolean>;

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
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
