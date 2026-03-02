import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import os

# 1. Load Data
data_path = 'e:/cyber/data/synthetic_ids_2017.csv'
if not os.path.exists(data_path):
    print(f"Error: Data file not found at {data_path}")
    exit(1)

print("Loading dataset...")
df = pd.read_csv(data_path)

# 2. Preprocessing
# Drop non-feature columns for training
X = df.drop(columns=['Label', 'Source IP', 'Destination IP'])
y = df['Label']

# Encode Labels (0: Benign, 1: Attack) - Simplifying to Binary for this specific IDS requirement
# The user asked for 0 -> BENIGN, 1 -> ATTACK.
# But our data has multi-class labels. We will convert them first.
y_binary = y.apply(lambda x: 0 if x == 'BENIGN' else 1)

print("Class distribution:\n", y_binary.value_counts())

# Split Data
X_train, X_test, y_train, y_test = train_test_split(X, y_binary, test_size=0.3, random_state=42)

# Scale Features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# 3. Train Model
print("Training Random Forest Model...")
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train_scaled, y_train)

# 4. Evaluate
y_pred = model.predict(X_test_scaled)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))
print("\nConfusion Matrix:\n", confusion_matrix(y_test, y_pred))

# 5. Save Artifacts
models_dir = 'e:/cyber/models'
if not os.path.exists(models_dir):
    os.makedirs(models_dir)

joblib.dump(model, os.path.join(models_dir, 'rf_model.pkl'))
joblib.dump(scaler, os.path.join(models_dir, 'scaler.pkl'))

print("Model and Scaler saved successfully.")
