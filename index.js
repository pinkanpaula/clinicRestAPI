var express = require('express')
var passport = require('passport');
var FacebookStrategy = require('passport-facebook');
var facebook = require('./config');
var admin = require("firebase-admin");


// Transform Facebook profile because Facebook and Google profile objects look different
// and we want to transform them into user objects that have the same set of attributes
var transformFacebookProfile = function transformFacebookProfile(profile) {
  return {
    name: profile.name,
    avatar: profile.picture.data.url
  };
};

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
function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

passport.use(new FacebookStrategy(facebook,
// Gets called when user authorizes access to their profile
function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(accessToken, refreshToken, profile, done) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            return _context.abrupt("return",
            // Return done callback and pass transformed user object
            done(null, transformFacebookProfile(profile._json)));

          case 1:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, undefined);
  }));

  return function (_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  };
}()));



// Serialize user into the sessions
passport.serializeUser(function (user, done) {
  return done(null, user);
});
// Deserialize user from the sessions
passport.deserializeUser(function (user, done) {
  return done(null, user);
});
// Initialize http server
const app = express();

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up Facebook auth routes
app.get('/auth/facebook', passport.authenticate('facebook'));


app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/auth/facebook' }),
// Redirect user back to the mobile app using Linking with a custom protocol OAuthLogin
function (req, res) {
  return res.redirect('OAuthLogin://login?user=' + JSON.stringify(req.user));
});



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
// Changed to 8080 to be deployed on google cloud platform
var server = app.listen(process.env.PORT || 8080, function () {
  var _serverAddress = server.address(),
      address = _serverAddress.address,
      port = _server$address.port;

  console.log("Listening at http://" + address + ":" + port);
});
