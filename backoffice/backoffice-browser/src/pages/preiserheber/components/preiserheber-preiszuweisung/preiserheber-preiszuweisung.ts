/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import {
    ChangeDetectionStrategy,
    Component,
    OnChanges,
    SimpleChange,
    Input,
    EventEmitter,
    Output,
} from '@angular/core';
import { Observable, Subscribable } from 'rxjs/Observable';
import { some, reduce } from 'lodash';

import { ReactiveComponent, Models as P, pefSearch, sortBySelector } from 'lik-shared';

@Component({
    selector: 'preiserheber-preiszuweisung',
    templateUrl: 'preiserheber-preiszuweisung.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreiserheberPreiszuweisungComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldestellen: P.Preismeldestelle[];
    @Input() current: P.Preiszuweisung;
    @Input() preiszuweisungen: P.Preiszuweisung[];
    @Output('save') public save$ = new EventEmitter();
    @Output('assign') public assign$: Observable<P.Preismeldestelle[]>;
    @Output('unassign') public unassign$: Observable<P.Preismeldestelle[]>;

    public filterTextValueChanges$ = new EventEmitter<string>();
    public selectPreismeldestelleClick$ = new EventEmitter<{
        preismeldestelle: P.Preismeldestelle;
        event: MouseEvent;
    }>();
    public assignPreismeldestelleClick$ = new EventEmitter();
    public unassignPreismeldestelleClick$ = new EventEmitter();

    public assignedPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public filteredPreismeldestellen$: Observable<P.Preismeldestelle[]>;
    public allViewPortItems: P.Preismeldestelle[];
    public assignedViewPortItems: P.Preismeldestelle[];

    public current$: Observable<P.Preiszuweisung>;
    public selectedPreismeldestellen$: Observable<{ [_id: string]: P.Preismeldestelle }>;
    public hasSelectedUnassignedPreismeldestelle$: Observable<boolean>;
    public hasSelectedAssignedPreismeldestelle$: Observable<boolean>;

    constructor() {
        super();

        this.current$ = this.observePropertyCurrentValue<P.Preiszuweisung>('current')
            .publishReplay(1)
            .refCount();

        const preiszuweisungen$ = this.observePropertyCurrentValue<P.Preiszuweisung[]>('preiszuweisungen')
            .publishReplay(1)
            .refCount();

        const preismeldestellen$ = this.observePropertyCurrentValue<P.Preismeldestelle[]>('preismeldestellen')
            .publishReplay(1)
            .refCount();

        const unassignedPreismeldestellen$ = preiszuweisungen$
            .combineLatest(
                preismeldestellen$,
                (preiszuweisungen: P.Preiszuweisung[], preismeldestellen: P.Preismeldestelle[]) => ({
                    preiszuweisungen,
                    preismeldestellen,
                })
            )
            .combineLatest(this.current$, ({ preiszuweisungen, preismeldestellen }, currentPreiserheber) => ({
                preiszuweisungen,
                preismeldestellen,
                currentPreiserheber: currentPreiserheber,
            }))
            .filter(({ preismeldestellen, currentPreiserheber }) => !!preismeldestellen && !!currentPreiserheber)
            .map(({ preiszuweisungen, preismeldestellen, currentPreiserheber }) => {
                if (!!currentPreiserheber && !!preiszuweisungen) {
                    const alreadyAssigned = reduce(
                        preiszuweisungen,
                        (prev, curr) => {
                            return curr._id !== currentPreiserheber._id
                                ? prev.concat(curr.preismeldestellenNummern)
                                : prev;
                        },
                        <string[]>[]
                    );
                    return sortBySelector(
                        preismeldestellen.filter(x => !alreadyAssigned.some(pmsNummer => pmsNummer === x.pmsNummer)),
                        pms => pms.name.toLowerCase()
                    );
                }
                return sortBySelector(preismeldestellen, pms => pms.name.toLowerCase());
            })
            .startWith([]);

        this.assignedPreismeldestellen$ = this.current$
            .filter(x => !!x)
            .withLatestFrom(preismeldestellen$, (preiszuweisung, preismeldestellen) => ({
                preiszuweisung,
                preismeldestellen,
            }))
            .map(({ preiszuweisung, preismeldestellen }) =>
                sortBySelector(
                    preismeldestellen.filter(p => preiszuweisung.preismeldestellenNummern.some(x => x === p.pmsNummer)),
                    pms => pms.name.toLowerCase()
                )
            )
            .startWith([])
            .publishReplay(1)
            .refCount();

        this.filteredPreismeldestellen$ = unassignedPreismeldestellen$
            .withLatestFrom(this.assignedPreismeldestellen$, (unassignedPreismeldestellen, assigned) => ({
                unassignedPreismeldestellen,
                assigned,
            }))
            .map(({ unassignedPreismeldestellen, assigned }) =>
                unassignedPreismeldestellen.filter(
                    preismeldestelle => assigned.length === 0 || !assigned.some(x => x._id === preismeldestelle._id)
                )
            )
            .filter(x => !!x)
            .combineLatest(
                this.filterTextValueChanges$.startWith(null),
                (preismeldestellen, filterText) =>
                    !filterText
                        ? preismeldestellen
                        : pefSearch(filterText, preismeldestellen, [
                              x => x.name,
                              x => x.pmsNummer,
                              x => x.town,
                              x => x.postcode,
                              x => x.erhebungsregion,
                          ])
            )
            .publishReplay(1)
            .refCount();

        this.selectedPreismeldestellen$ = this.selectPreismeldestelleClick$
            .map(({ preismeldestelle, event }) => ({ preismeldestelle, multi: event.ctrlKey }))
            .merge(
                unassignedPreismeldestellen$.map(
                    () =>
                        null as {
                            preismeldestelle: P.Preismeldestelle;
                            multi: true;
                        }
                )
            )
            .scan(
                (previous, current) => {
                    return !previous || !current || !current.multi
                        ? current ? [current.preismeldestelle] : []
                        : !previous.find(x => x._id === current.preismeldestelle._id)
                            ? [...previous, current.preismeldestelle]
                            : [...previous.filter(x => x._id !== current.preismeldestelle._id)];
                },
                null as P.Preismeldestelle[]
            )
            .map(x => x.reduce((prev, cur) => ({ ...prev, [cur._id]: cur }), {}))
            .startWith({})
            .publishReplay(1)
            .refCount();

        const selectedPreismeldestellenList$ = this.selectedPreismeldestellen$.map(preismeldestellen =>
            Object.keys(preismeldestellen).map(_id => preismeldestellen[_id])
        );

        this.hasSelectedUnassignedPreismeldestelle$ = selectedPreismeldestellenList$
            .combineLatest(this.filteredPreismeldestellen$)
            .map(
                ([preismeldestellen, filteredPreismeldestellen]) =>
                    !!preismeldestellen &&
                    some(filteredPreismeldestellen, (x: P.Preismeldestelle) =>
                        preismeldestellen.some(p => x._id === p._id)
                    )
            )
            .publishReplay(1)
            .refCount();
        this.hasSelectedAssignedPreismeldestelle$ = selectedPreismeldestellenList$
            .combineLatest(this.assignedPreismeldestellen$)
            .map(
                ([preismeldestellen, assignedPreismeldestellen]) =>
                    !!preismeldestellen &&
                    some(assignedPreismeldestellen, (x: P.Preismeldestelle) =>
                        preismeldestellen.some(p => x._id === p._id)
                    )
            )
            .publishReplay(1)
            .refCount();

        this.assign$ = this.assignPreismeldestelleClick$.withLatestFrom(
            selectedPreismeldestellenList$,
            (_, preismeldestellen) => preismeldestellen
        );
        this.unassign$ = this.unassignPreismeldestelleClick$.withLatestFrom(
            selectedPreismeldestellenList$,
            (_, preismeldestellen) => preismeldestellen
        );
    }

    public ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
