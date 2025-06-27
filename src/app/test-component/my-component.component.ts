import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ReactifyNgComponent, ReactifyPropsTypeToAngular } from '../../public-api';
import MyComponent, { MyComponentProps } from './my-component';

@Component({
    selector: 'rgx-my-component',
    template: '',
    standalone: true
})
export class WrappedComponent extends ReactifyNgComponent implements ReactifyPropsTypeToAngular<MyComponentProps> {

    @Input() value: number;
    @Output() fireMessage = new EventEmitter<any>();
    @Output() valueChange = new EventEmitter<number>();

    override ngReactComponent = MyComponent;
}
