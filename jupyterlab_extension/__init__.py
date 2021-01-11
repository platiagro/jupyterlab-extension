from ._version import __version__
from .handlers import setup_handlers
from .hooks import setup_hooks


def _jupyter_server_extension_paths():
    return [{
        "module": "jupyterlab_extension"
    }]


def load_jupyter_server_extension(lab_app):
    """
    Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    lab_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(lab_app.web_app)
    setup_hooks(lab_app.web_app)
    lab_app.log.info("Registered @platiagro/jupyterlab_extension extension")
