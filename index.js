const mongoose = require('mongoose');
const express = require("express");
const passport = require('passport');
const port=3000;
const flash = require('connect-flash');
var session = require('express-session')
var LocalStrategy = require('passport-local').Strategy;
const MongoStore = require("connect-mongo");
const passportLocalMongoose = require('passport-local-mongoose').default;
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
username:String,
});
usermodel .plugin(passportLocalMongoose );
const userPass = mongoose.model('userPass', usermodel );
passport.use(userPass.createStrategy());
passport.serializeUser(userPass.serializeUser());
passport.deserializeUser(userPass.deserializeUser());
//password check
// passport.use(new LocalStrategy(
//   async function(username, password, done) {
//     try {
//       const user = await userPass.findOne({ username: username });
//       if (!user) {
//         return done(null, false, { message: "Username not found" });
//       }
//       if (user.password !== password) {
//         return done(null, false, { message: "Password is incorrect" });
//       }
//       return done(null, user); // ✅ pass user on success
//     } catch (err) {
//       return done(err);
//     }
//   }
// ));
// passport.serializeUser(function(user, done) {
//   //    console.log("serializeUser 1");
//   // console.log("Serialize ID:", user.id);
//   done(null, user.id);
// });
// //for again login
// passport.deserializeUser(async function(userID, done) {
//   try {
//     // console.log("............................................");
//     // console.log("deserializeUser 3");
//     // console.log("userID:", userID);   // session se aayi id
//     const user = await userPass.findById(userID);
//     console.log("User from database:", user);  // database se mila user
//     done(null, user);
//   } catch (err) {
//     done(err, null);
//   }
// });
// , 
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
  let username=req.user.username;
  if(req.isAuthenticated()){
 res.render("welcome.ejs",{username});
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
  const { username, password } = req.body;
  const user = await userPass.findOne({ username: username });
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
    const { username, password } = req.body;
    const newUser = new userPass({ username });
    const registeredUser = await userPass.register(newUser, password);
    req.login(registeredUser, function (err) {
      if (err) return next(err);
      return res.redirect("/profile");
    });
  } catch (err) {
  if (err.name === "UserExistsError") {
    res.send(" Username already taken, plesase login <a href='/loginform'>login<a>");
  } else {
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