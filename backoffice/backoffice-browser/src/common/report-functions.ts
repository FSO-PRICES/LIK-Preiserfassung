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
            internetZentral: 0,
            normalerhebung: 0,
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

    const pmsOnOffline = mapPmsToZentralDezentral(preismeldestellen);
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
        if (!bag.exported) {
            return;
        }
        map.preismeldungen.erfasst++;
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
    alreadyExported,
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

    console.log('alreadyExported', alreadyExported);
    preismeldungen.forEach(pm => {
        if (alreadyExported.find(pmId => pmId === pm._id) == null) {
            return;
        }
        map.erhebungsregionen[regionenByPms[pm.pmsNummer] || 'N/A'].pm++;
        map.preiserheber[preisereheberByPms[pm.pmsNummer] || 'N/A'].pm++;
        map.preismeldungen[preismeldestellenNamesById[pm.pmsNummer] || 'N/A'].pm++;
    });
    return map;
}

export function preparePmsProblemeData({
    preismeldestellen,
    erhebungsmonat,
}: report.PmsProblemeReportData): PmsProblemeReport {
    return {
        zeitpunkt: getZeitpunktData(erhebungsmonat),
        pmsGeschlossen: preismeldestellen
            .filter(pms => pms.pmsGeschlossen > 0)
            .map(pms => ({
                name: `${pms.pmsNummer} ${pms.name}`,
                grund: PmsGeschlossen[pms.pmsGeschlossen],
                zusatzinfo: pms.zusatzInformationen,
            }))
            .sort((a, b) => sortNumericBeginningText(a.name, b.name)),
    };
}

const mapPmsToZentralDezentral = (
    preismeldestellen: { pms: P.Preismeldestelle; erhebungsarten: P.Erhebungsarten }[]
): { [pmsNummer: string]: 'internetZentral' | 'normalerhebung' | 'N/A' } => {
    return preismeldestellen.reduce(
        (map, pmsBag) => ({
            ...map,
            [pmsBag.pms.pmsNummer]:
                pmsBag.pms.erhebungsregion === 'Internet-Schweiz' ? 'internetZentral' : 'normalerhebung',
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

const getNumber = /^([0-9]+) /;
export function sortNumericBeginningText(a: string, b: string): number {
    return +((a.match(getNumber) || [])[1] || 0) - +((b.match(getNumber) || [])[1] || 0);
}
