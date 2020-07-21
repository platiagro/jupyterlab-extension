# -*- coding: utf-8 -*-
import os
import requests

from unicodedata import normalize

DATASETS_ENDPOINT = os.getenv("DATASETS_ENDPOINT", "http://datasets.kubeflow:8080")
PROJECTS_ENDPOINT = os.getenv("PROJECTS_ENDPOINT", "http://projects.kubeflow:8080")


def update_component(component_id, experiment_notebook=None, deployment_notebook=None) -> dict:
    """Updates a component fro notebook using PlatIAgro Projects API.

    Args:
        component_id (str): the component uuid.
        experiment_notebook (dict): the experiment notebook.
        deployment_notebook (dict): the deployment notebook.

    Returns:
        dict: The component details.

    Raises:
        ConnectionError: When the request did not succeed.
        HTTPError: When the request did not succeed.
    """
    json = {}

    if experiment_notebook:
        json["experimentNotebook"] = experiment_notebook

    if deployment_notebook:
        json["deploymentNotebook"] = deployment_notebook

    r = requests.patch(f"{PROJECTS_ENDPOINT}/components/{component_id}", json=json)
    r.raise_for_status()
    return r.json()


def create_dataset(file: bytes, filename: str = "file") -> dict:
    """Creates a dataset from a CSV file using PlatIAgro Datasets API.

    Args:
        file (bytes): file object.
        filename (str, optional): filename. Defaults to "file".

    Returns:
        dict: The dataset details: name, columns, and filename.

    Raises:
        ConnectionError: When the request did not succeed.
        HTTPError: When the request did not succeed.
    """
    files = {"file": (filename, file)}
    r = requests.post(f"{DATASETS_ENDPOINT}/datasets", files=files)
    r.raise_for_status()
    return r.json()


def generate_name(filename: str, attempt: int = 1, path: str = "/tmp/data") -> str:
    """Generates a dataset name from a given filename.

    Args:
        filename (str): source filename.
        path (str): path to check if name exist.
        attempt (int, optional): the current attempt of generating a new name.

    Returns:
        str: new generated dataset name.
    """
    name = normalize('NFKD', filename) \
        .encode('ASCII', 'ignore') \
        .replace(b' ', b'-') \
        .decode()

    if attempt > 1:
        name, extension = os.path.splitext(name)
        name = f"{name}-{attempt}{extension}"

    try:
        open(f"{path}/{name}")
    except FileNotFoundError:
        return name

    return generate_name(filename, attempt + 1)


def create_dataset_locally(file: bytes, filename: str = "file", path: str = "/tmp/data"):
    """Creates a dataset from a CSV and writes locally.

    Args:
        file (bytes): file object content.
        filename (str, optional): file name. Defaults to "file".
        path (str, optional): path to be writen. Defaults to "/tmp/data".

    Raises:
        OSError: When the writing did not succeed.
    """
    name = generate_name(filename)

    try:
        with open(f"{path}/{name}", 'wb') as csv_file:
            csv_file.write(file)

        return {"filename": filename, "name": name}
    except OSError as e:
        print(e)
