const mongoose = require('mongoose');
const express = require("express");
const passport = require('passport');
const port=3000;
const flash = require('connect-flash');
var session = require('express-session')
var LocalStrategy = require('passport-local').Strategy;
const MongoStore = require("connect-mongo");
const passportLocalMongoose = require('passport-local-mongoose').default;
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
//const passport = require("passport");
let path=require("path");
const app = express();
app.use(flash());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Sets the 'views' directory to a specific path
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs'); // or , 'handlebars', etc.

// -------- Session Setup --------
app.use(session({
  secret: "keyboard cat",
  resave: false,
  saveUninitialized: false,
   store: MongoStore.create({
        mongoUrl: "mongodb://127.0.0.1:27017/mydb",
        collectionName: "sessions"
    }),
  cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 } // 3 days
}));
app.use(passport.initialize());
app.use(passport.session());

//mongose connection
mongoose.connect("mongodb://127.0.0.1:27017/mydb").then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

const usermodel = new mongoose.Schema({
email:String,
password: String,   // ✅ MUST HAVE
  otp: String,
  otpExpiry: Date
});
usermodel.plugin(passportLocalMongoose, {
  usernameField: 'email'
});
const userPass = mongoose.model('userPass', usermodel );
passport.use(userPass.createStrategy());
passport.serializeUser(userPass.serializeUser());
passport.deserializeUser(userPass.deserializeUser());

app.get("/",(req,res)=>{
  if(req.isAuthenticated()){
    res.redirect("/profile");
  }else{
res.redirect("/loginform");
}
}
);
app.get("/profile",(req,res)=>{
  console.log("Cookies:", req.headers.cookie);
  console.log("Session ID:", req.sessionID);
  console.log("User:", req.user);
  let email=req.user.email;
  if(req.isAuthenticated()){
 res.render("welcome.ejs",{email});
  }else{
    res.redirect("/loginform");
  }
});
// login page
app.get("/loginform",(req,res)=>{
    const errorMessage = req.flash('error'); 
 res.render("index.ejs",{ error: errorMessage[0] })
});

app.post('/login', async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userPass.findOne({ email });
  console.log(user);
  //  Username not found
  if (!user) {
    req.flash('error', "User not found ");
    return res.redirect('/loginform');}
  // 👉 Ab password check karne ke liye authenticate use karo
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    //  Password wrong
    if (!user) {
      req.flash('error', "Wrong password ");
      return res.redirect('/loginform');
    }
    req.login(user, (err) => {
      if (err) return next(err);
      return res.redirect('/profile');
    });

  })(req, res, next);
});

app.get("/signform",(req,res)=>{
  res.render("sign.ejs");
})
app.post("/singup", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(email,password);
    const newUser = new userPass({email });
    const registeredUser = await userPass.register(newUser, password);
    req.login(registeredUser, function (err) {
      if (err) return next(err);
      return res.redirect("/profile");
    });
  } catch (err) {
  if (err.name === "UserExistsError") {
    res.send(" Username already taken, plesase login <a href='/loginform'>login<a>");
  } else {
    console.log(err);
    res.send("Something went wrong");
  }
}
});
app.get("/logout", (req, res, next) => {
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect("/loginform"); // or home page
  });
});
//forget password
app.get("/forgetPassword",(req,res)=>{
  res.render("./forgetPassword");
})
// otp generater
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000);
  }
app.post("/forgetPassword",async (req,res)=>{
  let {email}=req.body;
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",   // ✅ correct
    port: 465,
    secure: true,
    auth: {
      user: "amanpatel64907@gmail.com",
      pass: "vorz qxrw xamj ijsl"
    }
  });

  let otp=generateOTP();

const user = await userPass.findOneAndUpdate( {  email },{
    otp: otp,
    otpExpiry: Date.now() + 5 * 60 * 1000
  },
  { new: true }
);
  if (!user) {
      req.flash('error', "Wrong password ");
      return res.redirect('/loginform');
    }
  const mailOptions = {
     from: "amanpatel64907@gmail.com",
    to: email,
    subject: "otp generate email",
    text: `OPT FOR PASSWORD RESET IS ${otp } `
  };
  
  transporter.sendMail(mailOptions, (err, info) => {
    if (err) console.log("Error:", err);
    else console.log("Email sent:", info.response);
  });
  res.render("./otpEnter",{email});
})
app.post("/otpCheck",async(req,res)=>{
let {otp,email}=req.body;
let user= await userPass.findOne({email});
console.log(otp,email,user);
let userotp=user.otp;
if (user.otp == otp && user.otpExpiry > Date.now()) {
 res.render("./passwored",{email})
}else{
 res.render("./otpEnter",{email,error:"otp is incorrect please enter correct otp"});
}
})
app.post("/passwordUpadte",async(req,res)=>{
  let{email,password1}=req.body;
   // 🔐 hash new password
try {
    const user = await userPass.findOne({ email });
    if (!user) {
      return res.render("./passwored", { email, error: "User not found" });
    }
    // 🔥 correct way (passport-local-mongoose)
    await user.setPassword(password1);
    await user.save();
       res.render("index.ejs",{success:"password is reset please login"})
  } catch (err) {
    console.log(err);
    res.send("Error updating password");
  }})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})











// app.post("/login",(req,res)=>{
//   passport.authenticate('local', (err, user, info) => {
//      if (err) res.send(err);  
//          if (info) {
//       // `info.message` comes from LocalStrategy
//       return res.send(`<h3>Login failed: ${info.message}</h3>
//         <a href="/loginform">Try again</a>`);
//     }
//   })
// //   let{username,password}=req.body;
// //   console.log(username,password );
// // const kitty = new  userPass({ username,
// // password });
// // kitty.save().then(() => console.log('meow'));
// // res.send("login");
// //    console.log("Login success 2");
//   res.redirect("/profile");
// })