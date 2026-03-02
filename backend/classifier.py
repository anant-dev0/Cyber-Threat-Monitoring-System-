import joblib
import pandas as pd
import os

class Classifier:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.load_model()

    def load_model(self):
        try:
            model_path = 'e:/cyber/models/rf_model.pkl'
            scaler_path = 'e:/cyber/models/scaler.pkl'
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                print("Model and Scaler loaded successfully.")
            else:
                print("Model files not found. Please train the model first.")
        except Exception as e:
            print(f"Error loading model: {e}")

    def predict(self, feature_dict):
        if not self.model or not self.scaler:
            return "Unknown"

        # Ensure order matches training
        # Features: ['Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Total Bwd Packets', 'Packet Length Std']
        
        df = pd.DataFrame([feature_dict])
        
        # Select only the features we trained on
        # Note: In real scenarios, ensure input dict has these keys
        try:
            df = df[['Destination Port', 'Flow Duration', 'Total Fwd Packets', 'Total Bwd Packets', 'Packet Length Std']]
            
            X_scaled = self.scaler.transform(df)
            prediction = self.model.predict(X_scaled)
            
            return "ATTACK" if prediction[0] == 1 else "BENIGN"
        except KeyError as e:
            print(f"Missing feature in input: {e}")
            return "Error"
