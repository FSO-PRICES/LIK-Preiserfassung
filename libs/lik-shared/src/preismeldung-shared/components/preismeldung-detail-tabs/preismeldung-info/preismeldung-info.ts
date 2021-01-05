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
    EventEmitter,
    Input,
    OnChanges,
    Output,
    SimpleChange,
} from '@angular/core';
import { ElectronService } from 'ngx-electron';
import { Observable } from 'rxjs';
import { filter, map, withLatestFrom } from 'rxjs/operators';

import { ReactiveComponent } from '../../../../common/ReactiveComponent';
import * as P from '../../../models';

@Component({
    selector: 'preismeldung-info',
    styleUrls: ['./preismeldung-info.scss'],
    templateUrl: 'preismeldung-info.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreismeldungInfoComponent extends ReactiveComponent implements OnChanges {
    @Input() preismeldung: P.PreismeldungBag;
    @Input() priceCountStatus: P.PriceCountStatus;
    @Input() preismeldestelle: P.Models.Preismeldestelle;
    @Output('resetClicked') resetClicked$ = new EventEmitter();
    @Input() isDesktop: boolean;
    @Input() isAdminApp: boolean;

    public preismeldung$ = this.observePropertyCurrentValue<P.PreismeldungBag>('preismeldung');
    public priceCountStatus$ = this.observePropertyCurrentValue<P.PriceCountStatus>('priceCountStatus');
    public preismeldestelle$ = this.observePropertyCurrentValue<P.Models.Preismeldestelle>('preismeldestelle');
    public isDesktop$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isDesktop');
    public isAdminApp$ = this.observePropertyCurrentValue<P.WarenkorbInfo[]>('isAdminApp');
    public canReset$: Observable<boolean>;

    public numberFormattingOptions = { padRight: 2, truncate: 2, integerSeparator: '' };

    constructor(private electronService: ElectronService) {
        super();

        this.canReset$ = this.preismeldung$.pipe(
            withLatestFrom(this.isAdminApp$),
            filter(([pm]) => !!pm),
            map(
                ([pm, isAdminApp]) =>
                    (!isAdminApp
                        ? !pm.preismeldung.uploadRequestedAt
                        : !!pm.preismeldung.uploadRequestedAt && !pm.exported) && !!pm.preismeldung.erfasstAt,
            ),
        );
    }

    formatPreismeldungId(bag: P.PreismeldungBag) {
        return !bag ? '' : `${bag.preismeldung.pmsNummer}/${bag.preismeldung.epNummer}/${bag.preismeldung.laufnummer}`;
    }

    formatInternetLink(link: string) {
        if (!link) return link;
        return !link.startsWith('http://') && !link.startsWith('https://') ? `http://${link}` : link;
    }

    navigateToInternetLink(event: any, internetLink: string) {
        if (!internetLink) return;

        const _internetLink = this.formatInternetLink(internetLink);
        if (this.isDesktop) {
            event.preventDefault();
            this.electronService.shell.openExternal(_internetLink);
        }
    }

    ngOnChanges(changes: { [key: string]: SimpleChange }) {
        this.baseNgOnChanges(changes);
    }
}
