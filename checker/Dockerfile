FROM python:3.9-buster

WORKDIR /checker
COPY requirements.txt requirements.txt
RUN pip3 install -r requirements.txt

COPY . .

ENTRYPOINT gunicorn -c gunicorn.conf.py checker:app
