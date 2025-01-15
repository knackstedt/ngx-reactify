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
 * @experimental
 * @param componentClass Angular component
 * @param envInjector    An `EnvironmentInjector` instance to be used for the component
 * @param injector       An `ElementInjector` instance
 * @param _inputs
 * @param _outputs
 * @returns
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
        const id = Math.random().toString();
        React.useEffect(() => {
            try {

                const componentInstance = createComponent(component, {
                    environmentInjector: appRef.injector,
                    elementInjector: injector,
                    hostElement: document.getElementById(id)
                });

                appRef.attachView(componentInstance.hostView);
                // @ts-ignore
                // component.hostView = hostView;

                Object.assign(staticInputs, args);

                const { inputs, outputs } = component['ɵcmp'];

                // Returns a list of entries that need to be set
                // This makes it so that unnecessary setters are not invoked.
                const updated = Object.entries(inputs).filter(([parentKey, childKey]: [string, string]) => {
                    return componentInstance.instance[childKey] != staticInputs[parentKey];
                });

                updated.forEach(([parentKey, childKey]: [string, string]) => {
                    if (staticInputs.hasOwnProperty(parentKey))
                        componentInstance.instance[childKey] = staticInputs[parentKey];
                });

                const outputSubscriptions: { [key: string]: Subscription; } = {};
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
            catch (err) {
                console.error(err);
            }
        }, []);

        const elements = [
            ...(preSiblings || []),
            React.createElement(containerElementName || "div", { id }),
            ...(postSiblings || []),
            ...(additionalChildren || [])
        ].filter(e => e);

        return React.createElement(rootElementName || "div", {}, ...elements);
    })
});
// TODO: Remove in major release.
export const ReactifyReactComponent = ReactifyAngularComponent;

/**
 * Do not use this.
 * @hidden
 * @experimental
 */
export function ReactifyAngularComponent3(
    component: Type<any>,
    ngZone: NgZone,
    appRef: Omit<ApplicationRef, '_runningTick'>,
    injector: Injector,
    props: any = {},
    containerTag: string = 'div'
) {
    const ctx = this;
    console.log("ReactifyAngularComponent3")

    return ngZone.runOutsideAngular(() => {
        // Is there a better way to do this?
        let subscriptions: Subscription[];
        let app: ApplicationRef;
        let componentInstance: ComponentRef<any>;

        React.useEffect(() => {
            return () => {
                // Code to run when the component unmounts
                subscriptions?.forEach(s => s?.unsubscribe());
                // app?.destroy();

                appRef.detachView(componentInstance.hostView);
            };
        }, []);

        return React.createElement(containerTag, {
            ref: async (node) => {
                // Not sure if this ever actually happens, added as a preventative measure
                // to memory leaks.
                subscriptions?.forEach(s => s?.unsubscribe());
                app?.destroy();


                // ngZone.run(async () => {
                // Init an Angular application root & bootstrap it to a DOM element.

                componentInstance = createComponent(component, {
                    environmentInjector: appRef.injector,
                    elementInjector: injector,
                    hostElement: node
                });

                appRef.attachView(componentInstance.hostView);
                // app = await createApplication({ providers });
                // const base = app.bootstrap(component, node);
                // const { instance } = base;


                // Wait for the JS to finish rendering and initing.
                // await firstValueFrom(app.isStable);

                // Now that everything has settled, bind inputs and outputs.
                subscriptions = [];
                Object.entries(props).filter(([k, v]) => {
                    // @Outputs are always Event Emitters (I think)
                    if (v instanceof EventEmitter) {
                        subscriptions.push(
                            componentInstance.instance[k]?.subscribe(evt => props[k].call(ctx, evt))
                        );
                    }
                    else {
                        componentInstance.instance[k] = props[k];
                    }
                });
                // })

                // app.tick();
            }
        });
    });
}


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

    return React.createElement(containerTag, { ref: async (node) => {
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
    } });
}
