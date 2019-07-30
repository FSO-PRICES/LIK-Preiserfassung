import autoScroll from 'dom-autoscroller';
import dragula, { DragulaOptions } from 'dragula';

export type DropPreismeldungArg = { preismeldungPmId: string; dropBeforePmId: string };
type PefDragulaOptions = {
    markerSelector: string;
    delayedGrab: boolean;
    dragulaOptions: DragulaOptions;
    onDragstart: () => void;
    onDrop: (args: DropPreismeldungArg) => void;
};
export function initDragula(scrollContainer: HTMLElement, options: PefDragulaOptions) {
    let scrollable = true;
    const setScrolling = (s: boolean) => {
        scrollContainer.style.overflowY = s ? 'auto' : 'hidden';
    };
    const drake = dragula([scrollContainer.querySelector('div.scrollable-content')], {
        markerSelector: options.markerSelector,
        delayedGrab: options.delayedGrab,
        ...options.dragulaOptions,
    } as dragula.DragulaOptions);

    drake.on('grab', () => {
        if (scrollable !== false) {
            setScrolling(false);
            scrollable = false;
            return options.onDragstart();
        }
    });
    drake.on('drop', (el: HTMLElement, _target, _source, sibling: HTMLElement) => {
        const siblingPmId = !!sibling ? sibling.dataset.pmid : null;
        options.onDrop({ preismeldungPmId: el.dataset.pmid, dropBeforePmId: siblingPmId });
    });
    drake.on('dragend', () => {
        setScrolling(true);
        scrollable = true;
        scrollContainer.classList.remove('is-dragging');
    });

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
