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


app.get("/", function(request,response){
  response.redirect("/allbooks")
})

app.get("/signout", function (request, response) {
  request.session = null
  console.log(request.session)
  //response.setHeader('Set-Cookie',JSON.stringify(request.session))
  response.redirect("/")
})

app.get("/signin", function (request, response) {
  if(request.session.user){
    response.redirect("/")
  }else{
    response.sendFile((__dirname + '/views/signin.html'))//, {headers: {'Set-Cookie': JSON.stringify(request.session)}});
  }
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
              //response.send("logged in")
              request.session.user = request.body.username
              //request.cookies = {user: request.body.username}
              //request.session.save(
                console.log("zxc" + JSON.stringify(request.session))
                response.redirect("/allbooks")
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

app.get("/signup", function (request, response) {
  if(request.session.user){
    response.redirect("/")
  }else{
    response.sendFile(__dirname + '/views/signup.html');
  }
});

app.post("/signup", function (request, response) {
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

app.get("/add", function(request,response){
  //console.log(request.session)
  if (request.session){
    response.sendFile((__dirname + '/views/search.html'))//, {headers: {'Set-Cookie': JSON.stringify(request.session)}});
    console.log("asd " + JSON.stringify(request.session))
  } 
})


app.get("/search", function(request,response){
  console.log(!request.query)
  if(request.query.qwe){
    var books = require('google-books-search');
    MongoClient.connect(url, function(err, db){
      if (db){
        db.collection("bookclub_books").find({}).toArray().then(added_books => {
            books.search(request.query.qwe, function(error, results) {
              console.log(JSON.stringify(results))
                if ( ! error ) {
                    var data = []
                    console.log("zxczxczx" + results)
                    results.forEach(function(element){
                      var added = false;
                      added_books.forEach(function(added_book){
                        if (added_book["title"] == element["title"]){
                          if (added_book["user"] == request.session.user){
                            added = true
                          }
                        }
                      })
                      data.push({
                        title: element["title"],
                        subtitle: element["subtitle"],              
                        authors: element["authors"],
                        thumbnail: element["thumbnail"],
                        added: added
                      })
                      //console.log(data)
                    })

                    response.render('search', { data : JSON.stringify(data) });
                } else {
                    console.log(error);
                }
            });
        })
      }
    })
  }else {
    response.redirect("/allbooks")
  }
})
  
  
app.post("/search", function(request,response){
  console.log("h3h3" + JSON.stringify(request.body))

  
  MongoClient.connect(url, function(err, db){
    if (db){
          var book = {
            'title' : request.body["title"],
            'subtitle' : request.body["subtitle"],
            'thumbnail' : request.body["thumbnail"],
            'authors' : request.body["authors"], 
            'user': request.session.user
          }
          console.log("book " + JSON.stringify(book));
          db.collection("bookclub_books").find(book).toArray().then(element => {
            if (element == "") {
              db.collection("bookclub_books").insert(book);
              response.redirect("/mybooks");
            }
      })
    }
    if (err) {
     console.log("did not connect to " + url)
    }
  })
})
  

/*


app.get("/search", function (request, response) {
  if (request.session){
    response.sendFile((__dirname + '/views/search.html'), {headers: {'Set-Cookie': JSON.stringify(request.session)}});
    console.log("asd " + JSON.stringify(request.session))
  }
});
*/


app.get("/allbooks", function(request,response){
  console.log("ayy" + JSON.stringify(request.session))
  //var added_books = [];
  MongoClient.connect(url, function(err, db){
    if (db){
        db.collection("bookclub_books").find({request: {$exists:false}}).toArray().then(added_books => {
            var data = []
            added_books.forEach(function(element){
              var added = false;
              if (element["user"] == request.session.user){
                added = true
              }
              data.push({
                title: element["title"],
                subtitle: element["subtitle"],              
                authors: element["authors"],
                thumbnail: element["thumbnail"],
                user: element["user"],
                added: added
              })
            })
            //data
              //response.set({headers: {'Set-Cookie': JSON.stringify(request.session)}})
              response.setHeader('Set-Cookie',JSON.stringify(request.session))
              response.render('allbooks', { data : JSON.stringify(data) });
        })
      }
    
    if (err) {
     console.log("did not connect to " + url)
    }
  })
})

app.post("/allbooks", function(request,response){
  console.log(request.body)
  MongoClient.connect(url, function(err, db){
    if (db){
      /*
        db.collection("bookclub_books").find({},{_id:0}).toArray().then(added_books => {
            console.log(added_books)
            var data = []
            added_books.forEach(function(element){
              var added = false;
                if (element["user"] == request.session.user){
                  added = true
                }
                 data.push({
                  title: element["title"],
                  subtitle: element["subtitle"],              
                  authors: element["authors"],
                  thumbnail: element["thumbnail"],
                  added: added
                })
              })
            //data
              response.render('allbooks', { data : JSON.stringify(data) });
          });*/
        var book = {
          'title' : request.body["title"],
          'subtitle' : request.body["subtitle"],
          'thumbnail' : request.body["thumbnail"],
          'authors' : request.body["authors"], 
          'user': request.body["user"]
        }
        db.collection("bookclub_books").update(book, {
          'title' : request.body["title"],
          'subtitle' : request.body["subtitle"],
          'thumbnail' : request.body["thumbnail"],
          'authors' : request.body["authors"], 
          'request': request.session.user,
          'user': request.body["user"]
        });
      }
    
    if (err) {
     console.log("did not connect to " + url)
    }
  })
    response.redirect("/allbooks")
  //console.log(request.body["authors"])
  /*
  MongoClient.connect(url, function(err, db){
    if (db){
          var book = {
            'title' : request.body["title"],
            'subtitle' : request.body["subtitle"],
            'thumbnail' : request.body["thumbnail"],
            'authors' : request.body["authors"], 
            'user': request.body["user"]
          }
          console.log("book " + JSON.stringify(book));
          db.collection("bookclub_books").find(book).toArray().then(element => {
          
          if (element == "") {
            //db.collection("bookclub_books").insert(book);
            response.redirect("/");
          } else {
            db.collection("bookclub_books").update(book, {
                'title' : request.body["title"],
                'subtitle' : request.body["subtitle"],
                'thumbnail' : request.body["thumbnail"],
                'authors' : request.body["authors"], 
                'user': request.body["user"],
                'request': request.session.user
              });
            response.redirect("/");
            //response.send("username already taken")
          }
          
          })
    }
    if (err) {
     console.log("did not connect to " + url)
    }
  })
  */
})



app.get("/mybooks", function(request,response){
  if(request.session.user){
    MongoClient.connect(url, function(err, db){
      if (db){
          db.collection("bookclub_books").find({user: request.session.user},{_id:0}).toArray().then(added_books => {
              var data = []
              added_books.forEach(function(element){
                var request = "";
                  if (element["request"]){
                    request = element["request"]
                  }
                     data.push({
                      title: element["title"],
                      subtitle: element["subtitle"],              
                      authors: element["authors"],
                      thumbnail: element["thumbnail"],
                      user: element["user"],
                      request: request
                    })
                })
              //data
                response.render('mybooks', { data : JSON.stringify(data) });
            });
        }

      if (err) {
       console.log("did not connect to " + url)
      }
    })
  } else {
    response.redirect("/allbooks")      
  }
})

/*
app.get("/requests", function(request,response){
  MongoClient.connect(url, function(err, db){
    if (db){
        db.collection("bookclub_books").find({user: request.session.user},{_id:0}).toArray().then(added_books => {
            var data = []
            added_books.forEach(function(element){
              var added = false
                if (element["user"] == request.session.user){
                  added = true
                   data.push({
                    title: element["title"],
                    subtitle: element["subtitle"],              
                    authors: element["authors"],
                    thumbnail: element["thumbnail"],
                    added: added
                  })
                }
              })
            //data
              response.render('requests', { data : JSON.stringify(data) });
              //response.redirect("/");
          });
      }
    
    if (err) {
     console.log("did not connect to " + url)
    }
  })
})
*/

app.post("/mybooks", function(request,response){
  console.log(request.body)
  var book = {
    'title' : request.body["title"],
    'subtitle' : request.body["subtitle"],
    'thumbnail' : request.body["thumbnail"],
    'authors' : request.body["authors"], 
    'user': request.body["user"]
  }
  MongoClient.connect(url, function(err, db){
    if (db){
      db.collection("bookclub_books").update(book, {
        'title' : request.body["title"],
        'subtitle' : request.body["subtitle"],
        'thumbnail' : request.body["thumbnail"],
        'authors' : request.body["authors"], 
        'user': request.body["request"],
      });
      db.collection("bookclub_books").update(book, {$unset: {request:1}})
    }
    if (err) {
     console.log("did not connect to " + url)
    }
  })
    response.redirect("/mybooks")
})

app.get("/pending", function (request, response) {
  if (request.session.user){
    MongoClient.connect(url, function(err, db){
      if (db){
          db.collection("bookclub_books").find({request: request.session.user},{_id:0}).toArray().then(added_books => {
              var data = []
              added_books.forEach(function(element){
                     data.push({
                      title: element["title"],
                      subtitle: element["subtitle"],              
                      authors: element["authors"],
                      thumbnail: element["thumbnail"],
                      user: element["user"],
                      request: element["request"]
                    })
                })
              //data
                response.render('pending', { data : JSON.stringify(data) });
            });
        }

      if (err) {
       console.log("did not connect to " + url)
      }
    })
  } else {
    response.redirect("/allbooks")        
  }
});

app.post("/pending", function (request, response) {
  console.log(JSON.stringify(request.body))
  
  MongoClient.connect(url, function(err, db){
    var book = {
    'title' : request.body["title"],
    'subtitle' : request.body["subtitle"],
    'thumbnail' : request.body["thumbnail"],
    'authors' : request.body["authors"], 
    'user': request.body["user"],
    'request': request.body["request"]
  }
    if (db){
     db.collection("bookclub_books").update(book, {$unset: {request:1}})
    }
    
    if (err) {
     console.log("did not connect to " + url)
    }
  })
  response.redirect("/pending")
});


app.get("/settings", function (request, response) {
    MongoClient.connect(url, function(err, db){
    if (db){
     db.collection("bookclub_users").find({'username' : request.session.user}).toArray().then(user => {
              var data = user
              //data
                console.log(user)
                response.render('settings', { data : JSON.stringify(data) });
            });
    }
    
    if (err) {
     console.log("did not connect to " + url)
    }
  })
  //response.render('settings', { data : JSON.stringify(data) });
});

app.post("/settings", function (request, response) {
  console.log(request.body)  
  
    MongoClient.connect(url, function(err, db){
    if (db){
     db.collection("bookclub_users").update({"username": request.session.user}, request.body)
    }
    
    if (err) {
     console.log("did not connect to " + url)
    }
  })
  //response.render('settings', { data : JSON.stringify(data) });
});

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

