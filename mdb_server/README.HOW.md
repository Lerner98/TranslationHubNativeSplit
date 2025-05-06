# Terminal Commands for README

# Terminal 1: Start MongoDB Server

mongod --port 27017 --dbpath C:\data\db --auth

Note: Replace C:\path\to\your\data\db with your MongoDB data directory (e.g., C:\data\db if set up earlier). Ensure MongoDB is installed and the data directory exists.

# Terminal 2: Start the MDB Server (Microservices)

// cd proj/TH_App_Split/mdb_server

node server.js

Note: This will run the microservices on ports 3001 (/api/admins) and 3002 (/api/reports). Ensure you’ve run npm install in the mdb_server directory if dependencies are not already installed.

# Terminal 3: Start the React App

cd proj/TH_App_Split/mdb_server/web_dashboard/admin-dashboard
npm run dev
Note: This will start the React app, typically on http://localhost:5173. Ensure you’ve run npm install in the admin-dashboard directory if dependencies are not already installed.

Additional Notes for README
Access the App: After starting all terminals, open your browser and go to http://localhost:5173. Log in with the following credentials:
Email: guylerner12@gmail.com, Password: guy123
Email: danielseth1840@gmail.com, Password: daniel123


