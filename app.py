# -*- coding: utf-8 -*-

import pandas as pd
from flask import Flask
from flask import render_template
import json


data_path = './input/'

app = Flask(__name__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def get_data():
    df= pd.read_csv(data_path + 'output_fakedata2.csv')

    cols_to_keep = ['timestamp', 'longitude', 'latitude', 'symptoms', 'gender', 'age_segment', 'location']
    
    df_clean = df[cols_to_keep].dropna()

    return df_clean.to_json(orient='records')


if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)
