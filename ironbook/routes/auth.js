const { Router } = require("express");
const router = Router();
const User = require("../models/User.model");
const bcrypt = require("bcryptjs");
const app = require("../app");
const salt = 10;

// * This is an example of what a middleware looks like
const shouldNotBeAuthenticated = (req, res, next) => {
  // * Because of the express session middleware the object req.sesssion exists
  // Here we are checking if, at any point, a property `user` was created (only happens on login)
  // IF there is a req.session.user (a logged in user) we stop execution of the controller and just immediately redirect the user to the main page
  if (req.session.user) {
    return res.redirect("/");
  }

  // IF we check that there is no user logged in, we want to let express go to the next `middleware` in the execution
  next();
};

// function renderLogin(req, res) {
//   res.render("auth/login");
// }

// router.get("/login", shouldNotBeAuthenticated, renderLogin);
/* 
👋 The async await logic of the POST /login is below this file
*/

// Retrieve Login Page
router.get("/login", (req, res) => {
  if (req.session.user) {
    return res.redirect("/");
  }
  next();
  res.render("auth/login");
});

// Retrieve Login Request
router.post("/login", shouldNotBeAuthenticated, (req, res) => {
  // retrieve username and password from whatever was sent by a POST request.
  // An example is the input data from a form
  const { username, password } = req.body;

  if (username.length < 4 || password.length < 8) {
    //   error handling
  }

  // Here we are checking if any user exists in the database, that shares the username that user inputed
  User.findOne({ username }).then((userFromDB) => {
    // userFromDB can either be null - in case there is no user - or a user object. in this case we are checking if there is no username. if there isnt, there is no reason to even try to log in the user
    if (!userFromDB) {
      // please provide a correct username
      return; //   error handle and say wrong username
    }
    // bcrypt compare takes the password that it was inputed by a user and the hashed password we have in the database and check if its the same value
    bcrypt.compare(password, userFromDB.password).then((isSamePassword) => {
      if (!isSamePassword) {
        // wrong password. try again
        //  error handle and say wrong password
        return;
      }
      // whenever we make a change to the req.session object, the cookie is set in the browser
      // by adding a user object to the req.session object, we are making sure that the user is logged in
      // req.session.user || in this case, everytime we assign something to req.session we are storing it in the memory
      // DOWN is how we LOG IN
      req.session.user = userFromDB;
      res.redirect("/");
    });
  });
});

// Retrieve Signup Page
router.get("/signup", shouldNotBeAuthenticated, (req, res) => {
  res.render("auth/signup");
});

// Retrieve Login Request
router.post("/signup", shouldNotBeAuthenticated, (req, res) => {
  console.log(req.body);
  const { username, email, password, location } = req.body;
  // In this section we are checking the strength / validity of the user's input
  if (
    email.length < 4 ||
    !email.includes("@") ||
    username.length < 5 ||
    password.length < 8 ||
    !location
  ) {
    return res.render("auth/signup", {
      errorMessage: "Please fill out everything in sight",
    });
    // send error to frontend
  }

  /* 
  Password strength validator
  */

  // Here we trying to check if there is *any* user on our database with either the same username or email
  User.findOne({ $or: [{ username }, { email }] })
    .then((foundUser) => {
      console.log("foundUser:", foundUser);
      if (foundUser) {
        res.render("auth/signup", {
          errorMessage: "Either username or email is already taken",
        });
        //  warn either option is already taken
        return;
      }

      bcrypt
        .genSalt(salt)
        .then((generatedSalt) => {
          return bcrypt.hash(password, generatedSalt);
        })
        // the above section i using the bcrypt methods to to guarantee theat the passwords are correctly encrypted
        .then((hashedPassword) => {
          return User.create({
            username,
            email,
            location,
            password: hashedPassword,
          });
          // given the hashed password we can finally create the user
        })
        .then((userCreated) => {
          console.log("userCreated:", userCreated);
          // in the line below we finally log in the user
          req.session.user = userCreated;
          // after user is created and logged in we redirect the user to the main page
          res.redirect("/");
        });
    })
    .catch((err) => {
      console.log("err:", err);
      res.render("auth/signup", { errorMessage: err.message });
    });
  //   User.find()
  //     .or([{ username }, { email }])
  //     .then((foundUser) => {
  //       console.log("foundUser:", foundUser);
  //     });
});

// router.use((req, res, next) => {
//   if (!req.session.user) {
//     return res.redirect("/auth/signup");
//   }
//   next();
// });
const checkAuth = (req, res, next) => {
  // same as previously written, this middleware checks what appensiaf a user s not logged in
  if (!req.session.user) {
    return res.redirect("/auth/signup");
  }
  next();
};
// // Handle Logout Request
router.get("/logout", checkAuth, function (req, res) {
  // This is the method on the session that is used to logout
  req.session.destroy((err) => {
    if (err) {
      // error handling
    }
    res.redirect("/");
  });
});

module.exports = router;

// router.post("/login", async (req, res) => {
//   const { username, password } = req.body;

//   if (username.length < 4 || password.length < 8) {
//     //   error handling
//   }
//   try {
//     const user = await User.findOne({ username });
//     if (!user) {
//       return;
//     }
//     const isSamePassword = await bcrypt.compare(password, user.password);
//     if (!isSamePassword) {
//       //  error handle and say wrong password
//       return;
//     }

//     res.redirect("/");
//   } catch (error) {
//     console.log(error);
//   }
// });
