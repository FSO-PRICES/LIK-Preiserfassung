import { Component, EventEmitter, Output, SimpleChange, Input, OnChanges } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';

import { ReactiveComponent, pefSearch, formatPercentageChange, PreismeldungIdentifierPayload } from 'lik-shared';

import * as P from '../../../../common-models';

@Component({
    selector: 'preismeldung-list',
    templateUrl: 'preismeldung-list.html',
})
export class PreismeldungListComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldungen: P.PreismeldungBag[];
    @Input() preismeldestellen: P.Models.Preismeldestelle[];
    @Input() currentPreismeldung: P.PreismeldungBag;
    @Input() status: string;
    @Output('selectPmsNummer') public preismeldestelleNummerSelected$ = new EventEmitter<string>();
    @Output('selectPreismeldung') public selectPreismeldung$ = new EventEmitter<P.PreismeldungBag>();
    @Output('globalFilterTextChanged') public globalFilterTextValueChanged$: Observable<PreismeldungIdentifierPayload>;

    public preismeldungen$ = this.observePropertyCurrentValue<P.PreismeldungBag[]>('preismeldungen');
    public preismeldestellen$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle[]>('preismeldestellen');
    public currentPreismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('currentPreismeldung');
    public status$ = this.observePropertyCurrentValue<string>('status');

    public filterTextValueChanges$ = new EventEmitter<string>();

    public filteredPreismeldungen$: Observable<P.PreismeldungBag[]>;
    public viewPortItems: P.PreismeldungBag[];

    constructor(private formBuilder: FormBuilder) {
        super();

        const selectedPreismeldestelleNummer$ = this.preismeldestelleNummerSelected$
            .asObservable()
            .startWith(null)
            .publishReplay(1)
            .refCount();

        this.globalFilterTextValueChanged$ = this.filterTextValueChanges$
            .debounceTime(300)
            .withLatestFrom(selectedPreismeldestelleNummer$)
            .filter(([_, pmsNummer]) => !pmsNummer)
            .map(([filter]) => matchesIdSearch(filter))
            .merge(selectedPreismeldestelleNummer$.filter(x => !!x).mapTo(null));

        this.filteredPreismeldungen$ = this.preismeldungen$
            .withLatestFrom(this.globalFilterTextValueChanged$.startWith(null))
            .combineLatest(
                this.filterTextValueChanges$.startWith(null),
                ([preismeldungen, globalFilterText], filterText) => {
                    if (!filterText || !!globalFilterText) {
                        return preismeldungen;
                    }
                    return pefSearch(filterText, preismeldungen, [
                        pm => pm.warenkorbPosition.gliederungspositionsnummer,
                        pm => pm.warenkorbPosition.positionsbezeichnung.de,
                        pm => pm.preismeldung.artikeltext,
                    ]);
                }
            )
            .debounceTime(300)
            .startWith([]);
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }

    formatPercentageChange = (preismeldung: P.Models.Preismeldung) => {
        return preismeldung.d_DPToVPK != null &&
            preismeldung.d_DPToVPK.percentage != null &&
            !isNaN(preismeldung.d_DPToVPK.percentage)
            ? formatPercentageChange(preismeldung.d_DPToVPK.percentage, 1)
            : formatPercentageChange(preismeldung.d_DPToVP.percentage, 1);
    };

    getBearbeitungscodeDescription(bearbeitungscode: P.Models.Bearbeitungscode) {
        return P.Models.bearbeitungscodeDescriptions[bearbeitungscode];
    }
}

function matchesIdSearch(filterText: string): PreismeldungIdentifierPayload {
    const idsRegex = /^([0-9]+?)\/(([0-9]*?)(\/([0-9]*?))?)$/;
    if (!idsRegex.test(filterText)) {
        return null;
    }
    const [, pmsNummer, , epNummer, , laufNummer] = filterText.match(idsRegex);
    return { pmsNummer, epNummer, laufNummer };
}
