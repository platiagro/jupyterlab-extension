import { Widget } from '@lumino/widgets';

import { NotebookPanel } from '@jupyterlab/notebook';

import { showDialog as showDialogBase, Dialog } from '@jupyterlab/apputils';

import warningIcon from '../style/icons/warning.png';

import { IModel as ISessionModel } from '@jupyterlab/services/lib/session/session';

/**
 * A namespace for `LocalKernelActions` static methods.
 */
export namespace LocalKernelActions {
  /**
   * Show the dialog to connect to a local kernel.
   *
   * @param notebook - The target notebook widget.
   */
  export const showDialog = async (notebook: NotebookPanel): Promise<void> => {
    // object to hold input value
    const parameter: any = {
      host: ''
    };

    // Open a dialog that hosts a form to connect to a local kernel
    const result = await showDialogBase({
      title: 'Connect to a Local Kernel',
      body: new DialogBody(parameter),
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Connect' })]
    });

    if (result.button.accept) {
      await setConnection(parameter, notebook);
    }
  };

  /**
   * Create a new connection at the client local host.
   *
   * @param inputField The input field from modal.
   * @param notebook The target notebook widget.
   */
  export const setConnection = async (
    parameter: any,
    notebook: NotebookPanel
  ): Promise<void> => {
    // Checks if a given string is in the url patterns (protocol-relative URL included)
    const verifyUrlPattern = new RegExp('^([a-z]+://|//)', 'i');

    if (!parameter.host || !verifyUrlPattern.test(parameter.host)) {
      await showDialogBase({
        title: 'Cannot create connection',
        body: 'The host field is invalid.',
        buttons: [Dialog.okButton()]
      });

      void LocalKernelActions.showDialog(notebook);
      return;
    }

    const url = new URL(parameter.host);
    const { kernel } = await createSession(url);

    console.log(notebook.sessionContext.sessionManager.serverSettings);
    console.log(kernel);
  };

  /**
   * Create a new Session Object
   *
   * @param localHost URL
   */
  export const createSession = async (
    localHost: URL
  ): Promise<ISessionModel> => {
    const plugin = {
      endpoint: '/http_over_websocket',
      version: '0.0.7',
      wsAuthUrl: localHost.href
    };

    const url = `ws://${localHost.host}${plugin.endpoint}?min_version=${
      plugin.version
    }&jupyter_http_over_ws_auth_url=${plugin.wsAuthUrl}`;

    const websocket = new WebSocket(url);
    let messageId = 0;

    const sessionDetails = JSON.stringify({
      // eslint-disable-next-line @typescript-eslint/camelcase
      message_id: (++messageId).toString(),
      method: 'POST',
      path: '/api/sessions',
      body: JSON.stringify({
        name: 'platiagro',
        path: 'Experiment.ipynb',
        type: 'notebook',
        kernel: {
          name: 'python3'
        }
      })
    });

    // Create the Session and format response
    const createSession = async (): Promise<any> => {
      return new Promise((resolve, reject) => {
        websocket.addEventListener('open', () => {
          websocket.send(sessionDetails);
        });

        websocket.addEventListener('message', async e => {
          const response = await JSON.parse(e.data);
          const kernel = await JSON.parse(
            Buffer.from(response.data, 'base64').toString()
          );

          websocket.close();
          resolve(kernel);
        });
      });
    };

    const session = await createSession();
    return session;
  };
}

/**
 * A widget which hosts a form to connect to a local kernel.
 */
class DialogBody extends Widget {
  private _parameter: any;
  private hostInput: HTMLInputElement;

  constructor(parameter: string) {
    super();
    this._parameter = parameter;
    this.buildForm();
  }

  buildForm(): void {
    const body = document.createElement('div');
    body.className = 'modal-large';

    const instructionsParagraph = document.createElement('div');
    instructionsParagraph.className = 'local-kernel-dialog-instructions';
    const warningParagraph = document.createElement('div');
    warningParagraph.className = 'local-kernel-dialog-warning';
    const inputHost = document.createElement('div');
    inputHost.className = 'input';
    const extraDialog = document.createElement('div');
    extraDialog.className = 'local-kernel-dialog-extra-details';

    // Instructions Text
    const instructionsWrapper = document.createElement('div');
    instructionsWrapper.className = 'jp-input-wrapper';
    instructionsWrapper.innerText =
      'To learn more about on how to create a new local connection, checkout ';
    const platiagroRef = document.createElement('a');
    platiagroRef.text = "PlatIAgro's instructions.";
    platiagroRef.href = 'https://platiagro.github.io/tutorials/';
    platiagroRef.target = '_blank';
    instructionsWrapper.appendChild(platiagroRef);
    instructionsParagraph.appendChild(instructionsWrapper);

    // Warning Text and Icon
    const wariningWrapper = document.createElement('div');
    wariningWrapper.className = 'jp-input-wrapper';
    const icon = document.createElement('img');
    icon.alt = 'Warning!';
    icon.height = icon.width = 24;
    icon.src = warningIcon;
    icon.style.float = 'left';
    icon.style.marginRight = '5px';
    const warningContent = document.createElement('p');
    warningContent.textContent =
      'Confirm that the authors of this notebook are reliable before running it. With a local connection, the code you run can read, write and delete files on your computer.';
    warningContent.style.display = 'inline';
    wariningWrapper.appendChild(icon);
    wariningWrapper.appendChild(warningContent);
    warningParagraph.appendChild(wariningWrapper);

    // Host Input
    const hostWrapper = document.createElement('div');
    hostWrapper.className = 'jp-input-wrapper';
    const hostTitle = document.createElement('label');
    hostTitle.textContent = 'Backend URL';
    this.hostInput = document.createElement('input');
    this.hostInput.name = 'name';
    this.hostInput.type = 'text';
    this.hostInput.onchange = this.onInputChanged;
    this.hostInput.placeholder = 'http://localhost:8888/?token=abc123';
    hostWrapper.appendChild(this.hostInput);
    inputHost.appendChild(hostTitle);
    inputHost.appendChild(hostWrapper);

    // Extra Dialog Text
    const extraDialogWrapper = document.createElement('div');
    extraDialogWrapper.className = 'jp-input-wrapper';
    extraDialogWrapper.textContent =
      'Start a Jupyter notebook server on your machine. After the server is started, it will print a message with the initial backend URL used for authentication. Copy that full URL.';
    extraDialogWrapper.style.padding = '12px';
    extraDialog.appendChild(extraDialogWrapper);

    body.append(instructionsParagraph);
    body.append(warningParagraph);
    body.append(inputHost);
    body.append(extraDialog);
    this.node.appendChild(body);
  }

  /**
   * The 'change' handler for the input field.
   */
  private onInputChanged = (): void => {
    this._parameter['host'] = this.hostInput.value;
  };
}
