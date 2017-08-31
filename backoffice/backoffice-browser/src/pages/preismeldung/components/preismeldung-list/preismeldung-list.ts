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
    public selectPreismeldung$ = new EventEmitter<string>();

    public current$: Observable<P.Preismeldung>;
    public preismeldungen$: Observable<PreismeldungBag[]>;
    public preismeldestellen$: Observable<P.Preismeldestelle[]>;

    public preismeldestelleNummerSelected$ = new EventEmitter<string>();
    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldungen$: Observable<PreismeldungBag[]>;
    public viewPortItems: PreismeldungBag[];

    constructor(private formBuilder: FormBuilder) {
        super();

        this.preismeldungen$ = this.observePropertyCurrentValue<PreismeldungBag[]>('preismeldungen');
        this.preismeldestellen$ = this.observePropertyCurrentValue<P.Preismeldestelle[]>('preismeldestellen');
        this.current$ = this.observePropertyCurrentValue<P.Preismeldung>('current');

        this.selectPreismeldestelleNummer$ = this.preismeldestelleNummerSelected$
            .filter(x => !!x);

        this.filteredPreismeldungen$ = this.preismeldungen$
            .combineLatest(this.filterTextValueChanges.startWith(null), (preismeldungen, filterText) => {
                if (!filterText) {
                    return preismeldungen;
                }
                const idSearch = matchesIdSearch(filterText);
                return idSearch !== null ?
                    filterById(preismeldungen, idSearch) :
                    pefSearch(filterText, preismeldungen, [pm => pm.warenkorbPosition.gliederungspositionsnummer, pm => pm.warenkorbPosition.positionsbezeichnung.de, pm => pm.preismeldung.artikeltext])
            })
            .debounceTime(300)
            .startWith([]);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}

function matchesIdSearch(filterText: string) {
    const idsRegex = /^([0-9]+)(\/([0-9]*)(\/([0-9]*))?)?$/;
    if (!idsRegex.test(filterText)) {
        return null;
    }
    const [, pmsNummer, , epNummer, , laufNummer] = filterText.match(idsRegex);
    return { pmsNummer, epNummer, laufNummer };
}

function filterById(preismeldungen: PreismeldungBag[], { pmsNummer, epNummer, laufNummer }: { pmsNummer: string, epNummer: string, laufNummer?: string }) {
    return preismeldungen.filter(p =>
        p.preismeldung.pmsNummer.indexOf(pmsNummer) !== -1 &&
        (!epNummer || p.preismeldung.epNummer.indexOf(epNummer) !== -1) &&
        (!laufNummer || p.preismeldung.laufnummer.indexOf(laufNummer) !== -1)
    );
}
