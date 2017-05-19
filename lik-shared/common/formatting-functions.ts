import * as format from 'format-number';

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


export const preisNumberFormattingOptions = { padLeft: 1, padRight: 2, truncate: 4, integerSeparator: '' };
export const mengeNumberFormattingOptions = { padLeft: 1, padRight: 0, truncate: 3, integerSeparator: '' };

export const preisFormatFn = format(this.priceNumberFormattingOptions);
export const mengeFormatFn = format(this.mengeNumberFormattingOptions);
