import { Erhebungsarten } from './models';

export function parseErhebungsarten(erhebungsart: string): Erhebungsarten {
    const _erhebungsart = erhebungsart || '';
    return {
        tablet: (_erhebungsart[0] || '0') === '1',
        telefon: (_erhebungsart[1] || '0') === '1',
        email: (_erhebungsart[2] || '0') === '1',
        internet: (_erhebungsart[3] || '0') === '1',
        papierlisteVorOrt: (_erhebungsart[4] || '0') === '1',
        papierlisteAbgegeben: (_erhebungsart[5] || '0') === '1',
    };
}

export function encodeErhebungsartFromForm(erhebungsart: Erhebungsarten): string {
    return (
        (erhebungsart.tablet ? '1' : '0') +
        (erhebungsart.telefon ? '1' : '0') +
        (erhebungsart.email ? '1' : '0') +
        (erhebungsart.internet ? '1' : '0') +
        (erhebungsart.papierlisteVorOrt ? '1' : '0') +
        (erhebungsart.papierlisteAbgegeben ? '1' : '0')
    );
}
