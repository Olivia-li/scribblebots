# SETUP
## Client
```
cd client 
yarn
yarn start 
```

## Server 
```
cd server
yarn
yarn start
```

## Python Background Removal
```
cd python-server
python3 -m venv venv
source venv/bin/activate
pip3 install -r requirements.txt
FLASK_ENV=development FLASK_APP=app.py flask run -h localhost -p 4999
```

Listen on `localhost:3000`
