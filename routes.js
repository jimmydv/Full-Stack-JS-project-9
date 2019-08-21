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
    const user = User.findOne({
        where:{
            emailAddress: credentials.name
        }
    })
    .then((user, err)=>{
        if (user) {
            const authenticated = bcryptjs.compareSync(credentials.pass, user.password);
            if (authenticated) {
              console.log(`Authentication successful for email Address: ${user.emailAddress}`);
      
              // Store the user on the Request object.
              req.currentUser = user;
              next();
            } else {
              err = new Error(`Authentication failure for email Address: ${user.emailAddress}`);
                err.status = 401
              next(err);
            }
          } else {
           err = new Err(`User not found for email Address: ${credentials.name}`);
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


router.post('/users', (req, res, next) => {
    // Check if req.body is empty and return and error
    if(JSON.stringify(req.body)=== '{}'){
        console.log('req body is an empty object');
        const err = new Error;
        err.status= 400;
        err.message = 'You must submit user values'
        throw errr;
    }
    // create new user
    // hash new user's password
    req.body.password =  bcryptjs.hashSync( req.body.password);
    //create new user adding newUser to user table 
    User.create(req.body)
    .then(() =>{
        // sets the Location header to "/", and returns no content
        res.location('/');
        res.status(201).end();
    })
    // Catch sequlize error and log the message for the API user
    .catch(Sequelize.ValidationError,(err) =>{
        console.log(Sequelize.validationResult);
        if(err.name=="SequelizeValidationError"){
            res.status(400).json(err);
        }else{
            throw err;
        }
    })
    .catch((err)=>{
        res.status(400).json(err);
    })
})

// GET /api/courses 200 - Returns a list of courses (including the user that owns each course)

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
        attributes:{
            include:['']
        },
        include:[{
            model:User,
            attributes:['id', 'firstName', 'lastName', 'emailAddress']
        }]
    })
    .then((course)=>{
        if(course){
            res.status(200).json({course});
        } else{
            //throw an error if no course id matches the id in the req.params
            const err = new Error(`No course found with this id: ${req.params.id}`);
            err.status= 400;
            next(err);
        }
    }).catch(err=>{
        res.status(400).json(err.message);
    });
})

//POST /api/courses 201 - Creates a course, sets the Location header to the URI for the course, and returns no content
router.post('/courses', (req, res, next) =>{
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


