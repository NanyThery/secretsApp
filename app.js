//jshint esversion:6

require('dotenv').config(); // Environment variables module. 
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const session= require ("express-session");
const passport = require ("passport");
const passportLocalMongoose= require ("passport-local-mongoose");
const GoogleStrategy = require ("passport-google-oauth20").Strategy;
const findOrCreate = require('mongoose-findorcreate');



//APP USE Express //////////////////////////////
const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

app.use(session({ // We open the session.
    secret: "secret", // this should go to the env. file
    resave: false,
    saveUninitialized: false

}));

app.use(passport.initialize()); // Inicializes Passport. I must go after the use session.
app.use(passport.session()); // Uses passport to use the session called before. 

//DB Settings////////////////////////////////

mongoose.connect("mongodb://localhost:27017/usersDB", {
    useNewUrlParser: true,
    autoIndex: false
}); //connection to DB Mongo

mongoose.set("useCreateIndex", true);



const userSchema = new mongoose.Schema ({
    email: String,
    password: String,
    googleId: String
});

userSchema.plugin (passportLocalMongoose); // allows Passport to hash and salt passwords in the DB.
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    User.findById(id, function (err, user) {
        done(err, user);
    });
});

// Google Strategy Setup for login the user //////////////////
passport.use(new GoogleStrategy({
        clientID: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        callbackURL: "http://localhost:3000/auth/google/secrets",
        userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    },
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        User.findOrCreate({
            googleId: profile.id
        }, function (err, user) {
            return cb(err, user);
        });
    }
));

//Routing

app.get("/", function (req, res){
 res.render("home");
});
app.get("/auth/google", 
passport.authenticate("google", {scope: ["profile"]})
);

app.get("/login", function (req, res) {
    res.render("login");

});

app.get("/auth/google/secrets", passport.authenticate("google", {failureRedirect:"/login"}), function (req, res) {
    res.redirect("/secrets");

});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {
    if(req.isAuthenticated()){
    res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

app.get("/logout", function(req,res){
req.logout();
res.redirect("/");
});
 
app.post("/register", function(req, res){
 User.register({username: req.body.username}, req.body.password,  function (err, user){
     if (err) {
         console.log(err);
        res.redirect("/register");
     } else {
         passport.authenticate("local") (req, res, function() {
             res.redirect("/secrets");
         });
     }
 });// This method comes from the Mongoose Passport.


});

app.post("/login", function(req,res){
const user = new User ({
    username: req.body.username,
    password: req.body.password
});

req.login(user, function (err){
    if (err){
        console.log (err);

    }else{
        passport.authenticate("local") (req, res, function() {
            res.redirect("/secrets");
        });
    }
        
});
    
});


//Project


app.listen(3000, function () {
    console.log("Server started on port 3000");
});