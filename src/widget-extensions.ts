import { IDisposable, DisposableDelegate } from '@lumino/disposable';

import { ToolbarButton } from '@jupyterlab/apputils';

import { DocumentRegistry } from '@jupyterlab/docregistry';

import { NotebookPanel, INotebookModel } from '@jupyterlab/notebook';

import { setDatasetIcon, DatasetActions } from './dataset';

import { setParameterIcon, ParameterActions } from './parameter';

import { LocalKernelActions } from './local-kernel';

import { kernelIcon } from '@jupyterlab/ui-components';

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

    // adds a toolbarbutton for local kernel connection declaration
    const localKernelConnection = new ToolbarButton({
      icon: kernelIcon,
      label: 'Local Kernel Connection',
      onClick: async (): Promise<void> => {
        LocalKernelActions.showDialog(panel);
      },
      tooltip: 'Connect to a Local Kernel'
    });

    panel.toolbar.insertBefore(
      'kernelName',
      'setLocalKernel',
      localKernelConnection
    );

    return new DisposableDelegate(() => {
      uploader.dispose();
    });
  }
}
