import { Pipe, PipeTransform } from '@angular/core';
import * as format from 'format-number';

@Pipe({ name: 'pefFormatNumber' })
export class PefFormatNumberPipe implements PipeTransform {
    transform(value: string, formatOptions: any) {
        const valueAsNumber = parseFloat(value);
        if (isNaN(valueAsNumber)) return value;
        return format(formatOptions)(valueAsNumber);
    }
}
