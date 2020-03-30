# -*- coding: utf-8 -*-

import pandas as pd
from flask import Flask
from flask import render_template
import json
import random

data_path = './input/'

app = Flask(__name__)

# prov_centers dict, get_location, and make_crds are just to make fake georef data for testing visualization
prov_centers={'Buenos Aires': [(-34.5244484, -58.5036282),(-34.6867073, -58.5298812),(-34.6225227, -58.595568),(-34.9206797, -57.9537638)],
		 'CABA': [(-34.6075682, -58.4370894),(-34.5915159, -58.4853851),(-34.6282028, -58.4622184), (-34.5732414, -58.4914785)],
		   'Chaco': [(-26.3829647, -60.8816092)],
		    'Corrientes': [(-28.5912315, -57.9394658)],
		     'Córdoba': [(-31.4173391, -64.183319)],
		      'Entre Ríos': [(-31.6252842, -59.3539578)],
		       'Neuquén': [(-38.3695057, -69.832275)],
			 'Santa Fe': [(-30.3154739, -61.1645076)],
			  'Tucumán': [(-26.5643582, -64.882397)],
			  'Mendoza': [(-34.78719615, -68.43807123826872)]}

def get_location(prov_carga):
    lat_lon=(40.7127281, -74.0060152) #NY
    if prov_carga in prov_centers:
        random.shuffle(prov_centers[prov_carga])
        lat_lon=prov_centers[prov_carga][0]
    return lat_lon

def make_crds(prov_carga,sig=0.02):
    lat_lon = get_location(prov_carga)
    lat_crd = random.gauss(lat_lon[0],sig)
    lon_crd = random.gauss(lat_lon[1],sig)
    return lat_crd, lon_crd 

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/data")
def get_data():
    sisa = pd.read_csv(data_path + 'SISA_29_03_09_07_para_MINCYT/Reporte-Table1.csv')
    cols_to_keep_sisa = ['CLASIF_RESUMEN', 'CLASIF_EPIDEMIO','FIS','GRUPO_ETARIO', 'PROVINCIA_CARGA']
    sisa = sisa[cols_to_keep_sisa].dropna()
    sisa['CLASIF_EPIDEMIO']=sisa['CLASIF_EPIDEMIO'].replace("En Investigación", "En Inv.")
    sisa = sisa.reset_index()
    sisa['lat_long'] = sisa['PROVINCIA_CARGA'].apply(lambda prov: make_crds(prov))
    sisa[['latitude','longitude']] = pd.DataFrame(sisa['lat_long'].tolist())
    sisa.rename(columns = {'CLASIF_EPIDEMIO' : 'symptoms', 'CLASIF_RESUMEN': 'gender', 'GRUPO_ETARIO':'age_segment', 'PROVINCIA_CARGA':'location', 'FIS': 'timestamp'}, inplace=True) 
    df_clean=sisa
    return df_clean.to_json(orient='records')


if __name__ == "__main__":
    app.run(host='0.0.0.0',port=5000,debug=True)
