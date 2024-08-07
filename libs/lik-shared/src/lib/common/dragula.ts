import autoScroll from 'dom-autoscroller';
import dragula, { DragulaOptions } from 'dragula';

const defaultOptions = {
    delayedGrab: false,
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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
    const element =
        scrollContainer.querySelector('div.scrollable-content') ||
        scrollContainer.querySelector('.cdk-virtual-scroll-content-wrapper');
    if (!element) {
        throw new Error('no scrollable-content found');
    }
    const drake = dragula([element], {
        markerSelector: markerSelector,
        delayedGrab,
        ...dragulaOptions,
    } as dragula.DragulaOptions);
    const cleanup = () => {
        setScrolling(true);
        scrollable = true;
        scrollContainer.classList.remove('is-dragging');
    };

    drake.on('grab' as any, () => {
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
    drake.on('drop', (el: Element, _target: Element, _source: Element, sibling: Element | null) => {
        if (!(el instanceof HTMLElement) || !(sibling instanceof HTMLElement)) return;
        const preismeldungPmId = el.dataset['pmid'];
        const dropBeforePmId = sibling.dataset['pmid'];
        if (!preismeldungPmId || !dropBeforePmId) return;
        onDrop({ preismeldungPmId, dropBeforePmId });
    });
    drake.on('cancel', cleanup);
    drake.on('dragend', cleanup);

    const scroll = autoScroll([scrollContainer], {
        margin: 30,
        maxSpeed: 25,
        scrollWhenOutside: true,
        syncMove: true,
        autoScroll: function () {
            return this.down && drake.dragging;
        },
    });

    return [drake, scroll];
}
