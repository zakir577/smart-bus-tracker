import random
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/predict-eta", methods=["POST"])
def predict_eta():
    distance = request.json["distance"]

    # Simple dummy model
    eta = round(distance / 0.7, 2)  # speed = 0.7 km/min
    return jsonify({"eta_minutes": eta})

app.run(port=7000)
