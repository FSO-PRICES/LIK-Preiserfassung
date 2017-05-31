import { Directive, TemplateRef, ViewContainerRef } from '@angular/core';
import { VirtualContext } from './virtual-util';


/**
 * @private
 */
@Directive({ selector: '[pefVirtualHeader]' })
export class PefVirtualHeader {
    constructor(public templateRef: TemplateRef<VirtualContext>) { }
}


/**
 * @private
 */
@Directive({ selector: '[pefVirtualFooter]' })
export class PefVirtualFooter {
    constructor(public templateRef: TemplateRef<VirtualContext>) { }
}


/**
 * @private
 */
@Directive({ selector: '[pefVirtualItem]' })
export class PefVirtualItem {
    constructor(public templateRef: TemplateRef<VirtualContext>, public viewContainer: ViewContainerRef) { }
}
