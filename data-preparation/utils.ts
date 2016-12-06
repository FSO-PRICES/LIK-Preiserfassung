import * as encoding from 'encoding';
import * as _ from 'lodash';

export function bufferToCells(buffer: Buffer) {
    const s: string = encoding.convert(buffer, 'UTF-8', 'Latin_1').toString();
    const lines = s.split('\u000a');
    return _.drop(lines.filter(x => x.length)).map(x => x.split(';'));
}

