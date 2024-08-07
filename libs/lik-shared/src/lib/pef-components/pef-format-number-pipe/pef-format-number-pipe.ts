import { Pipe, PipeTransform } from '@angular/core';
import format from 'format-number';

@Pipe({ name: 'pefFormatNumber' })
export class PefFormatNumberPipe implements PipeTransform {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    transform(value: string | number, formatOptions: any) {
        const valueAsNumber = typeof value === 'number' ? value : parseFloat(value);
        if (isNaN(valueAsNumber)) return value;
        return format(formatOptions)(valueAsNumber);
    }
}
