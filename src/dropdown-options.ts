import { PanelLayout, Widget } from '@lumino/widgets';

import { OptionWidget } from './option-widget';

import { AddWidget } from './add-widget';

/**
 * A Tool for dropdown options.
 */
export class DropdownOptions extends Widget {
  /**
   * Construct a new widget.
   */
  constructor(parameter: any) {
    super();
    this.parameter = parameter;
    this.layout = new PanelLayout();
    this.createHeaderWidget();
    this.createAllowMultipleWidget();
    this.createAddWidget();
    for (const name of parameter.options) {
      this.addOption(name);
    }
    this.addClass('jp-input-wrapper');
  }

  /**
   * Add a header text to the layout.
   */
  createHeaderWidget(): void {
    const layout = this.layout as PanelLayout;
    const header = new Widget();
    const label = document.createElement('label');
    label.textContent = 'Dropdown options:';
    header.node.append(label);
    layout.insertWidget(0, header);
  }

  /**
   * Add a checkbox to the layout.
   */
  createAllowMultipleWidget(): void {
    const layout = this.layout as PanelLayout;
    const multiple = new Widget();
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = this.parameter.multiple;
    label.appendChild(input);
    label.append('Allow multiple');
    multiple.node.append(label);
    layout.insertWidget(1, multiple);

    input.addEventListener('click', this);
  }

  /**
   * Add an AddWidget input box to the layout.
   */
  createAddWidget(): void {
    const layout = this.layout as PanelLayout;
    const input = new AddWidget();
    input.id = 'add-option';
    layout.insertWidget(layout.widgets.length, input);
  }

  /**
   * Add an option to dropdown.
   *
   * @param name - The name of the option.
   */
  addOption(name: string): void {
    const index = this.parameter.options.indexOf(name);
    if (index === -1) {
      this.parameter.options.push(name);
    }

    const layout = this.layout as PanelLayout;
    const windex = layout.widgets.findIndex(
      (w: Widget) => (w as OptionWidget).name === name
    );
    if (windex === -1) {
      const widget = new OptionWidget(name);
      const idx = layout.widgets.length - 1;
      layout.insertWidget(idx, widget);
    }
  }

  /**
   * Remove an option from the dropdown.
   *
   * @param name - The name of the option.
   */
  removeOption(name: string): void {
    const index = this.parameter.options.indexOf(name);
    if (index !== -1) {
      this.parameter.options.splice(index, 1);
    }

    const layout = this.layout as PanelLayout;
    const windex = layout.widgets.findIndex(
      (w: Widget) => (w as OptionWidget).name === name
    );
    if (windex !== -1) {
      layout.widgets[windex].dispose();
    }
  }

  /**
   * Handle the DOM events for the widget.
   *
   * @param event - The DOM event sent to the widget.
   */
  handleEvent(event: Event): void {
    switch (event.type) {
      case 'click':
        this._evtClick(event as MouseEvent);
        break;
      default:
        break;
    }
  }

  /**
   * Handle the `'focus'` event for the input box.
   */
  private _evtClick(event: MouseEvent): void {
    const target = event.target as HTMLInputElement;
    this.parameter.multiple = target.checked;
  }

  private parameter: any;
}
