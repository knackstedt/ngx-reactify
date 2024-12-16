# ngx-reactify

> This project is currently in a beta phase and features will be added upon pull requests.
I will try to minimize breaking changes between minor version revisions but some may be made until we reach 1.0.0.

This project aims to make using Angular components in React not suck, and vice-versa. This is a dependency of my other library, ngx-xyflow.

### Getting started:

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

### Embed React component in Angular

##### Create component Interface
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

### Embed Angular component in React

> :warn: Under construction.
<!-- 
```ts
import React from 'react';
import { ReactifyReactComponent } from 'ngx-reactify';
import { Component, EventEmitter, Input, Output, ViewEncapsulation } from '@angular/core';
import { ReactDemoComponent } from './react-demo.component';

@Component({
    selector: 'app-demo',
    template: `<div (click)="onNodeClick($event)"></div>`,
    standalone: true
})
export class DemoComponent {
    onNodeClick(evt) {
        console.log(evt)
    }
}

const AngularReactComponent = ReactifyReactComponent(DemoComponent)

export default function App() {

    return (
        <img src="https://picsum.photos/200" className={'picture'}></img>

        <div>
            
        </div>
    )
}
``` -->
