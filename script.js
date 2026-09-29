// ============================================================
// FORD PRICE PREDICTOR
// ============================================================
//
// LOCAL API:
const API_URL = "http://192.168.1.6:8000/predict";
//
// WHEN YOU DEPLOY TO RENDER:
// Change the line above to:
//
// const API_URL = "https://YOUR-APP-NAME.onrender.com/predict";
//
// ============================================================


// -----------------------------
// DOM ELEMENTS
// -----------------------------

const form = document.getElementById("predictionForm");

const predictButton =
    document.getElementById("predictButton");

const resetButton =
    document.getElementById("resetButton");

const errorMessage =
    document.getElementById("errorMessage");

const emptyResult =
    document.getElementById("emptyResult");

const predictionResult =
    document.getElementById("predictionResult");

const priceValue =
    document.getElementById("priceValue");

const summaryModel =
    document.getElementById("summaryModel");

const summaryYear =
    document.getElementById("summaryYear");

const summaryMileage =
    document.getElementById("summaryMileage");

const summaryFuel =
    document.getElementById("summaryFuel");


// -----------------------------
// ERROR MESSAGE
// -----------------------------

function showError(message) {

    errorMessage.textContent = message;

    errorMessage.hidden = false;
}


function hideError() {

    errorMessage.textContent = "";

    errorMessage.hidden = true;
}


// -----------------------------
// LOADING STATE
// -----------------------------

function setLoading(isLoading) {

    predictButton.disabled = isLoading;

    predictButton.classList.toggle(
        "loading",
        isLoading
    );
}


// -----------------------------
// GET NUMBER
// -----------------------------

function getNumber(id) {

    const value =
        document.getElementById(id).value.trim();

    return Number(value);
}


// -----------------------------
// VALIDATE FORM
// -----------------------------

function validateForm() {

    const carModel =
        document.getElementById("car_model")
            .value
            .trim();

    const year =
        getNumber("year");

    const mileage =
        getNumber("mileage");

    const tax =
        getNumber("tax");

    const mpg =
        getNumber("mpg");

    const engineSize =
        getNumber("engineSize");


    if (!carModel) {

        return "Please enter the Ford car model.";
    }


    if (
        !Number.isInteger(year) ||
        year < 1900 ||
        year > 2100
    ) {

        return "Please enter a valid vehicle year.";
    }


    if (
        !Number.isFinite(mileage) ||
        mileage < 0
    ) {

        return "Mileage must be zero or greater.";
    }


    if (
        !Number.isFinite(tax) ||
        tax < 0
    ) {

        return "Tax must be zero or greater.";
    }


    if (
        !Number.isFinite(mpg) ||
        mpg <= 0
    ) {

        return "MPG must be greater than zero.";
    }


    if (
        !Number.isFinite(engineSize) ||
        engineSize <= 0
    ) {

        return "Engine size must be greater than zero.";
    }


    if (
        !document.getElementById("transmission").value
    ) {

        return "Please select a transmission.";
    }


    if (
        !document.getElementById("fuelType").value
    ) {

        return "Please select a fuel type.";
    }


    return null;
}


// -----------------------------
// CREATE API REQUEST
// -----------------------------

function buildRequestBody() {

    return {

        car_model:
            document.getElementById("car_model")
                .value
                .trim(),

        year:
            getNumber("year"),

        transmission:
            document.getElementById("transmission")
                .value,

        mileage:
            getNumber("mileage"),

        fuelType:
            document.getElementById("fuelType")
                .value,

        tax:
            getNumber("tax"),

        mpg:
            getNumber("mpg"),

        engineSize:
            getNumber("engineSize")
    };
}


// -----------------------------
// FORMAT PRICE
// -----------------------------

function formatPrice(value) {

    const numericValue =
        Number(value);


    if (!Number.isFinite(numericValue)) {

        return "Unavailable";
    }


    return new Intl.NumberFormat(
        "en-GB",
        {
            style: "currency",
            currency: "GBP",
            maximumFractionDigits: 0
        }
    ).format(numericValue);
}


// -----------------------------
// DISPLAY RESULT
// -----------------------------

function displayPrediction(
    data,
    request
) {

    if (
        typeof data.predicted_price !== "number"
    ) {

        throw new Error(
            "The API response did not contain a valid predicted_price."
        );
    }


    // Price

    priceValue.textContent =
        formatPrice(
            data.predicted_price
        );


    // Summary

    summaryModel.textContent =
        request.car_model;

    summaryYear.textContent =
        request.year.toString();

    summaryMileage.textContent =
        `${new Intl.NumberFormat("en-GB")
            .format(request.mileage)} miles`;

    summaryFuel.textContent =
        request.fuelType;


    // Switch result state

    emptyResult.hidden = true;

    predictionResult.hidden = false;


    // Scroll result into view on smaller screens

    if (window.innerWidth <= 900) {

        document
            .querySelector(".result-card")
            .scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
    }
}


// -----------------------------
// CALL FASTAPI
// -----------------------------

async function predictPrice(request) {

    const response =
        await fetch(
            API_URL,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(request)
            }
        );


    let data;


    try {

        data =
            await response.json();

    } catch {

        throw new Error(
            `The API returned an invalid response. HTTP ${response.status}.`
        );
    }


    // FastAPI error

    if (!response.ok) {

        let detail =
            "The prediction request failed.";


        if (
            data &&
            data.detail
        ) {

            if (
                Array.isArray(data.detail)
            ) {

                detail =
                    data.detail
                        .map(
                            item =>
                                item.msg ||
                                "Invalid input."
                        )
                        .join(" ");

            } else {

                detail =
                    String(data.detail);
            }
        }


        throw new Error(
            `${detail} HTTP ${response.status}`
        );
    }


    return data;
}


// -----------------------------
// FORM SUBMISSION
// -----------------------------

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();

        hideError();


        // Validate

        const validationError =
            validateForm();


        if (validationError) {

            showError(
                validationError
            );

            return;
        }


        // Build request

        const request =
            buildRequestBody();


        // Loading

        setLoading(true);


        try {

            // Send request to FastAPI

            const data =
                await predictPrice(
                    request
                );


            // Display prediction

            displayPrediction(
                data,
                request
            );

        } catch (error) {

            console.error(
                "Prediction error:",
                error
            );


            if (
                error instanceof TypeError
            ) {

                showError(
                    "Could not connect to your FastAPI server. " +
                    "Make sure the API is running at " +
                    API_URL +
                    " and CORS is configured."
                );

            } else {

                showError(
                    error.message ||
                    "Something went wrong while making the prediction."
                );
            }

        } finally {

            setLoading(false);
        }
    }
);


// -----------------------------
// RESET
// -----------------------------

resetButton.addEventListener(
    "click",
    function () {

        form.reset();

        hideError();


        emptyResult.hidden =
            false;

        predictionResult.hidden =
            true;


        priceValue.textContent =
            "£0";

        summaryModel.textContent =
            "—";

        summaryYear.textContent =
            "—";

        summaryMileage.textContent =
            "—";

        summaryFuel.textContent =
            "—";
    }
);