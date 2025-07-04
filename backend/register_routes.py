from flask import Flask
from routes.match_events import match_events_bp
from routes.matches import match_bp


def register_routes(app: Flask):
    app.register_blueprint(match_events_bp, url_prefix="/api")
    app.register_blueprint(match_bp, url_prefix="/api")
