import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { DatasetUploader } from './dataset-uploader';

/**
 * A notebook widget extension that adds buttons to the toolbar.
 */
export class ToolbarWidgetExtension
  implements DocumentRegistry.IWidgetExtension<NotebookPanel, INotebookModel> {
  createNew(
    panel: NotebookPanel,
    _: DocumentRegistry.IContext<INotebookModel>
  ): IDisposable {
    // creates new toolbarbutton
    const uploader = new DatasetUploader(panel.content);

    // inserts button in the middle of toolbar, after 'cellType'
    panel.toolbar.insertAfter('cellType', 'uploadDataset', uploader);

    return new DisposableDelegate(() => {
      uploader.dispose();
    });
  }
}
