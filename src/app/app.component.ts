import { Component } from '@angular/core';
import { WrappedComponent } from './test-component/my-component.component';


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [
        WrappedComponent
    ]
})
export class AppComponent {

    numberOfClicks = 0;

    constructor(
    ) {

    }

    test(data) {
        console.log(data)
    }

    onMessageFired() {
        alert("A button has been clicked on the React child.")
    }

}
