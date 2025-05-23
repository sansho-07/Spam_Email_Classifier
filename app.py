# app.py
from flask import Flask, request, render_template
import joblib

app = Flask(__name__)
model = joblib.load('Spam_Email_Classifier/model.pkl')
vectorizer = joblib.load('Spam_Email_Classifier/vectorizer.pkl')

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction = None
    if request.method == 'POST':
        msg = request.form['message']
        data = vectorizer.transform([msg])
        result = model.predict(data)[0]
        prediction = 'Spam' if result == 1 else 'Not Spam'
    return render_template('index.html', prediction=prediction)

if __name__ == '__main__':
    app.run(debug=True)
