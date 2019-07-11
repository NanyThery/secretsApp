//jshint esversion:6

require('dotenv').config(); // Environment variables module. 
const bodyParser = require("body-parser");
const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs");
const encrypt = require("mongoose-encryption");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({
    extended: true
}));

app.use(bodyParser.json());

app.use(express.static(__dirname + "/public"));

//DB

mongoose.connect("mongodb://localhost:27017/userDB", {
    useNewUrlParser: true
}); //connection to DB Mongo


const userSchema = new mongoose.Schema ({
    email: String,
    password: String
});


userSchema.plugin(encrypt, {secret: process.env.SECRET, encryptedFields: ["password"]});

const User = new mongoose.model("User", userSchema);


//Routing

app.get("/", function (req, res){
 res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.post("/register", function(req, res){
    const newUser = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUser.save(function(err){
        if (!err){
            res.render("secrets");
        } else {
            console.log(err);
        }
        

    });
    
});

app.post("/login", function(req,res){
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email: username}, function (err, foundUser){
        if (err){
            console.log(err);
        } else {
            if (foundUser){
                if (foundUser.password === password){
                    res.render("secrets");
                }
            }else{
                res.render("Incorrect password");
            }
        }
    })


});

//Project


app.listen(3000, function () {
    console.log("Server started on port 3000");
});