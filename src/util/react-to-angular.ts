import { AfterViewInit, ApplicationRef, Component, ComponentFactoryResolver, EnvironmentInjector, EventEmitter, Injector, NgZone, OnChanges, OnDestroy, SimpleChanges, Type, ViewContainerRef, ViewRef, createComponent } from '@angular/core';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';


/**
 * Extend this component to automatically generate
 * bindings to a React component.
 *
 * ! You _must_ override the property `ngReactComponent`
 * Failure to do so will result in errors
 * `override readonly ngReactComponent = ReactFlowWrappableComponent;`
 */
@Component({
    selector: 'app-react-magic-wrapper',
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
    public theme: string;

    constructor(
        private readonly ngContainer: ViewContainerRef,
        private readonly ngZone: NgZone
    ) {
    }

    ngOnInit() {
        if (!this.ngReactComponent) {
            throw new Error("ReactMagicWrapperComponent cannot start without a provided ngReactComponent!");
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

                this._root.render(React.createElement(this.ngReactComponent, { props: props as any }));
            }
            catch(err) {
                console.error(err)
            }
        })
    }
}
