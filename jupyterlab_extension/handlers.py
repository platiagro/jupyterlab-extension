# -*- coding: utf-8 -*-
import json

from io import BytesIO
from jupyter_client.jsonutil import date_default
from notebook.base.handlers import APIHandler
from notebook.utils import url_path_join
import tornado
from tornado.escape import utf8
from tornado.httputil import parse_multipart_form_data

from .services import create_dataset


class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish("pong")

    @tornado.web.authenticated
    def post(self):
        boundary = self.request.body.split(b"\r\n")[0][2:]
        parse_multipart_form_data(
            boundary=utf8(boundary),
            data=self.request.body,
            arguments=self.request.arguments,
            files=self.request.files,
        )
        if "file" in self.request.files:
            file = self.request.files["file"][0]
            response = create_dataset(file=file["body"])
            if response is not None:
                self.set_status(200)
                self.set_header("Content-Type", "application/json")
                data = json.dumps(response, default=date_default)
                self.finish(data)
            else:
                self.set_status(500)
                self.finish(u"Unable to create a dataset from file")
        else:
            self.set_status(400)
            self.finish(u"No file in request")

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "api", "datasets")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
