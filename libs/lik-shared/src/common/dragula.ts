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

import autoScroll from 'dom-autoscroller';
import dragula, { DragulaOptions } from 'dragula';

const defaultOptions = {
    delayedGrab: false,
    onDragstart: () => {},
};
export type DropPreismeldungArg = { preismeldungPmId: string; dropBeforePmId: string };
type PefDragulaOptions = {
    markerSelector: string;
    dragulaOptions: DragulaOptions;
    delayedGrab?: boolean;
    onGrab?: () => void;
    onDragstart?: () => void;
    onDrop: (args: DropPreismeldungArg) => void;
};
export function initDragula(scrollContainer: HTMLElement, options: PefDragulaOptions) {
    const { markerSelector, dragulaOptions, delayedGrab, onGrab, onDragstart, onDrop } = {
        ...defaultOptions,
        ...options,
    };
    let scrollable = true;
    const setScrolling = (s: boolean) => {
        scrollContainer.style.overflowY = s ? 'auto' : 'hidden';
    };
    const drake = dragula([scrollContainer.querySelector('div.scrollable-content')], {
        markerSelector: markerSelector,
        delayedGrab,
        ...dragulaOptions,
    } as dragula.DragulaOptions);
    const cleanup = () => {
        setScrolling(true);
        scrollable = true;
        scrollContainer.classList.remove('is-dragging');
    };

    drake.on('grab', () => {
        if (scrollable !== false) {
            setScrolling(false);
            scrollable = false;
            if (onGrab) {
                return onGrab();
            }
        }
    });
    drake.on('drag', () => {
        scrollContainer.classList.add('is-dragging');
        if (onDragstart) {
            return onDragstart();
        }
    });
    drake.on('drop', (el: HTMLElement, _target, _source, sibling: HTMLElement) => {
        const siblingPmId = !!sibling ? sibling.dataset.pmid : null;
        onDrop({ preismeldungPmId: el.dataset.pmid, dropBeforePmId: siblingPmId });
    });
    drake.on('release', (e: MouseEvent) => {
        if (!!e.type && e.type === 'mouseup') {
            cleanup();
        }
    });
    drake.on('cancel', cleanup);
    drake.on('dragend', cleanup);

    const scroll = autoScroll([scrollContainer], {
        margin: 30,
        maxSpeed: 25,
        scrollWhenOutside: true,
        syncMove: true,
        autoScroll: function() {
            return this.down && drake.dragging;
        },
    });

    return [drake, scroll];
}
