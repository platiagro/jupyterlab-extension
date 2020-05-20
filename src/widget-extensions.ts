import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { DatasetUploader } from './dataset-uploader';

import { ParameterSetter } from './parameter-setter';

/**
 * A notebook widget extension that adds buttons to the toolbar.
 */
export class ToolbarWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  createNew(
    panel: NotebookPanel,
    _: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    // adds a toolbarbutton for dataset upload
    const uploader = new DatasetUploader(panel.content);
    panel.toolbar.insertAfter('cellType', 'uploadDataset', uploader);

    // adds a toolbarbutton for parameter declaration
    const parameter = new ParameterSetter(panel.content);
    panel.toolbar.insertAfter('uploadDataset', 'setParameter', parameter);

    return new DisposableDelegate(() => {
      uploader.dispose();
    });
  }
}
