# :nut_and_bolt: @platiagro/jupyterlab-extension

<div style="margin-bottom: 16px">
  <img alt="Github Actions Status" src="https://github.com/platiagro/jupyterlab-extension/workflows/Build/badge.svg" />
  <img alt="Github Top Language" src="https://img.shields.io/github/languages/top/platiagro/jupyterlab-extension.svg" />
  <img alt="Github Language Count" src="https://img.shields.io/github/languages/count/platiagro/jupyterlab-extension.svg" />
  <img alt="GitHub License" src="https://img.shields.io/github/license/platiagro/jupyterlab-extension.svg">
</div>

A JupyterLab extension that connects to PlatIAgro.

This extension is composed of a Python package named `jupyterlab_extension` for the server extension and a NPM package named `@platiagro/jupyterlab-extension` for the frontend extension.

## :heavy_check_mark: Requirements

- JupyterLab >= 2.0
- Python 3
- Pip Latest Version
- NodeJs LTS Version

## :information_source: Installing The Extension

_Note: You will need `NodeJS`, `Python 3` and `pip` to install the extension._

Follow the steps below:

**1. Download and Install NodeJs**

Follow the steps in the [NodeJs Official Website](https://nodejs.org/en/) to download and install.

**2. Download and Install Python 3 and pip**

See the instructions to download and install on the [Official Python website](https://www.python.org/downloads/).

<hr style="margin: 16px 0; height: 1px">

_Other Option: Using apt install_

```bash
sudo apt update
sudo apt install python3-pip

# Verify the installation by checking the pip version
pip3 --version
```

**3. Installing The Extension**

```bash
pip install git+https://github.com/platiagro/jupyterlab-extension.git
jupyter lab build
```

## :poop: Troubleshoot

If you are seeing the frontend extension but it is not working, check that the server extension is enabled:

```bash
jupyter serverextension list
```

If the server extension is installed and enabled but you are not seeing the frontend, check the frontend is installed:

```bash
jupyter labextension list
```

If it is installed, try:

```bash
jupyter lab clean
jupyter lab build
```

---

## :handshake: Contributing

### Set env variables

```bash
export DATASETS_ENDPOINT=http://<host:port>
export PROJECTS_ENDPOINT=http://<host:port>
```

### Download and Configure Project

The `jlpm` command is JupyterLab's pinned version of [yarn](https://yarnpkg.com/) that is installed with JupyterLab. You may use `yarn` or `npm` in lieu of `jlpm` below.

```bash
# Clone the repo to your local environment
git clone https://github.com/platiagro/jupyterlab-extension.git
# Move to jupyterlab-extension directory
cd jupyterlab-extension

# Install server extension
pip install -e .
# Register server extension
jupyter serverextension enable --py jupyterlab_extension

# Install dependencies
jlpm
# Build Typescript source
jlpm build
# Link your development version of the extension with JupyterLab
jupyter labextension link .
# Rebuild Typescript source after making changes
jlpm build
# Rebuild JupyterLab after making any changes
jupyter lab build
```

### Run Project Locally

You can watch the source directory and run JupyterLab in watch mode to watch for changes in the extension's source and automatically rebuild the extension and application.

```bash
# Watch the source directory in another terminal tab
jlpm watch
# Run jupyterlab in watch mode in one terminal tab
jupyter lab --watch
```

### Uninstall Extension

```bash
pip uninstall jupyterlab_extension
jupyter labextension uninstall @platiagro/jupyterlab-extension
```

### Publish Extension in npmjs.org

```bash
jlpm login
jlpm publish --access=public
```
