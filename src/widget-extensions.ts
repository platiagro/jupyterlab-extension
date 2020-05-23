import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { setDatasetIcon, DatasetActions } from './dataset';

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
    const uploader = new ToolbarButton({
      icon: setDatasetIcon,
      onClick: async (): Promise<void> => {
        DatasetActions.showDialog(panel.content);
      },
      tooltip: 'Upload a CSV file and set the dataset name'
    });

    panel.toolbar.insertAfter('cellType', 'setDataset', uploader);

    return new DisposableDelegate(() => {
      uploader.dispose();
    });
  }
}
