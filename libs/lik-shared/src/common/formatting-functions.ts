import * as format from 'format-number';
import { format as formatDate_ } from 'date-fns';

import * as deLocale from 'date-fns/locale/de';
import * as enLocale from 'date-fns/locale/en';
import * as frLocale from 'date-fns/locale/fr';
import * as itLocale from 'date-fns/locale/it';

export function formatPercentageChange(percentageChange: number, numDecimalPlaces: number) {
    if (percentageChange == null || isNaN(percentageChange)) return '&mdash;';
    const percentageFormattingOptions = { padRight: numDecimalPlaces, truncate: numDecimalPlaces, integerSeparator: '', suffix: '%' };
    const roundedPercentageChange = roundToDecimalPlaces(percentageChange, numDecimalPlaces);
    const prefix = roundedPercentageChange > 0 ? '+' : '';
    return `${prefix}${format(percentageFormattingOptions)(roundedPercentageChange)}`;
}

export function roundToDecimalPlaces(n: number, numDecimalPlaces: number) {
    const factor = numDecimalPlaces === 0 ? 1 : numDecimalPlaces * 10;
    return Math.round(n * factor) / factor;
}


const _preisNumberFormattingOptions = { padLeft: 1, padRight: 2, truncate: 4, integerSeparator: '' };
const _mengeNumberFormattingOptions = { padLeft: 1, padRight: 0, truncate: 3, integerSeparator: '' };

export const preisNumberFormattingOptions = _preisNumberFormattingOptions;
export const mengeNumberFormattingOptions = _mengeNumberFormattingOptions;

export const preisFormatFn = format(_preisNumberFormattingOptions);
export const mengeFormatFn = format(_mengeNumberFormattingOptions);

export function formatDate(value: any, formatOptions: any, currentLanguage: string) {
    if (!value) return undefined;

    return formatDate_(value, formatOptions, { locale: getLocale(currentLanguage) });
}

function getLocale(currentLanguage) {
    switch (currentLanguage) {
        case 'de':
            return deLocale;

        case 'en':
            return enLocale;

        case 'fr':
            return frLocale;

        case 'it':
            return itLocale;

        default:
            return deLocale;
    }
}