// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongodb = require("mongodb")
var MongoClient = mongodb.MongoClient;
var url = process.env.DB_URL;
var bodyParser = require('body-parser');
var session = require('express-session');
var RedisStore = require('connect-redis')(session);
var redis = require("redis"),
    client = redis.createClient();

// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });

client.on("error", function (err) {
    console.log("Error " + err);
});

client.set("string key", "string val", redis.print);
client.hset("hash key", "hashtest 1", "some value", redis.print);
client.hset(["hash key", "hashtest 2", "some other value"], redis.print);
client.hkeys("hash key", function (err, replies) {
    console.log(replies.length + " replies:");
    replies.forEach(function (reply, i) {
        console.log("    " + i + ": " + reply);
    });
    client.quit();
});
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  store: new RedisStore({
    port: process.env.PORT,
    host: url
  }),
  secret: 'work hard',
  resave: true,
  saveUninitialized: false
}));
// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/search.html');
  if (request.session){
    console.log("asd " + JSON.stringify(request.session))
  }
});

app.get("/newuser", function (request, response) {
  response.sendFile(__dirname + '/views/newuser.html');
});

app.get("/signin", function (request, response) {
  response.sendFile(__dirname + '/views/signin.html');
});

app.post("/signin", function (request, response) {
  MongoClient.connect(url, function(err, db){
    if (db){
        console.log("connected to " + url);
        db.collection("bookclub_users").find({'username' : request.body.username}).toArray().then(element => {
        if (element == "") {
          response.send("user not found")
        } else {
          db.collection("bookclub_users").find({'password' : request.body.password}).toArray().then(element => {
            if (element == "") {
              response.send("wrong password")
            } else {
              response.send("logged in")
              request.session.user = request.body.username
              request.session.save(
                console.log("zxc" + JSON.stringify(request.session))
              )
            }
          })
        }
      })
    }
    if (err) {
     console.log("did not connect to " + url)
    }
  })
});

app.post("/newuser", function (request, response) {
  console.log(request.body)
  MongoClient.connect(url, function(err, db){
    if (db){
          console.log("connected to " + url);
          db.collection("bookclub_users").find({'username' : request.body.username}).toArray().then(element => {
        if (element == "") {
          var user = {
            username: request.body.username,
            password: request.body.password,
            location: request.body.location,
            name: request.body.name,
          }
          db.collection("bookclub_users").insert(user);
          response.redirect("/");
        } else {
          response.send("username already taken")
        }
      })
    }
    if (err) {
     console.log("did not connect to " + url)
    }
  })
});
app.set('view engine', 'jade');

app.get("/search", function(request,response){
  var books = require('google-books-search');

  books.search(request.query.qwe, function(error, results) {
    //console.log(JSON.stringify(results))
      if ( ! error ) {
          response.render('search', { data : JSON.stringify(results) });
      } else {
          console.log(error);
      }
  });
})

app.get("/dreams", function (request, response) {
  response.send(dreams);
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/dreams", function (request, response) {
  dreams.push(request.query.dream);
  response.sendStatus(200);
});

// Simple in-memory store for now
var dreams = [
  "Find and count some sheep",
  "Climb a really tall mountain",
  "Wash the dishes"
];

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
