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
    onDrop: (args: DropPreismeldungArg) => void;
    onDragstart?: () => void;
};
export function initDragula(scrollContainer: HTMLElement, options: PefDragulaOptions) {
    const { markerSelector, dragulaOptions, delayedGrab, onDrop, onDragstart } = { ...defaultOptions, ...options };
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
            scrollContainer.classList.add('is-dragging');
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
