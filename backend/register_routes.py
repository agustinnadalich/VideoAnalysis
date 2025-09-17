from flask import Flask
from routes.match_events import match_events_bp
from routes.matches import match_bp
from routes.import_routes import import_bp


def register_routes(app: Flask):
    print("🚨🚨🚨 DEBUG: Registrando blueprints")
    app.register_blueprint(match_events_bp, url_prefix="/api")
    print("🚨🚨🚨 DEBUG: Blueprint match_events registrado")
    app.register_blueprint(match_bp, url_prefix="/api")
    app.register_blueprint(import_bp, url_prefix="/api")
    print("🚨🚨🚨 DEBUG: Todos los blueprints registrados")
