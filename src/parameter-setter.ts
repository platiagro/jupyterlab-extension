import { Widget } from '@lumino/widgets';

import {
  showDialog,
  Dialog,
  ToolbarButton
} from '@jupyterlab/apputils';

import { Notebook } from '@jupyterlab/notebook';

import { LabIcon } from '@jupyterlab/ui-components';

import addParameterSvgstr from '../style/icons/add-parameter.svg';

/**
 * A widget which provides a toolbarbutton.
 */
export class ParameterSetter extends ToolbarButton {
  constructor(notebook: Notebook) {
    super({
      icon: addParameterIcon,
      onClick: async () => {

        // declare an object that will keep the inputted data
        const parameter: any = {
          name: '',
          value: '',
          type: '',
          label: '',
          description: ''
        };

        // Open a dialog that hosts a form to set a parameter
        const result = await showDialog({
          title: 'Add or edit a parameter',
          body: new DialogBody(parameter),
          buttons: [Dialog.cancelButton(), Dialog.okButton()]
        });

        if (result.button.accept) {
          setParameter(notebook, parameter);
        }
      },
      tooltip: 'Add or edit a parameter'
    });

    this.addClass('jp-id-upload');
  }
}

/**
 * A widget which hosts a form to set a parameter.
 */
class DialogBody extends Widget {
  private _parameter: any;
  private nameInput: HTMLInputElement;
  private valueInput: HTMLInputElement;
  private typeSelect: HTMLSelectElement;
  private labelInput: HTMLInputElement;
  private descriptionTextArea: HTMLTextAreaElement;

  constructor(parameter: any) {
    super();
    this._parameter = parameter;
    this.buildForm();
  }

  buildForm() {
    const body = document.createElement('div');

    // Name Input
    const nameTitle = document.createElement('label');
    nameTitle.textContent = 'Variable Name:';
    this.nameInput = document.createElement('input');
    this.nameInput.name = 'name';
    body.appendChild(nameTitle);
    body.appendChild(document.createElement('br'));
    body.appendChild(this.nameInput);
    body.appendChild(document.createElement('br'));

    // Value Input
    const valueTitle = document.createElement('label');
    valueTitle.textContent = 'Default Value:';
    this.valueInput = document.createElement('input');
    this.valueInput.name = 'value';
    body.appendChild(valueTitle);
    body.appendChild(document.createElement('br'));
    body.appendChild(this.valueInput);
    body.appendChild(document.createElement('br'));

    // Type Select
    const typeTitle = document.createElement('label');
    typeTitle.textContent = 'Variable Type:';
    this.typeSelect = document.createElement('select');
    const options = ['', 'string', 'integer', 'number', 'boolean', 'feature'];
    options.forEach(item => {
      const option = document.createElement('option');
      option.value = item;
      option.textContent = item;
      this.typeSelect.appendChild(option);
    });
    body.appendChild(typeTitle);
    body.appendChild(document.createElement('br'));
    body.appendChild(this.typeSelect);

    // Label Input
    const labelTitle = document.createElement('label');
    labelTitle.textContent = 'Label:';
    this.labelInput = document.createElement('input');
    this.labelInput.name = 'label';
    body.appendChild(labelTitle);
    body.appendChild(document.createElement('br'));
    body.appendChild(this.labelInput);
    body.appendChild(document.createElement('br'));

    // Description TextArea
    const descriptionTitle = document.createElement('label');
    descriptionTitle.textContent = 'Description:';
    this.descriptionTextArea = document.createElement('textarea');
    this.descriptionTextArea.name = 'description';
    this.descriptionTextArea.cols = 30;
    body.appendChild(descriptionTitle);
    body.appendChild(document.createElement('br'));
    body.appendChild(this.descriptionTextArea);

    this.node.appendChild(body);
  }

  onAfterAttach() {
    this.nameInput.addEventListener('keyup', this);
    this.valueInput.addEventListener('keyup', this);
    this.typeSelect.addEventListener('change', this);
    this.labelInput.addEventListener('keyup', this);
    this.descriptionTextArea.addEventListener('keyup', this);
  }

  onBeforeDetach() {
    this.nameInput.removeEventListener('keyup', this);
    this.valueInput.removeEventListener('keyup', this);
    this.typeSelect.removeEventListener('change', this);
    this.labelInput.removeEventListener('keyup', this);
    this.descriptionTextArea.removeEventListener('keyup', this);
  }

  handleEvent(event: Event): void {
    switch (event.type) {
      case 'keyup':
        this._evtKeyUp(event as KeyboardEvent);
        break;
      case 'change':
        this._evtChange();
        break;
    }
  }

  private _evtKeyUp(event: KeyboardEvent) {
    let target = event.target as HTMLInputElement;
    this._parameter[target.name] = target.value;
  }

  private _evtChange() {
    this._parameter['type'] = this.typeSelect.value;
  }
}

export const addParameterIcon = new LabIcon({
  name: 'platiagro:add-parameter',
  svgstr: addParameterSvgstr
});

/**
 * Set a parameter in the parameters cell.
 *
 * @param notebook - The notebook widget.
 * @param name - The parameter name.
 * @param value - The parameter value.
 */
function setParameter(notebook: Notebook, parameter: any) {
  // get the index of first cell that has a tag 'parameters'
  const index = notebook.widgets.findIndex(cell =>
    (cell.model.metadata.get('tags') as string[])?.includes('parameters')
  );

  let value;

  // quote values of type string and feature
  if (parameter.type == 'string' || parameter.type == 'feature') {
    value = `"${parameter.value}"`;
  } else {
    value = parameter.value;
  }

  const newsource = `${parameter.name} = ${value} #@param {type:"${parameter.type}",label:"${parameter.label}",description:"${parameter.description}"}`;

  if (index > -1) {
    // edit cell
    const cell = notebook.widgets[index].model;

    // either edit or insert parameter in the source code
    const regex = new RegExp(`^${name} = .*$`);

    if (cell.value.text.match(regex)) {
      cell.value.text = cell.value.text.replace(regex, newsource);
    } else {
      cell.value.text += `\n${newsource}`;
    }
  } else {
    // insert cell
    const newcell = notebook.model.contentFactory.createCodeCell({});
    newcell.value.text = newsource;
    newcell.metadata.set('tags', ['parameters']);
    notebook.model.cells.push(newcell);
  }
}
