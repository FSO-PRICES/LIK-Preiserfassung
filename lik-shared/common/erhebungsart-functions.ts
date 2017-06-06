import { Erhebungsart } from './models';

export function parseErhebungsartForForm(erhebungsart: string): Erhebungsart {
    const _erhebungsart = erhebungsart || '';
    return {
        erhebungsart_tablet: (_erhebungsart[0] || '0') === '1',
        erhebungsart_telefon: (_erhebungsart[1] || '0') === '1',
        erhebungsart_email: (_erhebungsart[2] || '0') === '1',
        erhebungsart_internet: (_erhebungsart[3] || '0') === '1',
        erhebungsart_papierlisteVorOrt:  (_erhebungsart[4] || '0') === '1',
        erhebungsart_papierlisteAbgegeben:  (_erhebungsart[5] || '0') === '1'
    };
}

export function encodeErhebungsartFromForm(erhebungsart: Erhebungsart): string {
    return (erhebungsart.erhebungsart_tablet ? '1' : '0')
        + (erhebungsart.erhebungsart_telefon ? '1' : '0')
        + (erhebungsart.erhebungsart_email ? '1' : '0')
        + (erhebungsart.erhebungsart_internet ? '1' : '0')
        + (erhebungsart.erhebungsart_papierlisteVorOrt ? '1' : '0')
        + (erhebungsart.erhebungsart_papierlisteAbgegeben ? '1' : '0');
}
