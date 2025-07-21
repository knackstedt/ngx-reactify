# ngx-reactify

> This project is currently in a beta phase and features will be added upon pull requests.
I will try to minimize breaking changes between minor version revisions but some may be made until we reach 1.0.0.

This project aims to make using Angular components in React not suck, and vice-versa. This is a dependency of my other library, ngx-xyflow.

## Getting started (React in Angular):

##### Install React

```bash
    npm i react react-dom
```

```bash
    npm i -D @types/react
```

##### Install ngx-reactify

```bash
    npm i ngx-reactify
```

### Embed a React component in Angular

##### Create the wrapper component
Next, you.
> This step is necessary as it creates Angular bindings that can be used.
> Important: You can't use the normal stylesheet imports from React. Put your styles in the component.scss file.

```ts
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import * as React from 'react';

import { ReactDemoWrappableComponent } from './react-demo'; // tsx file
import { ReactifyNgComponent } from 'ngx-reactify';

@Component({
    selector: 'app-react-demo',
    template: ``,
    styleUrls: ['./react-demo.component.scss'],
    standalone: true,
    encapsulation: ViewEncapsulation.None
})
export class ReactDemoComponent extends ReactifyNgComponent {
    override readonly ngReactComponent = ReactDemoWrappableComponent;

    @Output() onNodeClick       = new EventEmitter<[MouseEvent, Node]>();
    @Output() onNodeDoubleClick = new EventEmitter<[MouseEvent, Node]>();

    @Input() nodeTypes?: NodeTypes | undefined;
    @Input() edgeTypes?: EdgeTypes | undefined;
}
```

##### Using the component

Last, import and use `ReactDemoComponent` elsewhere in your application.

```ts

import { Component } from '@angular/core';
import { ReactDemoComponent } from './react-demo.component';

@Component({
    selector: 'app-demo',
    template: `
<app-react-demo
    [nodeTypes]="[1,2,3,4]"
    (onNodeClick)="onNodeClick($event)"
/>
`,
    imports: [ ReactDemoComponent ],
    standalone: true
})
export class DemoComponent {

    onNodeClick(evt) {
        console.log(evt)
    }
}
```

## Getting started (Angular in React):

### Install ngx-reactify

```bash
    npm i ngx-reactify
```

### Install Angular in your project
You need at minimum the following dependencies:

It has been tested on v19, other versions **should** work if they support standalone components.

```bash
    npm i @analogjs/vite-plugin-angular @angular/common@19 @angular/core@19 @angular/platform-browser@19 @angular/compiler@19
```

### Setup 

##### Zone.js

The init method currently requires zone.js, so you need to import that in the browser.
I recommend placing the isomorphic import in your entrypoint ts/tsx file like so:

```ts
import "zone.js";
```

##### tsconfig

You **must** add a tsconfig.app.json file. The sample below has been tested and works.
`tsconfig.app.json`
```json
{
    "extends": "./tsconfig.json",
    "compileOnSave": false,
    "compilerOptions": {
        "baseUrl": "./",
        "outDir": "./dist/out-tsc",
        "forceConsistentCasingInFileNames": true,
        "strict": true,
        "noImplicitOverride": true,
        "noPropertyAccessFromIndexSignature": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "sourceMap": true,
        "declaration": false,
        "downlevelIteration": true,
        "experimentalDecorators": true,
        "moduleResolution": "node",
        "importHelpers": true,
        "noEmit": false,
        "target": "es2020",
        "module": "es2020",
        "lib": [
            "es2020",
            "dom"
        ],
        "skipLibCheck": true
    },
    "angularCompilerOptions": {
        "enableI18nLegacyMessageIdFormat": false,
        "strictInjectionParameters": true,
        "strictInputAccessModifiers": true,
        "strictTemplates": true
    },
    "files": [],
    "include": [
        "src/**/*.ts"
    ]
}

```

##### vite.config.js

You need to import the angular plugin from @analogjs/vite-plugin-angular.

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
    plugins: [
        // Angular plugin **MUST** be imported before the react plugin.
        angular(),
        react()
    ]
});
```

### Using an Angular component in your React app

There are two ways in which you can transform an Angular component into a React entity.

Option one is to perform a one-time wrapping of the Angular component. This allows you to
use it like a normal react component, and you can even import the transformed component 
throughout your project like normal react components.
Option two is to perform an ad-hoc transformation. This is more useful where you need to 
pass providers into the Angular ecosystem.


#### One time auto-wrap of an Angular component to a React component

Angular Component:

```ts
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ngx-child',
    standalone: true,
    template: `
    <div class="angular">
      <h1>Hello from Angular, {{name}}!</h1>
      <p>Clicks: {{ clicks }}</p>
      <button (click)="increment()">Click me!</button>
    </div>
  `,
    styles: [``]
})
export class AngularComponent {

    @Input() clicks = 0;
    @Output() clickChange = new EventEmitter<number>();

    @Input() name;

    increment() {
        this.clicks++;
        this.clickChange.emit(this.clicks);
    }
}
```

React component
```tsx
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import './main.css';
import { ReactifyStandaloneAngularComponent } from 'ngx-reactify';
import { AngularComponent } from './angular.component';

import "zone.js";

const AngularReactComponent = ReactifyStandaloneAngularComponent(AngularComponent, [], 'ngx-react-wrapped', true)

// Main App component
const App = () => {
    const [angularClicks, setAngularClicks] = useState(10);

    return <div>
        <AngularReactComponent
            // This causes React to re-render the Angular
            // component every time angularClicks changes
            // it also enables pre-seeding 2-way bindings
            // This is sub-optimal for Angular flows but
            // follows the intended React practice
            clicks={angularClicks}
            clickChange={setAngularClicks}

            name="Alex"
        />
    </div>;
}

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
```



#### ad-hoc transformation (WIP)
