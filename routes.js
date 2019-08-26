'use strict';

const express = require('express');
const router = express.Router();
const morgan = require('morgan');
const { check, validationResult } = require('express-validator');
const bcryptjs = require('bcryptjs');
const auth = require('basic-auth');
const User = require("./models").User;
const Course = require("./models").Course;
const bodyParser = require('body-parser');
const Sequelize = require('sequelize');


// parse application/x-www-form-urlencoded
router.use(bodyParser.urlencoded({ extended: false }))
 
// parse application/json
router.use(bodyParser.json())
// User authentication
const authenticateUser = (req, res, next) => {
    let message  =null;
    
  // Get the user's credentials from the Authorization header.
  const credentials = auth(req);
  if(credentials){
    // Look for a user whose `emailAddress` matches the credentials `name` property.
   User.findOne({
        where:{
            emailAddress: credentials.name
        }
    })
    .then((user)=>{
        if (user) {
            const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
            if (authenticated) {
              console.log(`Authentication successful for email Address: ${user.emailAddress}`);
      
              // Store the user on the Request object.
              req.currentUser = user;
              next();
            } else {
             const err = new Error(`Authentication failure for email Address: ${user.emailAddress}`);
                err.status = 401
              next(err);
            }
          } else {
          const err = new Err(`User not found for email Address: ${credentials.name}`);
           err.status=401
           next(err);
          }
    })
 
  }else{
     const err= new Error("Please provide a valid email address and password");
      err.status =401;
      next(err);
  }
}


// GET /api/users 200 - Returns the currently authenticated user

router.get('/users',authenticateUser, function (req, res, next) {
    const user = req.currentUser;

    res.json({
        id:user.id,
        firstName:user.firstName,
        lastName:user.lastName,
        emailAddress:user.emailAddress,
        password:user.password
    });
})


//POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content.

router.post('/users', [
    check('firstName')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "firstName"'),
    check('lastName')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "emailAddress"'),
    check('password')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "password"')
], async(req, res, next) => {
     // Attempt to get the validation result from the Request object.
  const errors = validationResult(req);

  // If there are validation errors...
  if (!errors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);

    // Return the validation errors to the client.
    res.status(400).json({ errors: errorMessages });
  } else{
    // test if proper email format is being used.
    var regexEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;

    if(regexEmail.test(req.body.emailAddress)){
        
       req.body.password =await bcryptjs.hashSync(req.body.password);
        console.log(req.body.password);
        User.create(req.body)
            .then(()=>{
                //  sets the Location header to "/", and returns no content
                res.location('/').status(201).end();
            }).catch((err)=>{
                console.log(err.message);
                res.status(400).json(err.message);
            })
    }else{
        const err = new Error("Invalid email format");
        err.status= 400;
        next(err);
    }
  }
           
});

//GET /api/courses 200 - Returns a list of courses (including the user that owns each course)

router.get('/courses', (req, res, next) =>{
    Course.findAll({
        attributes:['id','title', 'description','estimatedTime', 'materialsNeeded', 'userId'],
        include: [{
            model:User,
            attributes: ['id', 'firstName', 'lastName', 'emailAddress']
        }]
    })
    .then((courses)=>{
        res.status(200).json(courses);
    })

})

//GET /api/courses/:id 200 - Returns a the course (including the user that owns the course) for the provided course ID
router.get('/courses/:id', (req, res, next) =>{
    Course.findOne({
        where:{
            id:req.params.id
        },
        attributes:['id','title', 'description','estimatedTime', 'materialsNeeded', 'userId'],
        include: [{
            model:User,
            attributes: ['id', 'firstName', 'lastName', 'emailAddress']
        }]
    }).then((course) =>{
        if(course){
            res.status(200).json({course});
        } else{
            const err = new Error(`Could not find a course that matches the id: ${req.params.id}`);
            err.status=400;
            next(err);
        }
    })
})

//POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/courses',authenticateUser, [
    check('title')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "title"'),
    check('description')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "description"')
], (req, res, next) =>{
  // Attempt to get the validation result from the Request object.
  const errors = validationResult(req);

  // If there are validation errors...
  if (!errors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);

    // Return the validation errors to the client.
    res.status(400).json({ errors: errorMessages });
  } else{
    // Finds the validation errors in this request and wraps them in an object with handy functions
  
    Course.create(req.body)
    .then((course) => {
        res.location(`/api/courses/${course.id}`);
        res.status(201).end();
    }).catch((err) =>{
        console.log(err.message)
        err.status = 400;
        next(err);
    });
  }

})

// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put('/courses/:id',authenticateUser, [
    check('title')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "title"'),
    check('title')
    .exists({checkNull:true, checkFalsy:true})
    .withMessage('Please provide a value for "title"'),
], (req, res, next) => {
    // if (JSON.stringify(req.body) === '{}') {
    //     console.log('No data was submitted');
    //     const err = new Error("The body of your request constains no data");
    //     err.status = 400;
    //     throw err;
    //   }

    // Attempt to get the validation result from the Request object.
  const errors = validationResult(req);

  // If there are validation errors...
  if (!errors.isEmpty()) {
    // Use the Array `map()` method to get a list of error messages.
    const errorMessages = errors.array().map(error => error.msg);

    // Return the validation errors to the client.
    res.status(400).json({ errors: errorMessages });
  } else{
    const user = req.currentUser;
    Course.findOne({
        where:{
            id:req.params.id
        }
    })
    .then((course)=>{
        if(course){
            if(user.id=== course.userId){
                course.update(req.body);
                res.status(204).end()
            } else{
                const err = new Error("Oops! sorry, you don't have permission to update this course");
                err.status= 401;
                next();
            }
        }
    })
    .catch((err) =>{
        err.status = 400;
        next(err);
    })
  }
    
        
})

//DELETE /api/courses/:id 204 - Deletes a course and returns no content
router.delete('/courses/:id', authenticateUser, (req, res, next) => {
    const user = req.currentUser;
    Course.findOne({
        where:{
            id:req.params.id
        }
    })
    .then((course) => {
        if(user.id === course.userId){
            course.destroy();
            res.status(204).end();
        } else{
            res.status(403).json("Oops! sorry, you don't have permission to Delete this course");
        }
    })
})
module.exports= router;


