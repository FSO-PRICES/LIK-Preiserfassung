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
    selector: 'preismeldestellen-import',
    templateUrl: 'preismeldestellen-import.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
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

    public resetInputValue$: Observable<{ value: null }>;

    constructor() {
        super();

        this.fileSelected$ = this.preismeldestellenSelected$.pipe(
            map(event => first((<HTMLInputElement>event.target).files)),
        );

        this.preismeldestellenAreParsed$ = this.observePropertyCurrentValue<boolean>('parsed');
        this.preismeldestellenImportedCount$ = this.observePropertyCurrentValue<number>('importedCount');

        this.arePreismeldestellenImported$ = this.preismeldestellenImportedCount$.pipe(map(x => x > 0));

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
