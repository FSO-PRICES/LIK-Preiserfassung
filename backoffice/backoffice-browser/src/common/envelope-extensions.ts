/*
 * LIK-Preiserfassung
 * Copyright (C) 2018 Bundesbehörden der Schweizerischen Eidgenossenschaft - Bundesamt für Statistik
 *
 * This file is part of LIK-Preiserfassung.
 *
 * LIK-Preiserfassung is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * LIK-Preiserfassung is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with LIK-Preiserfassung. If not, see <https://www.gnu.org/licenses/>.
 */

import * as moment from 'moment';

export const MessageTypes = {
    Preismeldungen: '1025',
    Preismeldestellen: '1032',
    Preiserheber: '1033',
};

export const createMesageId = () => `${new Date().getTime()}${Math.ceil(Math.random() * 10)}`;

export function createEnvelope(messageType: string = '1025', messageId: string, senderId: string, recipientId: string) {
    const date = moment().format('YYYY-MM-DDTHH:mm:ss');
    return {
        content: `<?xml version="1.0" encoding="UTF-8"?>
<eCH-0090:envelope version="1.0" xmlns:eCH-0090="http://www.ech.ch/xmlns/eCH-0090/1" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.ech.ch/xmlns/eCH-0090/1 http://www.ech.ch/xmlns/eCH-0090/1/eCH-0090-1-0.xsd">
<eCH-0090:messageId>${messageId}</eCH-0090:messageId>
<eCH-0090:messageType>${messageType}</eCH-0090:messageType>
<eCH-0090:messageClass>0</eCH-0090:messageClass>
<eCH-0090:senderId>${senderId || '4-802346-0'}</eCH-0090:senderId>
<eCH-0090:recipientId>${recipientId || '4-213246-6'}</eCH-0090:recipientId>
<eCH-0090:eventDate>${date}</eCH-0090:eventDate>
<eCH-0090:messageDate>${date}</eCH-0090:messageDate>
</eCH-0090:envelope>`,
        fileSuffix: messageId,
    };
}
