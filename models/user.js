'use strict';
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty: {
          arg:true,
          msg:"You must provide a value for firstName"
        }
      }
    },
    lastName:{
      type: DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty: {
          arg:true,
          msg:"You must provide a value for lastName"
        }
      }
    },
    emailAddress: {
      type: DataTypes.STRING,
      allowNull:false,
      unique:{
        args:true,
        msg:"this email is already being used"
      },
      validate:{
        notEmpty: {
          args:true,
          msg:"please an email address is required"
        }
      }
    },
    password: {
      type: DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty: {
          arg:true,
          msg:"You must provide a value for password"
        }
      }
    },
  }, {});
  User.associate = function(models) {
    // associations can be defined here
    User.hasMany(models.Course, {
      foreignKey:{
        fieldName:'userId',
        allowNull:false,
      },
    });
  };
  return User;
};