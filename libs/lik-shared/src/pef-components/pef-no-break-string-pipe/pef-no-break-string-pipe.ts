import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pef_no_break_string' })
export class PefNoBreakString implements PipeTransform {
    transform(value: string, _formatOptions: any) {
        if (!value) return value;
        return value.replace(' ', '\u00a0');
    }
}
