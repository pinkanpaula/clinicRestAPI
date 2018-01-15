import express from 'express';
import passport from 'passport';
import FacebookStrategy from 'passport-facebook';
import { facebook } from './config';
import * as admin from 'firebase-admin';

// Transform Facebook profile because Facebook and Google profile objects look different
// and we want to transform them into user objects that have the same set of attributes
const transformFacebookProfile = (profile) => ({
  name: profile.name,
  avatar: profile.picture.data.url,
});

// variables to store data requested by clients
// assuming clinic hours are fixed and not real time data

var clinic_hours = {"morning":"9 am to 1 pm", "afternoon":"2 pm to 5 pm" }

var clinic_doctor = []

var clinic_queues = []

//firebase real time database setup
var serviceAccount = require('./serviceAccount.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://health-care-8a066.firebaseio.com'
});

var db = admin.database();
var cdref = db.ref("clinic_doctor");
var cqref = db.ref("clinic_queue");

cdref.once("value", function(snapshot) {
  clinic_doctor = snapshot.val()
});

cqref.once("value", function(snapshot) {
  clinic_queues = snapshot.val()
});



// Register Facebook Passport strategy
passport.use(new FacebookStrategy(facebook,
  // Gets called when user authorizes access to their profile
  async (accessToken, refreshToken, profile, done)
    // Return done callback and pass transformed user object
    => done(null, transformFacebookProfile(profile._json))
));



// Serialize user into the sessions
passport.serializeUser((user, done) => done(null, user));

// Deserialize user from the sessions
passport.deserializeUser((user, done) => done(null, user));

// Initialize http server
const app = express();

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up Facebook auth routes
app.get('/auth/facebook', passport.authenticate('facebook'));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/auth/facebook' }),
  // Redirect user back to the mobile app using Linking with a custom protocol OAuthLogin
  (req, res) => res.redirect('OAuthLogin://login?user=' + JSON.stringify(req.user)));




// Delete empty value retrieved from real time db
function checkEmptyVal(data) {
    for (var x in data) {
        if ( Object.prototype.hasOwnProperty.call(data,x)) {
            var y = data[x]
            if (y==="null" || y===null || y==="" || typeof y === "undefined") 
                delete data[x]            
        }

    }
}


// Clinic info services
app.get('/hoursinfo', function(req,res) {
  if(Object.keys(clinic_hours).length == 0) {
      res.send({"status" : "failed", "clinic_hours" : "no data found"})
  } else {
      res.send({ "status" : "success", "clinic_hours" : clinic_hours })
  }
})

app.get('/doctorsinfo', function(req,res) {
  if(Object.keys(clinic_doctor).length == 0) {
      res.send({"status" : "failed", "clinic_doctor" : "no data found"})
  } else {
      checkEmptyVal(clinic_doctor);
      res.send({ "status" : "success", "clinic_doctor" : clinic_doctor });

  }
})

app.get('/queueinfo', function(req,res) {
  if(Object.keys(clinic_queues).length == 0) {
      res.send({"status" : "failed", "clinic_queues" : "no data found"})
  } else {
      checkEmptyVal(clinic_doctor);
      res.send({ "status" : "success", "clinic_queues" : clinic_queues })
  }
})


// Launch the server on the port 3000
const server = app.listen(8080, () => {
  const { address, port } = server.address();
  console.log(`Listening at http://${address}:${port}`);
});