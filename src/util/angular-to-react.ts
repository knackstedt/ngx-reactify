import { Type, ApplicationRef, Injector, NgZone, createComponent, EventEmitter, Provider, EnvironmentProviders, ComponentRef } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import * as React from 'react';
import { firstValueFrom, Subscription } from 'rxjs';


/**
 * Wrap an Angular component inside of a React memo object.
 * Will attempt to bind @Input and @Output properties if provided,
 * and will bind the react arguments directly as @Input properties.
 *
 * Usage: An Angular top-level application with a ReactifyNgComponent react implementation
 * that needs to embed Angular components as children of the react-wrapped component.
 *
 * This is replaced by `WrapAngularComponentInReact`.
 * @deprecated
 */
export const ReactifyAngularComponent = ({
    component,
    appRef,
    injector,
    ngZone,
    staticInputs = {},
    staticOutputs = {},
    preSiblings = [],
    postSiblings = [],
    additionalChildren = [],
    rootElementName = '',
    containerElementName = ''
}: {
    component: Type<any>,
    appRef: Omit<ApplicationRef, '_runningTick'>,
    injector: Injector,
    ngZone: NgZone,
    staticInputs?: { [key: string]: any; },
    staticOutputs?: { [key: string]: Function; },
    preSiblings?: React.ReactNode[],
    postSiblings?: React.ReactNode[],
    additionalChildren?: React.ReactNode[],
    rootElementName?: Parameters<typeof React.createElement>[0],
    containerElementName?: string;
}) => React.memo((args) => {

    return ngZone.runOutsideAngular(() => {
        let outputSubscriptions: { [key: string]: Subscription; };
        let componentInstance: ComponentRef<any>;

        const tripChangeDetection = () =>
            componentInstance?.changeDetectorRef?.detectChanges();

        // These attributes will trigger change detection when they fire from
        // the underlying React element.
        // ... This will break things. FUCK.
        const attributes: Array<keyof React.DOMAttributes<any>> = ['onCopy', 'onCut', 'onPaste', 'onAbort', 'onBlur', 'onFocus', 'onCanPlay', 'onCanPlayThrough', 'onChange', 'onClick', 'onContextMenu', 'onDoubleClick', 'onDrag', 'onDragEnd', 'onDragEnter', 'onDragLeave', 'onDragOver', 'onDragStart', 'onDrop', 'onDurationChange', 'onEmptied', 'onEnded', 'onInput', 'onInvalid', 'onKeyDown', 'onKeyPress', 'onKeyUp', 'onLoad', 'onLoadedData', 'onLoadedMetadata', 'onLoadStart', 'onMouseDown', 'onMouseEnter', 'onMouseLeave', 'onMouseMove', 'onMouseOut', 'onMouseOver', 'onMouseUp', 'onPause', 'onPlay', 'onPlaying', 'onProgress', 'onRateChange', 'onReset', 'onScroll', 'onSeeked', 'onSeeking', 'onSelect', 'onStalled', 'onSubmit', 'onSuspend', 'onTimeUpdate', 'onVolumeChange', 'onWaiting', 'onError'];

        const attrObj = {};
        attributes.forEach(a => attrObj[a] = tripChangeDetection);

        React.useEffect(() => {
            return () => {
                // Code to run when the component unmounts
                appRef?.detachView(componentInstance.hostView);
                Object.values(outputSubscriptions).forEach(s => s.unsubscribe());
                componentInstance?.destroy();
            };
        }, []);


        const elements = [
            ...(preSiblings || []),
            React.createElement(containerElementName || "div", {
                ...attrObj,
                ref: node => {
                    const { inputs, outputs } = component['ɵcmp'];

                    if (componentInstance) return;

                    ngZone.run(() => {
                        componentInstance = createComponent(component, {
                            environmentInjector: appRef.injector,
                            elementInjector: injector,
                            hostElement: node
                        });

                        Object.assign(staticInputs, args);
                        appRef.attachView(componentInstance.hostView);
                    });

                    // Returns a list of entries that need to be set
                    // This makes it so that unnecessary setters are not invoked.
                    const updated = Object.entries(inputs).filter(([parentKey, childKey]: [string, string]) => {
                        return componentInstance.instance[childKey] != staticInputs[parentKey];
                    });

                    updated.forEach(([parentKey, childKey]: [string, string]) => {
                        if (staticInputs.hasOwnProperty(parentKey))
                            componentInstance.instance[childKey] = staticInputs[parentKey];
                    });

                    outputSubscriptions = {};
                    // Get a list of unregistered outputs
                    const newOutputs = Object.entries(outputs).filter(([parentKey, childKey]: [string, string]) => {
                        return !outputSubscriptions[parentKey];
                    });

                    // Reverse bind via subscription
                    newOutputs.forEach(([parentKey, childKey]: [string, string]) => {
                        if (!staticOutputs.hasOwnProperty(parentKey)) return;

                        const target: EventEmitter<unknown> = componentInstance.instance[childKey];
                        const outputs = staticOutputs;

                        const sub = target.subscribe((...args) => {
                            // Run the callback in the provided zone
                            ngZone.run(() => {
                                outputs[parentKey](...args);
                            });
                        }); // Subscription

                        outputSubscriptions[parentKey] = sub;
                    });

                    // Wrap the destroy method to safely release the subscriptions
                    const originalDestroy = componentInstance.onDestroy?.bind(componentInstance);
                    componentInstance.onDestroy = (cb) => {
                        Object.values(outputSubscriptions).forEach(s => s.unsubscribe());
                        originalDestroy?.(cb);
                    };

                    componentInstance.changeDetectorRef.detectChanges();
                }
            }),
            ...(postSiblings || []),
            ...(additionalChildren || [])
        ].filter(e => e);

        return React.createElement(rootElementName || "div", {}, ...elements);
    });
});


/**
 * Do not use this.
 * @hidden
 * @experimental
 */
export const ng2ReactProps = (obj = {}) => {
    const props = {};
    Object.entries(obj).forEach(([k, v]) => {
        // Omit things prefixed with an underscore
        if (k.startsWith('_')) return;

        // Omit output event emitters
        if (v instanceof EventEmitter) {
            props[k] = (...args) => v.emit([args]);
        }
        else {
            props[k] = v;
        }
    });
    return props;
};

/**
 * This method will create a React component that
 * wraps an Angular component.
 * @returns React.NamedExoticComponent
 *
 * @hidden
 * @experimental
 */
export function WrapAngularComponentInReact({
    component,
    ngZone,
    appRef,
    injector,
    props,
    containerTag,
    reactTemplate,
    projectableNodes
}: {
    /**
     * Angular Component to be rendered within React
     */
    component: Type<any>,
    /**
     * Angular Application Reference. Used for bootstrapping
     * and change detection hierarchy.
     */
    appRef: Omit<ApplicationRef, '_runningTick'>,
    /**
     * Instance of NgZone class.
     * Very important to prevent Zone.js event performance issues.
     * Do not set if running Zoneless CD.
     */
    ngZone?: NgZone,
    /**
     * Static properties to be passed into the Angular instance.
     * Automatically generates event proxies for Angular EventEmitters.
     */
    props?: Record<string, any>,
    /**
     * Local Element Injector provided to the Angular object
     */
    injector?: Injector,
    /**
     * HTML Tag for the created DOM wrapper. Defaults to `div`.
     */
    containerTag?: string,
    /**
     * React Function template
     */
    reactTemplate?: (el: React.ReactElement) => React.ReactElement;
    /**
     * Nodes to be passed to the `ng-content` of the child Angular component.
     */
    projectableNodes?: Node[][];
}) {
    props ??= {};
    containerTag ??= 'div';
    const ctx = this;

    const createWrappedElement = () => {
        reactTemplate ??= (el) => el;
        return React.memo((args) => {
            const _props = {};
            Object.assign(_props, props);
            Object.assign(_props, args);

            // Is there a better way to do this?
            let subscriptions: Subscription[];
            let componentInstance: ComponentRef<any>;

            React.useEffect(() => {
                return () => {
                    // Cleanup and dispose leftover Angular objects
                    appRef?.detachView(componentInstance.hostView);
                    subscriptions?.forEach(s => s?.unsubscribe());
                    componentInstance?.destroy();
                };
            }, []);

            const tripChangeDetection = () =>
                componentInstance?.changeDetectorRef?.detectChanges();

            // These attributes will trigger change detection when they fire from
            // the underlying React element.
            // ... This will break things. FUCK.
            const attributes: Array<keyof React.DOMAttributes<any>> = ['onCopy', 'onCut', 'onPaste', 'onAbort', 'onBlur', 'onFocus', 'onCanPlay', 'onCanPlayThrough', 'onChange', 'onClick', 'onContextMenu', 'onDoubleClick', 'onDrag', 'onDragEnd', 'onDragEnter', 'onDragLeave', 'onDragOver', 'onDragStart', 'onDrop', 'onDurationChange', 'onEmptied', 'onEnded', 'onInput', 'onInvalid', 'onKeyDown', 'onKeyPress', 'onKeyUp', 'onLoad', 'onLoadedData', 'onLoadedMetadata', 'onLoadStart', 'onMouseDown', 'onMouseEnter', 'onMouseLeave', 'onMouseMove', 'onMouseOut', 'onMouseOver', 'onMouseUp', 'onPause', 'onPlay', 'onPlaying', 'onProgress', 'onRateChange', 'onReset', 'onScroll', 'onSeeked', 'onSeeking', 'onSelect', 'onStalled', 'onSubmit', 'onSuspend', 'onTimeUpdate', 'onVolumeChange', 'onWaiting', 'onError'];

            const attrObj = {};
            attributes.forEach(a => attrObj[a] = tripChangeDetection);

            return reactTemplate(React.createElement(containerTag, {
                ...attrObj,
                ref: async (node) => {
                    if (componentInstance) return;

                    // Not sure if this ever actually happens, added as a preventative measure
                    // to memory leaks.
                    subscriptions?.forEach(s => s?.unsubscribe());

                    const bootstrap = () => {
                        // Init the Angular component with the context of the root Angular app.
                        componentInstance = createComponent(component, {
                            environmentInjector: appRef.injector,
                            elementInjector: injector,
                            hostElement: node,
                            projectableNodes: projectableNodes
                        });
                        appRef.attachView(componentInstance.hostView);
                    };

                    ngZone?.runTask
                        ? ngZone?.runTask(bootstrap)
                        : bootstrap();

                    // Now that everything has settled, bind inputs and outputs.
                    subscriptions = [];
                    Object.entries(_props).filter(([k, v]) => {
                        // @Outputs are always Event Emitters (I think)
                        if (v instanceof EventEmitter) {
                            subscriptions.push(
                                componentInstance.instance[k]?.subscribe(evt => _props[k].call(ctx, evt))
                            );
                        }
                        else {
                            componentInstance.instance[k] = _props[k];
                        }
                    });

                    componentInstance.changeDetectorRef.detectChanges();
                }
            }));
        });
    }

    return ngZone?.runOutsideAngular
        ? ngZone?.runOutsideAngular(createWrappedElement)
        : createWrappedElement();
}

/**
 * This method will automatically wrap an Angular
 * Component or Directive into a React object.
 * @Outputs (EventEmitters) will be automatically
 * linked into the input properties along with
 * all of the @Inputs.
 * @returns React.NamedExoticComponent
 * @experimental
 */
export const AutoWrapAngularObject = ({
    component,
    appRef,
    ngZone,
    instance,
    injector,
    containerTag,
    reactTemplate,
}: (Parameters<typeof WrapAngularComponentInReact>[0] & {
    /**
     * Angular Component/Directive instance that will have properties bound to the created
     */
    instance?: InstanceType<Type<any>> | Record<string, any>,

})) => {
    const props = ng2ReactProps(instance);

    return WrapAngularComponentInReact({
        component,
        ngZone,
        appRef,
        injector,
        containerTag,
        props,
        reactTemplate
    });
};

/**
 * Bootstrap an Angular component with `createApplication` and export it under a
 * react Element.
 * Usage: React top-level application embedding an Angular component.
 */
export function ReactifyStandaloneAngularComponent(
    component: Type<any>,
    props: any = {},
    providers: (Provider | EnvironmentProviders)[] = [],
    containerTag: string = 'div'
) {
    const ctx = this;

    // Is there a better way to do this?
    let subscriptions: Subscription[];
    let app: ApplicationRef;

    React.useEffect(() => {
        return () => {
            // Code to run when the component unmounts
            subscriptions?.forEach(s => s?.unsubscribe());
            app?.destroy();
        };
    }, []);

    return React.createElement(containerTag, {
        ref: async (node) => {
            // Not sure if this ever actually happens, added as a preventative measure
            // to memory leaks.
            subscriptions?.forEach(s => s?.unsubscribe());
            app?.destroy();

            // Init an Angular application root & bootstrap it to a DOM element.
            app = await createApplication({ providers });
            const base = app.bootstrap(component, node);
            const { instance } = base;


            // Wait for the JS to finish rendering and initing.
            await firstValueFrom(app.isStable);

            // Now that everything has settled, bind inputs and outputs.
            subscriptions = [];
            Object.entries(props).filter(([k, v]) => {
                // @Outputs are always Event Emitters (I think)
                if (v instanceof EventEmitter) {
                    subscriptions.push(
                        instance[k]?.subscribe(evt => props[k].call(ctx, evt))
                    );
                }
                else {
                    instance[k] = props[k];
                }
            });

            base.changeDetectorRef.detectChanges();
        }
    });
}



// These exports exist to attempt to make the API have minimal breaking changes.
export const ReactifyReactComponent = ReactifyAngularComponent;
export const ReactifyAngularComponent3 = WrapAngularComponentInReact;;
