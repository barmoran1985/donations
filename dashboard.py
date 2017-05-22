from flask import Flask
from flask import render_template
from pymongo import MongoClient
import json

app = Flask(__name__)

MONGODB_HOST = 'ds159387.mlab.com'
MONGODB_PORT = 59387
DBS_NAME = 'heroku_w54wv1ks'
COLLECTION_NAME = 'projects'
FIELDS = {'funding_status': True, 'school_state': True, 'resource_type': True, 'poverty_level': True,
          'date_posted': True, 'total_donations': True, 'grade_level': True, 'primary_focus_area': True, '_id': False}
MONGO_URI = 'mongodb://heroku_w54wv1ks:4snrig5l7di3lmb4kd6ssavo3q@ds159387.mlab.com:59387/heroku_w54wv1ks'


@app.route("/")
def index():
    return render_template("index.html")


# @app.route("/template")
# def template():
#     return render_template("base.html")


@app.route("/donorsUS/projects")
def donor_projects():
    connection = MongoClient(MONGO_URI)
    collection = connection[DBS_NAME][COLLECTION_NAME]
    projects = collection.find(projection=FIELDS, limit=20000)
    json_projects = []
    for project in projects:
        json_projects.append(project)
    json_projects = json.dumps(json_projects)
    connection.close()
    return json_projects


if __name__ == "__main__":
    app.run(debug=True)

