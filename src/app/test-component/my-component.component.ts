import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactifyNgComponent } from '../../public-api';
import MyComponent, { MyComponentProps } from './my-component';

@Component({
    selector: 'rgx-my-component',
    template: '',
    standalone: true
})
export class WrappedComponent extends ReactifyNgComponent {

    @Input() value: number;
    @Output() valueChange = new EventEmitter<number>();
    @Output() fireMessage = new EventEmitter();

    override ngReactComponent = MyComponent;
}
