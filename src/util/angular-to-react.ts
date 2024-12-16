import { Type, ApplicationRef, Injector, NgZone, createComponent, EventEmitter } from '@angular/core';
import { createApplication } from '@angular/platform-browser';
import * as React from 'react';
import { firstValueFrom, Subscription } from 'rxjs';


// declare const Zone;
// const zone = Zone ? new Zone(Zone.current, { name: "@dotglitch_menu", properties: {} }) : null;

/**
 * Wrap an angular component inside of a React memo object.
 * Will attempt to bind @Input and @Output properties if provided,
 * and will bind the react arguments directly as @Input properties.
 *
 * @experimental
 * @param componentClass Angular component
 * @param envInjector    An `EnvironmentInjector` instance to be used for the component
 * @param injector       An `ElementInjector` instance
 * @param _inputs
 * @param _outputs
 * @returns
 */
export const ReactifyReactComponent = ({
    component,
    appRef,
    injector,
    ngZone,
    staticInputs,
    staticOutputs,
    preSiblings,
    postSiblings,
    additionalChildren,
    rootElementName,
    containerElementName
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
});


export const ReactifyAngularComponent2 = (
    component: Type<any>,
    props: any
) => {
    const inputRef = React.useRef(null);
    const ctx = this;

    React.useEffect(() => {
        // Is there a better way to do this?
        let subscriptions: Subscription[];
        let app: ApplicationRef;
        (async () => {
            // Code to run when the component mounts
            app = await createApplication({ providers: [] });
            const base = app.bootstrap(component, inputRef.current);
            const { instance } = base;

            await firstValueFrom(app.isStable);

            // App has now bootstrapped fully.
            subscriptions = [];
            Object.entries(instance).filter(([k, v]) => {
                // @Outputs are always Event Emitters (I think)
                if (v instanceof EventEmitter) {
                    subscriptions.push(
                        instance[k]?.subscribe(evt => props[k].call(ctx, evt))
                    );
                }
                else {
                    instance[k] = props[k];
                }
            })
        })()

        return () => {
            // Code to run when the component unmounts
            subscriptions?.forEach(s => s?.unsubscribe());
            app?.destroy();
        };
    }, []); // Empty dependency array ensures this effect runs only once on mount and cleanup on unmount

    const obj = {};

    return React.createElement("div")
}
