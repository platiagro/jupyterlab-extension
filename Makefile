.PHONY: build
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

start:
	jupyter lab --NotebookApp.token='' --NotebookApp.password=''

stop:
	ps -ef|grep jupyter-lab|awk '{print $$2}'|xargs kill -9

start_services:
	docker network create services
	docker run --name mysql -d -p 5432:5432 -e MYSQL_DATABASE=platiagro -e MYSQL_ALLOW_EMPTY_PASSWORD=true --network services mysql:5.7
	docker run --name minio -d -p 9000:9000 -e MINIO_ACCESS_KEY=minio -e MINIO_SECRET_KEY=minio123 --network services minio/minio server /data
	docker run --name projects --restart=always -d -p 8080:8080 -e JUPYTER_ENDPOINT=http://192.168.0.7:8888 -e MYSQL_DB_HOST=mysql -e MYSQL_DB_NAME=platiagro -e MYSQL_DB_USER=root -e MYSQL_DB_PASSWORD= -e MINIO_ENDPOINT=minio:9000 -e MINIO_ACCESS_KEY=minio -e MINIO_SECRET_KEY=minio123 --network services platiagro/projects:0.0.2 --enable-cors --debug --init-db
	docker run --name datasets --restart=always -d -p 8081:8080 -e MINIO_ENDPOINT=minio:9000 -e MINIO_ACCESS_KEY=minio -e MINIO_SECRET_KEY=minio123 --network services platiagro/datasets:0.0.2 --enable-cors --debug

stop_services:
	-docker network rm services
	-docker rm -f mysql
	-docker rm -f minio
	-docker rm -f datasets
	-docker rm -f projects

all: install build launch
