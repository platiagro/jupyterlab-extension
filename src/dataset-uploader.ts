import { Widget } from '@lumino/widgets';

import {
  showDialog,
  Dialog,
  ToolbarButton,
  showErrorMessage
} from '@jupyterlab/apputils';

import { Notebook } from '@jupyterlab/notebook';

import { LabIcon } from '@jupyterlab/ui-components';

import { requestAPI } from './server-api';

import addDatasetSvgstr from '../style/icons/add-dataset.svg';

/**
 * A widget which provides a toolbarbutton.
 */
export class DatasetUploader extends ToolbarButton {
  private _file: File;

  constructor(notebook: Notebook) {
    super({
      icon: addDatasetIcon,
      onClick: async () => {

        // Open a dialog that hosts a form to select a file
        const result = await showDialog({
          title: 'Upload a CSV file and set the dataset name',
          body: new DialogBody(this._onFileSelected),
          buttons: [Dialog.cancelButton(), Dialog.okButton()]
        });

        if (result.button.accept) {
          // Call backend to create a dataset using the selected file
          const response = await this._createDataset(this._file);
          if (response) {
            const name = response?.name;
            setParameter(notebook, 'dataset', name);
          }
        }
      },
      tooltip: 'Upload a CSV file and set the dataset name'
    });

    this.addClass('jp-id-upload');
  }

  /**
   * Callback function that receives the selected file
   */
  private _onFileSelected = (file: File) => {
    this._file = file;
  }

  /**
   * Call backend to create a dataset using the selected file
   */
  private _createDataset = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await requestAPI<any>('datasets', {
        method: 'POST',
        body: formData
      });
      return response;
    } catch (error) {
      console.error(
        'The jupyterlab_extension server extension appears to be missing.\n'
      );
      void showErrorMessage('Upload Error', error);
    }
  };
}

/**
 * A widget which hosts a form to upload a CSV file.
 */
class DialogBody extends Widget {
  private input: HTMLInputElement;
  private onFileSelected: Function;

  constructor(onFileSelected: Function) {
    super();
    this.onFileSelected = onFileSelected;
    this.buildForm();
  }

  buildForm() {
    const body = document.createElement('div');

    // Input File
    const title = document.createElement('label');
    title.textContent = 'Select a file:';
    this.input = document.createElement('input');
    this.input.type = 'file';
    this.input.accept = '.csv';
    this.input.multiple = false;
    this.input.onclick = this._onInputClicked;
    this.input.onchange = this._onInputChanged;
    body.appendChild(title);
    body.appendChild(document.createElement('br'));
    body.appendChild(this.input);

    this.node.appendChild(body);
  }

  /**
   * The 'change' handler for the input field.
   */
  private _onInputChanged = async () => {
    const files = Array.prototype.slice.call(this.input.files) as File[];
    this.onFileSelected(files[0]);
  };

  /**
   * The 'click' handler for the input field.
   */
  private _onInputClicked = () => {
    // In order to allow repeated uploads of the same file (with delete in between),
    // we need to clear the input value to trigger a change event.
    this.input.value = '';
  };
}

export const addDatasetIcon = new LabIcon({
  name: 'platiagro:add-dataset',
  svgstr: addDatasetSvgstr
});

/**
 * Set a parameter in the parameters cell.
 *
 * @param notebook - The notebook widget.
 * @param name - The parameter name.
 * @param value - The parameter value.
 */
function setParameter(notebook: Notebook, name: string, value: string) {
  // get the index of first cell that has a tag 'parameters'
  const index = notebook.widgets.findIndex(cell =>
    (cell.model.metadata.get('tags') as string[])?.includes('parameters')
  );

  const newsource = `${name} = "${value}" #@param {type:"string"}`;

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
