from flask import Flask,request,jsonify,render_template
import joblib
import pandas as pd
app=Flask(__name__)
# Loading Models
model = joblib.load('models/disease_pred.pkl')
le = joblib.load('models/label_encoder.pkl')
feature_columns = joblib.load('models/feature_cols.pkl')
doctors=pd.read_csv('doctors_diseases.csv')

def parse_symptoms(text):
    text=text.lower()
    symptoms={}
    for col in feature_columns:
        readable_text=col.replace("_"," ")
        symptoms[col]=(1 if readable_text in text or col in text else 0)
    return symptoms
@app.route('/',methods=['GET'])
def home():
    return render_template('index.html', symptoms=[col.replace("_"," ") for col in feature_columns])
@app.route('/predict',methods=['POST'])
def predict():
    data=request.get_json()

    #checking if input is correct
    if not data or 'symptoms' not in data:
        return jsonify({'Error':'Please provide symptoms'})
    symptoms=parse_symptoms(data['symptoms'])
    detected=[k.replace('_',' ') for k,v in symptoms.items() if v==1]
    if not detected:
        return jsonify({"Error":"Can't recognize symptoms" })
    
    ## predict that data and inversetransform it
    input_df=pd.DataFrame([symptoms])
    prediction=model.predict(input_df)
    disease_recognized=le.inverse_transform(prediction)[0]
    doctor_name = doctors[doctors['Disease'] ==disease_recognized]


    return jsonify({
        'predicted_disease':disease_recognized,
        'symptoms_detected':detected,
        'doctor_to_see':doctor_name
    })

@app.route('/symptoms',methods=['GET'])
def get_symptoms():
    return jsonify({
        'symptoms':[col.replace("_"," ") for col in feature_columns]
        })
if __name__=="__main__":
    app.run(debug=True)
