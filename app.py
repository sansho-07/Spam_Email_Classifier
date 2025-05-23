from flask import Flask, request, render_template
import joblib
import numpy as np

app = Flask(__name__)

# Load the model and vectorizer with error handling
try:
    model = joblib.load('model.pkl')
    vectorizer = joblib.load('vectorizer.pkl')
except Exception as e:
    app.logger.error(f"Error loading model or vectorizer: {e}")
    model = None
    vectorizer = None

def classify_message(msg, model, vectorizer):
    try:
        # Transform the input message using the vectorizer
        data = vectorizer.transform([msg])
        
        # Get the prediction (0 or 1)
        result = model.predict(data)[0]
        prediction = 'Spam' if result == 1 else 'Not Spam'

        # Get the confidence score using predict_proba (if available)
        if hasattr(model, 'predict_proba'):
            probabilities = model.predict_proba(data)[0]
            # The probability of the predicted class
            confidence = np.max(probabilities) * 100  # Convert to percentage
            # Format to 2 decimal places
            confidence = f"{confidence:.2f}"
        else:
            confidence = None  # If predict_proba is not available, confidence will be None

        return prediction, confidence, None
    except Exception as e:
        app.logger.error(f"Error during prediction: {e}")
        return None, None, "An error occurred while classifying the email. Please try again."

@app.route('/', methods=['GET', 'POST'])
def index():
    prediction = None
    confidence = None
    error = None

    if request.method == 'POST':
        msg = request.form.get('message', '').strip()
        if not msg:
            error = "Please enter an email message to classify."
        elif model is None or vectorizer is None:
            error = "Model or vectorizer failed to load. Please check the server logs."
        else:
            prediction, confidence, error = classify_message(msg, model, vectorizer)

    return render_template('index.html', prediction=prediction, confidence=confidence, error=error)

if __name__ == '__main__':
    app.run(debug=True)