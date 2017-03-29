import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';

import { ReactiveComponent, Models as P, pefSearch } from 'lik-shared';

import { PreismeldungBag } from '../../../../reducers/preismeldung';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html'
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldungen: PreismeldungBag[];
    @Input() preismeldestellen: P.Preismeldestelle[];
    @Input() current: P.Preismeldung;
    @Output('selectPmsNummer')
    public selectPreismeldestelleNummer$: Observable<string>;
    @Output('selected')
    public selectPreismeldung$ = new EventEmitter<P.Preismeldung>();

    public current$: Observable<P.Preismeldung>;
    public preismeldungen$: Observable<PreismeldungBag[]>;
    public preismeldestellen$: Observable<P.Preismeldestelle[]>;

    public preismeldestelleNummerSelected$ = new EventEmitter<string>();
    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldungen$: Observable<PreismeldungBag[]>;
    public viewPortItems: PreismeldungBag[];

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<PreismeldungBag[]>('preismeldungen')
            .map(x => x.slice(0, 100)); // TODO: REMOVE!!!

        this.preismeldestellen$ = this.observePropertyCurrentValue<P.Preismeldestelle[]>('preismeldestellen');
        this.current$ = this.observePropertyCurrentValue<P.Preismeldung>('current');

        this.selectPreismeldestelleNummer$ = this.preismeldestelleNummerSelected$
            .filter(x => !!x);

        this.filteredPreismeldungen$ = this.preismeldungen$
            .combineLatest(this.filterTextValueChanges.startWith(null), (preismeldungen, filterText) =>
                !filterText ? preismeldungen : pefSearch(filterText, preismeldungen, [pm => pm.warenkorbPosition.gliederungspositionsnummer, pm => pm.warenkorbPosition.positionsbezeichnung.de, pm => pm.preismeldung.artikeltext])
            );
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
