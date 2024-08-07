import { de, enGB, frCH, it } from 'date-fns/locale';

export function getLocale(currentLanguage): Locale {
    switch (currentLanguage) {
        case 'de':
            return de as any;

        case 'en':
            return enGB as any;

        case 'fr':
            return frCH as any;

        case 'it':
            return it as any;

        default:
            return de as any;
    }
}
