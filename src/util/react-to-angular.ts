import { AfterViewInit, Component, NgZone, OnChanges, OnDestroy, SimpleChanges, ViewContainerRef } from '@angular/core';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';


/**
 * This component can be used to automatically wrap a React
 * component into Angular bindings with functional change detection.
 * All you need to provide is the @Input and @Output interface
 * for the component in order to tell Angular which keys correspond to what.
 *
 * ### You _must_ override the property `ngReactComponent`.
 *
 * Failure to do so will result in errors
 *
 * `override readonly ngReactComponent = SomeReactFunction;`
 *
 * Example:
 *
 * ```ts
 *  @Component({
 *      selector: "app-react-wrapped",
 *      standalone: true
 *  })
 *  export class MyReactWrappedComponent extends ReactifyNgComponent {
 *
 *      @Input() data: any;
 *      @Input() options: any;
 *      @Input() version: any;
 *
 *      // Notice how we wrap the result in an array, this is important because
 *      // React can pass multiple properties to a callback and Angular can't.
 *      @Output() onClick = new EventEmitter<[any]>();
 *
 * }
 * ```
 */
@Component({
    selector: 'ngx-reactify',
    template: ``,
    standalone: true
})
export class ReactifyNgComponent implements OnChanges, OnDestroy, AfterViewInit {

    /**
     * The react component to be wrapped.
     * ! Must be overridden for this wrapper to work
     */
    ngReactComponent: React.FunctionComponent<any> | React.ComponentClass<any>;

    private _root: Root;

    private _reactElement: React.ReactElement;

    constructor(
        protected readonly ngContainer: ViewContainerRef,
        protected readonly ngZone: NgZone
    ) {
    }

    ngOnInit() {
        if (!this.ngReactComponent) {
            throw new Error("ReactifyNgComponent cannot be inherited without a provided ngReactComponent!");
        }
    }

    ngOnChanges(changes?: SimpleChanges): void {
        this._render();
    }

    ngAfterViewInit() {
        this._render();
    }

    ngOnDestroy() {
        this._root?.unmount();
    }

    private _render() {
        if (!this.ngReactComponent) {
            console.log("Render no component. May be context issue")
            return
        };

        this.ngZone.runOutsideAngular(() => {
            try {
                this._root ??= createRoot(this.ngContainer.element.nativeElement);

                // List all keys that do not start with `_` nor `ng`
                const keys = Object.keys(this).filter(k => !/^(?:_|ng)/.test(k));

                // Get all property keys from the class
                const propKeys = keys.filter(k => !k.startsWith("on"));
                // Get all event handler keys from the class
                const evtKeys = keys.filter(k => k.startsWith("on"));

                const props = {};
                // Project all key properties onto `props`
                propKeys.forEach(k => props[k] = this[k]);

                // Attempt to ensure no zone is lost during the event emitter fires
                this.ngZone.runGuarded(() => {
                    // Bind all event handlers.
                    // ! important Angular uses EventEmitter, React uses
                    // a different method of event binding
                    evtKeys.forEach(k => props[k] = (...args) => this[k].next(args));
                })

                this._reactElement ??= React.createElement(this.ngReactComponent, { props: props as any });
                this._root.render(this._reactElement);
            }
            catch(err) {
                console.error(err)
            }
        })
    }
}
