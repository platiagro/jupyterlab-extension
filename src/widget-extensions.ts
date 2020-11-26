import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { setDatasetIcon, DatasetActions } from './dataset';

import { setParameterIcon, ParameterActions } from './parameter';

import { RemoteKernelActions } from './remote-kernel';

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
      tooltip: 'Upload File and Set Dataset Name'
    });

    panel.toolbar.insertAfter('cellType', 'setDataset', uploader);

    // adds a toolbarbutton for parameter declaration
    const parameter = new ToolbarButton({
      icon: setParameterIcon,
      onClick: async (): Promise<void> => {
        ParameterActions.showDialog(panel.content);
      },
      tooltip: 'Add Parameter'
    });

    panel.toolbar.insertAfter('setDataset', 'setParameter', parameter);

    // adds a toolbarbutton for remote kernel connection/disconnection declaration
    const remoteKernelButton = new ToolbarButton({
      label: 'Remote Kernel',
      onClick: async (): Promise<void> => {
        RemoteKernelActions.handleAction(panel.sessionContext);
      },
      tooltip: 'Switch between remote kernel and local kernel'
    });

    panel.toolbar.insertBefore(
      'kernelName',
      'setRemoteKernel',
      remoteKernelButton
    );

    return new DisposableDelegate(() => {
      uploader.dispose();
    });
  }
}
