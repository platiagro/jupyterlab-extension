install:
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

build:
	# Rebuild Typescript source after making changes
	jlpm build
	# Rebuild JupyterLab after making any changes
	jupyter lab build

launch:
	jupyter lab --watch --NotebookApp.token='' --NotebookApp.password=''
