import { EventEmitter, Output, Component, Input, OnChanges, SimpleChange } from '@angular/core';
import { Observable } from 'rxjs';

import { ReactiveComponent, Models as P } from 'lik-shared';

@Component({
    selector: 'preiserheber-export',
    templateUrl: 'preiserheber-export.html',
})
export class PreiserheberExportComponent extends ReactiveComponent implements OnChanges {
    @Input('preiserheber') preiserheber: P.Erheber[];
    @Input('preiszuweisungen') preiszuweisungen: P.Preiszuweisung[];
    @Input('exportCompleted') exportCompleted: number;

    @Output('startExport')
    public startExport$: Observable<boolean>;

    public exportCompleted$: Observable<number>;
    public createPreiserheberClicked$ = new EventEmitter<Event>();
    public canExport$: Observable<boolean>;
    public arePreiserheberExported$: Observable<boolean>;

    private preiserheber$: Observable<P.Erheber[]>;
    private preiszuweisungen$: Observable<P.Preiszuweisung[]>;

    constructor() {
        super();

        this.preiserheber$ = this.observePropertyCurrentValue<P.Erheber[]>('preiserheber').publishReplay(1).refCount();
        this.preiszuweisungen$ = this.observePropertyCurrentValue<P.Preiszuweisung[]>('preiszuweisungen').publishReplay(1).refCount();
        this.exportCompleted$ = this.observePropertyCurrentValue<number>('exportCompleted').publishReplay(1).refCount();

        this.canExport$ = this.preiserheber$
            .combineLatest(this.preiszuweisungen$, (preiserheber, preiszuweisungen) => ({ preiserheber, preiszuweisungen }))
            .map(({ preiserheber, preiszuweisungen }) => !!preiserheber && preiserheber.length > 0 && !!preiszuweisungen && preiszuweisungen.length > 0);

        this.startExport$ = this.createPreiserheberClicked$.mapTo(true);

        this.arePreiserheberExported$ = this.exportCompleted$.map(count => count > 0);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
