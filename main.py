from fastapi import FastAPI
from pydantic import BaseModel
from typing import Literal
import pickle
import pandas as pd
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the trained model and the exact column list it was trained on (runs once at startup)
with open("Best_Random_Forest.pkl", "rb") as f:
    model = pickle.load(f)

with open("columns.pkl", "rb") as f:
    training_columns = pickle.load(f)


# The shape of a valid request
class CarInput(BaseModel):
    car_model: str
    year: int
    transmission: Literal["Manual", "Automatic", "Semi-Auto"]
    mileage: float
    fuelType: Literal["Petrol", "Diesel", "Hybrid", "Electric"]
    tax: float
    mpg: float
    engineSize: float


@app.post("/predict")
def predict(data: CarInput):
    # 1. Validated input -> dictionary, using the column name from training
    input_dict = data.model_dump()
    input_dict["model"] = input_dict.pop("car_model")

    # 2. One-row DataFrame, same shape as one row of training data
    input_df = pd.DataFrame([input_dict])

    # 3. Encode text columns, then force the exact training columns and order
    input_df = pd.get_dummies(input_df)
    input_df = input_df.reindex(columns=training_columns, fill_value=0)

    # 4. Predict and return a plain Python number
    prediction = model.predict(input_df)
    return {"predicted_price": float(prediction[0])}