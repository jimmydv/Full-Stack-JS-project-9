'use strict';
module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define('Course', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title:{
      type: DataTypes.STRING,
      allowNull:false,
      validate:{
        notEmpty: {
          arg:true,
          msg:"A Course title is required"
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull:false,
      validate:{
        notEmpty: {
          msg:"A description is required"
        }
      }
    },
    estimatedTime:{
      type: DataTypes.STRING,
      allowNull:true
    },
    materialsNeeded: {
      type: DataTypes.STRING,
      allowNull:true
    }
  }, {});
  Course.associate = function(models) {
    // associations can be defined here
    Course.belongsTo(models.User, {
      foreignKey:{
        fieldName:'userId',
        allowNull:false,
        validate:{
          notEmpty: {
            arg:true,
            msg:"You must submit a 'userId' "
          }
        }
      }
    });
  };
  return Course;
};