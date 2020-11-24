import {
  showDialog as showDialogBase,
  Dialog,
  ToolbarButton
} from '@jupyterlab/apputils';

import { NotebookPanel } from '@jupyterlab/notebook';

import { ServerConnection, KernelAPI } from '@jupyterlab/services';

import { IModel as ISessionModel } from '@jupyterlab/services/lib/session/session';

import { checkIcon } from '@jupyterlab/ui-components';

import { Widget } from '@lumino/widgets';

import warningIcon from '../style/icons/warning.png';

/**
 * A namespace for `RemoteKernelActions` static methods.
 */
export namespace RemoteKernelActions {
  /**
   * Show the dialog to connect to a remote kernel.
   *
   * @param session - The session context used by the panel.
   */
  export const showDialog = async (session: NotebookPanel): Promise<void> => {
    // object to hold input value
    const parameter: any = {
      host: ''
    };

    // Open a dialog that hosts a form to connect to a remote kernel
    const result = await showDialogBase({
      title: 'Connect to a Remote Kernel',
      body: new DialogBody(parameter),
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Connect' })]
    });

    if (result.button.accept) {
      await setConnection(parameter, session);
    }
  };

  /**
   * Create a new connection at the client remote host.
   *
   * @param inputField The input field from modal.
   * @param notebookPanel A widget that hosts a notebook toolbar and content area.
   */
  export const setConnection = async (
    parameter: any,
    notebookPanel: NotebookPanel
  ): Promise<void> => {
    // Checks if a given string is in the url patterns (protocol-relative URL included)
    const verifyUrlPattern = new RegExp('^([a-z]+://|//)', 'i');

    // Since @jupyterlab/notebook doesn't support id attribute
    // when creating an element in the widget's toolbar, create it manually
    document
      .getElementsByClassName('remote-kernel-connection')[0]
      .getElementsByClassName('jp-ToolbarButtonComponent-label')[0].id =
      'remote-kernel-button';

    if (!parameter.host || !verifyUrlPattern.test(parameter.host)) {
      await showDialogBase({
        title: 'Cannot Create Connection',
        body: 'The host field is invalid.',
        buttons: [Dialog.okButton()]
      });

      void RemoteKernelActions.showDialog(notebookPanel);
      return;
    }

    document.getElementById('remote-kernel-button').innerText = 'Connecting...';
    const url = new URL(parameter.host);
    const { kernel: clientKernel } = await createSession(url, notebookPanel);
    const clientSettings = createRemoteSettings(url);

    const remoteSettings = {
      id: clientKernel.id,
      token: clientSettings.token,
      wsUrl: clientSettings.wsUrl
    };

    const settings = ServerConnection.makeSettings();
    const kernel = await KernelAPI.startNew({ name: 'python3' }, settings);

    await notebookPanel.sessionContext
      .changeKernel({ id: kernel.id }, remoteSettings)
      .then(async () => {
        const connectedChecker = new ToolbarButton({
          icon: checkIcon,
          className: 'successfully-connected'
        });

        notebookPanel.toolbar.insertBefore(
          'setRemoteKernel',
          'successfullyConnected',
          connectedChecker
        );

        // Update DOM's elements
        document.getElementsByClassName('successfully-connected')[0].id =
          'remote-kernel-connected';

        document.getElementById('remote-kernel-button').innerText =
          'Connected (local)';

        document.getElementById(
          'remote-kernel-button'
        ).title = `Connected to a remote kernel on port ${url.port}`;

        document.getElementById('remote-kernel-connected').style.display = '';

        console.log(
          `Connected to ${url.origin}/api/kernels/${clientKernel.id}`
        );

        await showDialogBase({
          title: 'Connected to a Remote Kernel',
          body:
            "Platiagro's Jupyter frontend has now access to the kernel host file system. \
            To disconnect, select another kernel.",
          buttons: [Dialog.okButton()]
        });
      });

    // Keep tracking of the current kernel
    let currentKernel = notebookPanel.sessionContext.session.kernel.id;

    notebookPanel.sessionContext.kernelChanged.connect(async () => {
      if (currentKernel === kernel.id) {
        const dialogResult = await showDialogBase({
          title: 'Remote Kernel Has Been Disconnected',
          body: 'This session is no longer connected to a remote kernel.',
          buttons: [
            Dialog.createButton({ label: 'Reconnect' }),
            Dialog.okButton()
          ]
        });

        currentKernel = notebookPanel.sessionContext.session.kernel.id;

        // Update DOM's elements
        document.getElementById('remote-kernel-button').innerText =
          'Connect to a Remote Kernel';

        document.getElementById('remote-kernel-connected').style.display =
          'none';

        if (dialogResult.button.label === 'Reconnect') {
          void setConnection(parameter, notebookPanel);
          return;
        }
      }
    });
  };

  /**
   * Create a new Session Object
   *
   * @param localHost URL
   * @param notebookPanel A widget that hosts a notebook toolbar and content area.
   */
  export const createSession = async (
    localHost: URL,
    notebookPanel: NotebookPanel
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

    // Create the Session and format the response
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

        websocket.onerror = async (): Promise<any> => {
          const errorDialog = await showDialogBase({
            title: 'WebSocket Connection Error',
            body:
              "The operation couldn't be completed. Please, check the entered informations such as \
              hostname, socket port and token.",
            buttons: [Dialog.okButton()]
          });

          if (errorDialog.button.accept) {
            document.getElementById('remote-kernel-button').innerText =
              'Connect to a Remote Kernel';
            void RemoteKernelActions.showDialog(notebookPanel);
            return;
          }
        };
      });
    };

    const session = await createSession();
    return session;
  };

  /**
   * Create settings for a remote server connection.
   *
   * @param options The client URL to extract details
   */
  export const createRemoteSettings = (
    options: URL
  ): ServerConnection.ISettings => {
    const wsUrl = `ws://${options.host}/http_over_websocket/proxied_ws`;
    const token = options.searchParams.get('token');

    return ServerConnection.makeSettings({ wsUrl, token });
  };
}

/**
 * A widget which hosts a form to connect to a remote kernel.
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
    instructionsParagraph.className = 'remote-kernel-dialog-instructions';
    const warningParagraph = document.createElement('div');
    warningParagraph.className = 'remote-kernel-dialog-warning';
    const inputHost = document.createElement('div');
    inputHost.className = 'input';
    const extraDialog = document.createElement('div');
    extraDialog.className = 'remote-kernel-dialog-extra-details';

    // Instructions Text
    const instructionsWrapper = document.createElement('div');
    instructionsWrapper.className = 'jp-input-wrapper';
    instructionsWrapper.innerText =
      'To learn more about on how to create a new remote connection, checkout ';
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
      'Confirm that the authors of this notebook are reliable before running it. With a remote connection, the code you run can read, write and delete files on your computer.';
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
