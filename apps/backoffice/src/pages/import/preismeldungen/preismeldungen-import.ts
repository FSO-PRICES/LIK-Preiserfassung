import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChange,
} from '@angular/core';
import { first } from 'lodash';
import { Observable } from 'rxjs';
import { map, publishReplay, refCount } from 'rxjs/operators';

import { ReactiveComponent } from '@lik-shared';

@Component({
    selector: 'preismeldungen-import',
    templateUrl: 'preismeldungen-import.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    public resetInputValue$: Observable<{ value: null }>;

    constructor() {
        super();

        this.fileSelected$ = this.preismeldungenSelected$.pipe(
            map(event => first((<HTMLInputElement>event.target).files)),
        );

        this.preismeldungenAreParsed$ = this.observePropertyCurrentValue<boolean>('parsed');
        this.preismeldungenImportedCount$ = this.observePropertyCurrentValue<number>('importedCount');

        this.arePreismeldungenImported$ = this.preismeldungenImportedCount$.pipe(map(x => x > 0));

        this.resetInputValue$ = this.observePropertyCurrentValue<{}>('resetFileInput').pipe(
            map(() => ({ value: null })),
            publishReplay(1),
            refCount(),
        );
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
