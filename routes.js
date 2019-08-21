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
 
  }
}


// GET /api/users 200 - Returns the currently authenticated user

router.get('/users',authenticateUser, function (req, res, next) {
    const user = req.currentUser;

    res.json({
        id:user.id,
        firstName:user.firstName,
        lastName:user.lastName,
        emailAddress:user.emailAddress
    });
})


//POST /api/users 201 - Creates a user, sets the Location header to "/", and returns no content.

router.post('/users',[
    // firstname should not be empty
    check('firstName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "firstName"'),
    check('lastName')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "lastName"'),
    check('emailAddress')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "emailAddress"'),
    check('password')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "password"')

], async(req, res, next) => {

   // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    User.findOne({
        where:{
            emailAddress:req.body.emailAddress
        }
    })
    .then((user) => {
        if(user) {
            const err = new Error('This email already exist in the db');
            next(err);
        } else {
            const newUser = {
                firstName: req.body.firstName,
                lastName: req.body.lastName,
                emailAddress : req.body.lastName,
                password: req.body.password
            }
            newUser.password = bcryptjs.hashSync(newUser.password);
            User.create(newUser)
            .then(()=>{
                // sets the Location header to "/", and returns no content
                res.location('/').status(201).end();
            }).catch((err)=>{
                res.status(400).json(err.message);
            })
        }
    }).catch((err) => {
        res.status(400).json(err.message);
    })
  
});

//GET /api/courses 200 - Returns a list of courses (including the user that owns each course)

router.get('/courses', (req, res, next) =>{
    Course.findAll({
        raw:true
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
router.post('/courses',[
    check('title')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "title"'),
    check('description')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "description"'),
    check('userId')
    .exists({ checkNull: true, checkFalsy: true })
    .withMessage('Please provide a value for "userId"'),
    check('estimeateTime')
    .exists({ checkNull: false, checkFalsy: false }),
    check('materialsNeeded')
    .exists({ checkNull: false, checkFalsy: false })
], (req, res, next) =>{

    // Finds the validation errors in this request and wraps them in an object with handy functions
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
    Course.create(req.body)
    .then((course) => {
        res.location(`/api/courses/${course.id}`);
        res.status(201).end();
    })
})

// PUT /api/courses/:id 204 - Updates a course and returns no content
router.put('/courses/:id',authenticateUser, (req, res, next) => {
       
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
                res.status(403).json("Oops! sorry, you don't have permission to update this course");
            }
        } else{

        }
    })
        
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


