import * as moment from 'moment';

export const MessageTypes = {
    Preismeldungen: '1025',
    Preismeldestellen: '1032',
    Preiserheber: '1033',
};

export const createMesageId = () => `${new Date().getTime()}${Math.ceil(Math.random() * 10)}`;

export function createEnvelope(messageType: string = '1025', messageId?: string) {
    const _messageId = messageId || createMesageId();
    const date = moment().format('YYYY-MM-DDThh:mm:ss');
    return {
        content: `<?xml version="1.0" encoding="UTF-8"?>
<eCH-0090:envelope version="1.0" xmlns:eCH-0090="http://www.ech.ch/xmlns/eCH-0090/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ech.ch/xmlns/eCH-0090/1 http://www.ech.ch/xmlns/eCH-0090/1/eCH-0090-1-0.xsd">
<eCH-0090:messageId>${messageId}</eCH-0090:messageId>
<eCH-0090:messageType>${messageType}</eCH-0090:messageType>
<eCH-0090:messageClass>0</eCH-0090:messageClass>
<eCH-0090:senderId>4-802346-0</eCH-0090:senderId>
<eCH-0090:recipientId>4-213246-6</eCH-0090:recipientId>
<eCH-0090:eventDate>${date}</eCH-0090:eventDate>
<eCH-0090:messageDate>${date}</eCH-0090:messageDate>
</eCH-0090:envelope>`,
        fileSuffix: _messageId,
    };
}
