import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
    selector: 'ngx-child',
    standalone: true,
    template: `
    <div class="angular">
      <h1>Hello from Angular, {{name}}!</h1>
      <p>Angular Clicks: {{ clicks }}</p>
      <button (click)="increment()">Click me!</button>
    </div>
  `,
    styles: [`
    .angular {
        border: 2px solid #fcc3f6;
        border-radius: 9px;
        padding: 24px;
    }
    h1 {
      color: #333;
    }
    button {
      padding: 10px 15px;
      background: linear-gradient(to right top, #ff69b4, #8a2be2);
      border: 0;
      border-radius: 6px;
      font-weight: 600;
      color: #fff;
      transition: transform 200ms ease
    }
    button:hover {
      transform: scale(1.05)
    }
    button:active {
        transform: scale(1.10)
    }
  `]
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

