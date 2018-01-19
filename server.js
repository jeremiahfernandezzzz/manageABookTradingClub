// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();
var mongodb = require("mongodb")
var MongoClient = mongodb.MongoClient;
var url = process.env.DB_URL;
var bodyParser = require('body-parser');
var cookies = require('cookie-session');
// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('views'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cookies({
  name: 'session',

  keys: ['key1', 'key2'],
  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// http://expresjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  if (request.session){
    response.sendFile((__dirname + '/views/search.html'), {headers: {'Set-Cookie': JSON.stringify(request.session)}});
    console.log("asd " + JSON.stringify(request.session))
  }
});

app.get("/signup", function (request, response) {
  if(request.session.user){
    response.redirect("/")
  }else{
    response.sendFile(__dirname + '/views/newuser.html');
  }
});

app.get("/signin", function (request, response) {
  if(request.session.user){
    response.redirect("/")
  }else{
    response.sendFile(__dirname + '/views/signin.html');
  }
});

app.get("/signout", function (request, response) {
  request.session = null
  console.log(request.session)
  response.redirect("/")
})

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
              //response.send("logged in")
              
              request.session.user = request.body.username
              //request.cookies = {user: request.body.username}
              //request.session.save(
                console.log("zxc" + JSON.stringify(request.session))
                response.redirect("/")
              //)
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
  
  var added_books = [];
  MongoClient.connect(url, function(err, db){
    if (db){
        db.collection("bookclub_books").find({},{_id:0}).toArray().then(element => {
          added_books = element
          
          books.search(request.query.qwe, function(error, results) {
            //console.log(JSON.stringify(results))
              if ( ! error ) {
                  var data = []
                  results.forEach(function(element){
                    var added = false;
                    added_books.forEach(function(added_book){
                      if (added_book["title"] == element["title"]){
                        added = true
                      }
                    })
                    data.push({
                      title: element["title"],
                      subtitle: element["subtitle"],              
                      author: element["author"],
                      thumbnail: element["thumbnail"],
                      added: added
                    })
                  })
                  //data
                  response.render('search', { data : JSON.stringify(data) });
              } else {
                  console.log(error);
              }
          });
      })
    }
    if (err) {
     console.log("did not connect to " + url)
    }
  })
})

app.post("/search", function(request,response){
  console.log(request.body)
  MongoClient.connect(url, function(err, db){
    if (db){
          var book = {
            'title' : request.body.title, 
            'user': request.session.user
          }
          console.log("book " + book);
          db.collection("bookclub_books").find(book).toArray().then(element => {
        if (element == "") {
          db.collection("bookclub_books").insert(book);
          response.redirect("/");
        } else {
          response.redirect("/");
          //response.send("username already taken")
        }
      })
    }
    if (err) {
     console.log("did not connect to " + url)
    }
  })
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
