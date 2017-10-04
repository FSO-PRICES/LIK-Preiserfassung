import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';

import { ReactiveComponent, pefSearch, formatPercentageChange } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html'
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() preismeldestellen: P.Models.Preismeldestelle[];
    @Input() currentPreismeldung: P.PreismeldungBag;
    @Input() status: string;
    @Output('selectPmsNummer') public selectPreismeldestelleNummer$: Observable<string>;
    @Output('selectPreismeldung') public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();

    public preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');
    public preismeldestellen$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle[]>('preismeldestellen');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('currentPreismeldung');
    public status$ = this.observePropertyCurrentValue<string>('status');

    public preismeldestelleNummerSelected$ = new EventEmitter<string>();
    public filterTextValueChanges = new EventEmitter<string>();

    public filteredPreismeldungen$: Observable<P.PreismeldungBag[]>;
    public viewPortItems: P.PreismeldungBag[];

    constructor(private formBuilder: FormBuilder) {
        super();

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

    formatPercentageChange = (preismeldung: P.Models.Preismeldung) => {
        return preismeldung.d_DPToVPK != null && preismeldung.d_DPToVPK.percentage != null && !isNaN(preismeldung.d_DPToVPK.percentage)
            ? formatPercentageChange(preismeldung.d_DPToVPK.percentage, 1)
            : formatPercentageChange(preismeldung.d_DPToVP.percentage, 1);
    }

    getBearbeitungscodeDescription(bearbeitungscode: P.Models.Bearbeitungscode) {
        return P.Models.bearbeitungscodeDescriptions[bearbeitungscode];
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

function filterById(preismeldungen: P.PreismeldungBag[], { pmsNummer, epNummer, laufNummer }: { pmsNummer: string, epNummer: string, laufNummer?: string }) {
    return preismeldungen.filter(p =>
        p.preismeldung.pmsNummer.indexOf(pmsNummer) !== -1 &&
        (!epNummer || p.preismeldung.epNummer.indexOf(epNummer) !== -1) &&
        (!laufNummer || p.preismeldung.laufnummer.indexOf(laufNummer) !== -1)
    );
}
