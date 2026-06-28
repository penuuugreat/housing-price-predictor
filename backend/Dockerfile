FROM python:3.11-slim

WORKDIR /code

# Install dependencies first (layer cache)
COPY backend/requirements.txt /code/requirements.txt
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy app source
COPY backend/app /code/app

# Copy retrain script and run it at build time.
# This produces kenya_rent_model.pkl + model_meta.json using the exact
# sklearn version installed above — no more InconsistentVersionWarning.
COPY retrain.py /code/retrain.py
RUN python /code/retrain.py

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
