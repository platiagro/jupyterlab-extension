import { showDialog as showDialogBase, Dialog } from '@jupyterlab/apputils';

import { ServerConnection, KernelAPI } from '@jupyterlab/services';

import { IModel as ISessionModel } from '@jupyterlab/services/lib/session/session';

import { ISessionContext } from '@jupyterlab/apputils';

import { Widget } from '@lumino/widgets';

import warningIcon from '../style/icons/warning.png';

/**
 * A namespace for `RemoteKernelActions` static methods.
 */
export namespace RemoteKernelActions {
  /**
   * A namespace for remote kernel private data.
   */
  namespace Private {
    let isConnected = false;
    let currentKernel: string;

    /**
     * Update remote kernel connection.
     *
     * @param status The status to be settup.
     */
    export const setConnectionStatus = (status: boolean): void => {
      isConnected = status;
    };

    /**
     * Get remote kernel status.
     *
     * @returns Current remote kernel status.
     */
    export const getConnectionStatus = (): boolean => {
      return isConnected;
    };

    /**
     * Update current kernel id.
     *
     * @param id The id to be settup.
     */
    export const setCurrentKernel = (id: string): void => {
      currentKernel = id;
    };

    /**
     * Get current kernel id.
     *
     * @returns Current kernel id.
     */
    export const getCurrentKernel = (): string => {
      return currentKernel;
    };
  }

  /**
   * Handle remote kernel button event click.
   *
   * @param sessionContext The session context used by the panel.
   */
  export const handleAction = async (
    sessionContext: ISessionContext
  ): Promise<void> => {
    if (Private.getConnectionStatus()) {
      void RemoteKernelActions.showDisconnectionDialog(sessionContext);
    } else {
      void RemoteKernelActions.showConnectionDialog(sessionContext);
    }
  };

  /**
   * Show the dialog to connect to a remote kernel.
   *
   * @param sessionContext - The session context used by the panel.
   */
  export const showConnectionDialog = async (
    sessionContext: ISessionContext
  ): Promise<void> => {
    // object to hold input value
    const parameter: any = {
      host: '',
    };

    // Open a dialog that hosts a form to connect to a remote kernel
    const result = await showDialogBase({
      title: 'Connect to a Remote Kernel',
      body: new DialogBody(parameter),
      buttons: [Dialog.cancelButton(), Dialog.okButton({ label: 'Connect' })],
    });

    if (result.button.accept) {
      await setConnection(parameter, sessionContext);
    }
  };

  /**
   * Show the dialog to disconnect from a remote kernel.
   *
   * @param sessionContext - The session context used by the panel.
   */
  export const showDisconnectionDialog = async (
    sessionContext: ISessionContext
  ): Promise<void> => {
    const dialog = await showDialogBase({
      title: 'Are you sure you want to disconnect?',
      body: 'You will use the kernel provided by PlatIAgro.',
      buttons: [Dialog.cancelButton(), Dialog.okButton()],
    });

    if (dialog.button.accept) {
      await sessionContext.changeKernel({ name: 'python3' });
      Private.setConnectionStatus(false);
    }
  };

  /**
   * Create a new connection at the client remote host.
   *
   * @param inputField The input field from modal.
   * @param sessionContext The session context used by the panel.

   */
  export const setConnection = async (
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    parameter: any,
    sessionContext: ISessionContext
  ): Promise<void> => {
    // Checks if a given string is in the url patterns (protocol-relative URL included)
    const verifyUrlPattern = new RegExp('^([a-z]+://|//)', 'i');

    if (!parameter.host || !verifyUrlPattern.test(parameter.host)) {
      await showDialogBase({
        title: 'Cannot Create Connection',
        body: 'The host field is invalid.',
        buttons: [Dialog.okButton({ displayType: 'warn' })],
      });

      void RemoteKernelActions.showConnectionDialog(sessionContext);
      return;
    }

    const url = new URL(parameter.host);
    await createSession(url, sessionContext);
    const clientSettings = createRemoteSettings(url);

    const kernel = await KernelAPI.startNew(
      { name: 'python3' },
      clientSettings
    );

    await sessionContext
      .changeKernel({ id: kernel.id, name: kernel.name }, clientSettings)
      .then(async () => {
        console.log(`Connected to ${url.origin}/api/kernels/${kernel.id}`);

        await showDialogBase({
          title: 'Connected to a Remote Kernel',
          body: "Platiagro's Jupyter frontend has now access to the kernel host resources.",
          buttons: [Dialog.okButton()],
        });

        Private.setConnectionStatus(true);
      });

    Private.setCurrentKernel(sessionContext.session.kernel.id);

    sessionContext.kernelChanged.connect(async () => {
      if (Private.getCurrentKernel() === kernel.id) {
        await showDialogBase({
          title: 'Remote Kernel Has Been Disconnected',
          body: 'This session is no longer connected to a remote kernel.',
          buttons: [Dialog.okButton({ label: 'Dismiss' })],
        });

        Private.setConnectionStatus(false);
        Private.setCurrentKernel(
          sessionContext.kernelDisplayStatus
            ? sessionContext.session.kernel.id
            : null
        );
      }
    });
  };

  /**
   * Create a new Session Object.
   *
   * @param localHost URL
   * @param sessionContext The session context used by the panel.
   */
  export const createSession = async (
    localHost: URL,
    sessionContext: ISessionContext
  ): Promise<ISessionModel> => {
    const plugin = {
      endpoint: '/http_over_websocket',
      version: '0.0.7',
      wsAuthUrl: localHost.href,
    };

    const url = `ws://${localHost.host}${plugin.endpoint}?min_version=${plugin.version}&jupyter_http_over_ws_auth_url=${plugin.wsAuthUrl}`;

    const websocket = new WebSocket(url);
    let messageId = 0;

    const sessionDetails = JSON.stringify({
      message_id: (++messageId).toString(),
      method: 'POST',
      path: '/api/sessions',
      body: JSON.stringify({
        name: 'platiagro',
        path: 'Experiment.ipynb',
        type: 'notebook',
        kernel: {
          name: 'python3',
        },
      }),
    });

    // Create the Session and format the response
    const createSession = async (): Promise<any> => {
      const base64ToJSON = (base64: string) => {
        if (typeof Buffer !== 'undefined') {
          return JSON.parse(Buffer.from(base64, 'base64').toString());
        } else if (typeof window.atob !== 'undefined') {
          return JSON.parse(window.atob(base64));
        }

        throw new Error('Cannot convert base64 to JSON');
      };

      return new Promise((resolve) => {
        websocket.addEventListener('open', () => {
          websocket.send(sessionDetails);
        });

        websocket.addEventListener('message', async (e) => {
          const response = JSON.parse(e.data); // base64 string
          const kernel = base64ToJSON(response.data);
          websocket.close();
          resolve(kernel);
        });

        websocket.onerror = async (): Promise<any> => {
          const errorDialog = await showDialogBase({
            title: 'WebSocket Connection Error',
            body: "The operation couldn't be completed. Please, check the entered informations such as \
              hostname, socket port and token.",
            buttons: [
              Dialog.okButton({ displayType: 'warn', label: 'Dismiss' }),
            ],
          });

          if (errorDialog.button.accept) {
            void RemoteKernelActions.showConnectionDialog(sessionContext);
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
   * @param options The client URL to extract details.
   */
  export const createRemoteSettings = (
    options: URL
  ): ServerConnection.ISettings => {
    const wsUrl = `ws://${options.host}/http_over_websocket/proxied_ws`;
    const token = options.searchParams.get('token');
    const baseUrl = options.origin;
    return ServerConnection.makeSettings({
      wsUrl,
      token,
      baseUrl,
    });
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
