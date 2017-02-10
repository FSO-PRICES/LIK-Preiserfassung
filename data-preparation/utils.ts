import * as encoding from 'encoding';
import * as _ from 'lodash';

export function bufferToCells(buffer: Buffer) {
    const s: string = encoding.convert(buffer, 'UTF-8', 'Latin_1').toString();
    const lines = s.split(/\r?\n/); // s.split('\u000a'); This is incompatible with dos format
    return _.drop(lines.filter(x => x.length)).map(x => x.split(';'));
}

