import * as translations from '@lik-shared/translations';

export function translateKommentare(kommentar: string) {
    const kommentare = kommentar.split('¶');
    const rawKommentare = kommentare.slice(0, -1)[0];
    const translatableKommentare = !rawKommentare ? [] : rawKommentare.split(',');
    return (
        translatableKommentare.map(x => (translations.de[x] ? `AT: ${translations.de[x]}` : x)).join(', ') +
        (translatableKommentare.length > 0 ? '¶' : '') +
        kommentare.slice(-1)
    );
}
