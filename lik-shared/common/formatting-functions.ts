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
