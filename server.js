var cheerio = require("cheerio");
var express = require("express");
var axios = require("axios");
var mongoose = require("mongoose");
var logger = require("morgan");
var db = require("./models")

var PORT = 3000;

var app = express();
// var databaseUrl = "scraper";  //DO I NEED THIS IF I USE MONGOOSE?
// var collections = ["scrapedData"];

app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

mongoose.connect("mongodb://localhost/timesData", { useNewUrlParser: true });

app.get("/scrape", function (req, res) {
  axios.get("https://old.reddit.com/r/apple/").then(function (response) {

    var $ = cheerio.load(response.data);

    $("p.title").each(function (i, element) {

      var results = {};
      
      results.link2 = $("li.first").find("href")
      results.title = $(this).text();
      results.link = $(this).children().attr("href");
      // var title = $(element).text();
      // var link = $(element).children().attr("href")

      db.Article.create(results)
        .then(function (dbArticle) {
          console.log(dbArticle);
        })
        .catch(function (err) {
          console.log(err);
        })

      // results.push({
      //   title: title,
      //   link: link
      // });
    });
    console.log(results)

    res.send("Scrape Complete!!")
   
  });
});

app.get("/articles", function(req, res) {
  db.Article.find({})
  .then(function(dbArticle) {
    res.json(dbArticle);
  })
  .catch(function(err) {
    res.json(err);
  });
});

app.get("/articles/:id", function(req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("note")
    .then(function(dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {
  // Create a new note and pass the req.body to the entry
  db.Note.create(req.body)
    .then(function(dbNote) {
      // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
      // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
      // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});