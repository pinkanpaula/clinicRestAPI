# clinicRestAPI

This is a very simple REST service for a Clinic where user can acess some data such as opening hours, available doctors, queue information.
The data is stored in Firebase console which provide a real time database service
This API can be accessed by mobile client whereby the authentication is using OAuth login for Facebook 



Steps:

1. Clone this repo
2. Run npm start
3. Test the service, try to run http://localhost:3000/queueinfo

Note: Please check  the port no in server.js 



There are 2 server codes here : server.js and index.js
server.js use ES6 while index.js use simple javascript
I created index.js for Google cloud deployment 
Currently the start script in package.json refers to server.js
