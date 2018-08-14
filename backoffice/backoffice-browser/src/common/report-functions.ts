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

import * as moment from 'moment';
import { uniq } from 'lodash';

import * as report from '../actions/report';
import { MonthlyReport, OrganisationReport, PmsProblemeReport } from '../reducers/report';
import { Models as P, PreismeldungBag } from 'lik-shared';
import { PmsGeschlossen } from './pms-geschlossen';

export function prepareMonthlyData({
    preismeldestellen,
    preismeldungen,
    refPreismeldungen,
    erhebungsmonat,
}: report.MonthlyReportData) {
    const map: MonthlyReport = {
        zeitpunkt: getZeitpunktData(erhebungsmonat),

        preismeldungen: {
            total: refPreismeldungen.length,
            erfasst: 0,
            new: 0,
        },

        erhebungsart: {
            'N/A': 0,
            offline: 0,
            online: 0,
        },

        bearbeitungsCode: {
            'N/A': 0,
            '0': 0,
            '99': 0,
            '1': 0,
            '2': 0,
            '3': 0,
            '7': 0,
            '44': 0,
            '101': 0,
            Aktion: 0,
        },

        preisentwicklungen: {
            stabil: 0,
            gestiegen: 0,
            aktionsende: 0,
            gesunken: 0,
            aktionAusverkauf: 0,
        },

        erhebungsartDetailPm: {
            tablet: 0,
            telefon: 0,
            email: 0,
            papierlisteAbgegeben: 0,
            papierlisteVorOrt: 0,
            internet: 0,
            total: 0,
        },

        erhebungsartDetailPms: {
            tablet: 0,
            telefon: 0,
            email: 0,
            papierlisteAbgegeben: 0,
            papierlisteVorOrt: 0,
            internet: 0,
            total: 0,
        },
    };

    const pmsOnOffline = mapPmsToOnAndOffline(preismeldestellen);
    const erhebungsartenByPmsNummer = preismeldestellen.reduce(
        (erhebungsarten, pmsBag) => ({
            ...erhebungsarten,
            [pmsBag.pms.pmsNummer]: Object.keys(pmsBag.erhebungsarten).filter(
                art => pmsBag.erhebungsarten[art]
            ) as any[],
        }),
        {} as { [pmsNummer: string]: (keyof P.Erhebungsarten)[] }
    );

    preismeldungen.forEach(bag => {
        if (!!bag.preismeldung.uploadRequestedAt) {
            map.preismeldungen.erfasst++;
        }
        if (bag.preismeldung.bearbeitungscode === 2 || bag.preismeldung.bearbeitungscode === 3) {
            map.preismeldungen.new++;
        }

        const bc = bag.preismeldung.bearbeitungscode;
        map.bearbeitungsCode[bc != null ? bc : 'N/A']++;
        if (bag.preismeldung.aktion) {
            map.bearbeitungsCode.Aktion++;
        }

        map.erhebungsart[pmsOnOffline[bag.preismeldung.pmsNummer]]++;

        const preisT = parseFloat(bag.preismeldung.preis),
            preisVP = bag.refPreismeldung.preis;
        if (preisT > preisVP) {
            map.preisentwicklungen.gestiegen++;
        } else if (preisT < preisVP) {
            map.preisentwicklungen.gesunken++;
        } else {
            map.preisentwicklungen.stabil++;
        }

        if (bag.preismeldung.aktion) {
            map.preisentwicklungen.aktionAusverkauf++;
        } else if (bag.refPreismeldung.aktion) {
            map.preisentwicklungen.aktionsende++;
        }

        erhebungsartenByPmsNummer[bag.preismeldung.pmsNummer].forEach(art => {
            map.erhebungsartDetailPm[art]++;
            map.erhebungsartDetailPm.total++;
        });
    });
    preismeldestellen.forEach(({ pms, erhebungsarten }) => {
        Object.keys(erhebungsarten)
            .filter(art => erhebungsarten[art])
            .forEach(art => {
                map.erhebungsartDetailPms[art]++;
                map.erhebungsartDetailPms.total++;
            });
    });
    return map;
}

export function prepareOrganisationData({
    preiserheber,
    preismeldestellen,
    preiszuweisungen,
    preismeldungen,
    erhebungsmonat,
}: report.OrganisationReportData) {
    const map: OrganisationReport = {
        zeitpunkt: getZeitpunktData(erhebungsmonat),

        erhebungsregionen: { 'N/A': { pm: 0, pms: 0 } },
        preiserheber: { 'N/A': { pm: 0, pms: 0 } },
        preismeldungen: { 'N/A': { pm: 0, peName: null } },
    };
    const preiserheberNamesById = preiserheber.reduce(
        (acc, pe) => ({ ...acc, [pe._id]: `${pe.firstName} ${pe.surname}` }),
        {} as { [peId: string]: string }
    );
    const preismeldestellenNamesById = preismeldestellen.reduce(
        (acc, pms) => ({ ...acc, [pms.pmsNummer]: `${pms.pmsNummer} ${pms.name}` }),
        {} as { [peId: string]: string }
    );
    const regionenByPms = preismeldestellen.reduce(
        (regionenMap, pms) => ({ ...regionenMap, [pms.pmsNummer]: pms.erhebungsregion }),
        {} as { [pmsNummer: string]: string }
    );
    const preisereheberByPms = preismeldestellen
        .filter(pms =>
            preiszuweisungen.some(pz => pz.preismeldestellenNummern.some(pmsNummer => pmsNummer === pms.pmsNummer))
        )
        .reduce(
            (peMap, pms) => ({
                ...peMap,
                [pms.pmsNummer]:
                    preiserheberNamesById[
                        preiszuweisungen.find(pz =>
                            pz.preismeldestellenNummern.some(pmsNummer => pmsNummer === pms.pmsNummer)
                        ).preiserheberId
                    ],
            }),
            {} as { [pmsNummer: string]: string }
        );

    preiszuweisungen.forEach(pz => {
        pz.preismeldestellenNummern.forEach(pmsNummer => {
            if (preismeldestellenNamesById[pmsNummer]) {
                map.preismeldungen[preismeldestellenNamesById[pmsNummer]] = {
                    pm: 0,
                    peName: preiserheberNamesById[pz.preiserheberId],
                };
            }
        });
    });

    preismeldestellen.forEach(pms => {
        if (!map.erhebungsregionen[pms.erhebungsregion || 'N/A']) {
            map.erhebungsregionen[pms.erhebungsregion || 'N/A'] = { pm: 0, pms: 0 };
        }
        map.erhebungsregionen[pms.erhebungsregion || 'N/A'].pms++;
        if (!map.preiserheber[preisereheberByPms[pms.pmsNummer] || 'N/A']) {
            map.preiserheber[preisereheberByPms[pms.pmsNummer] || 'N/A'] = { pm: 0, pms: 0 };
        }
        map.preiserheber[preisereheberByPms[pms.pmsNummer] || 'N/A'].pms++;
    });

    preismeldungen.forEach(pm => {
        const region = regionenByPms[pm.pmsNummer] || 'N/A';
        map.erhebungsregionen[region].pm++;
        map.preiserheber[preisereheberByPms[pm.pmsNummer] || 'N/A'].pm++;
        map.preismeldungen[preismeldestellenNamesById[pm.pmsNummer]].pm++;
    });
    return map;
}

export function preparePmsProblemeData({
    preismeldestellen,
    erhebungsmonat,
}: report.PmsProblemeReportData): PmsProblemeReport {
    return {
        zeitpunkt: getZeitpunktData(erhebungsmonat),
        pmsGeschlossen: preismeldestellen.filter(pms => pms.pmsGeschlossen > 0).map(pms => ({
            name: `${pms.pmsNummer} ${pms.name}`,
            grund: PmsGeschlossen[pms.pmsGeschlossen],
            zusatzinfo: pms.zusatzInformationen,
        })),
    };
}

const mapPmsToOnAndOffline = (
    preismeldestellen: { pms: P.Preismeldestelle; erhebungsarten: P.Erhebungsarten }[]
): { [pmsNummer: string]: 'offline' | 'online' | 'N/A' } => {
    const isErhebungsartOffline = (erhebungsart: P.Erhebungsarten) =>
        !!erhebungsart &&
        (!!erhebungsart.email ||
            !!erhebungsart.papierlisteAbgegeben ||
            !!erhebungsart.papierlisteVorOrt ||
            !!erhebungsart.tablet ||
            !!erhebungsart.telefon);
    return preismeldestellen.reduce(
        (map, pmsBag) => ({
            ...map,
            [pmsBag.pms.pmsNummer]: isErhebungsartOffline(pmsBag.erhebungsarten)
                ? 'offline'
                : pmsBag.erhebungsarten.internet
                    ? 'online'
                    : 'N/A',
        }),
        {}
    );
};

const getZeitpunktData = erhebungsmonat => {
    return {
        erstellungsdatum: moment().format('DD.MM.YYYY HH:mm'),
        erhebungsmonat: erhebungsmonat,
    };
};
