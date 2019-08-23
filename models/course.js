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
      validate: {
       function(title){
          if(parseInt(title)==0){
            throw new Error('The test is working')
          }
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
            msg:"You must submit a 'userId' "
          }
        }
      }
    });
  };
  return Course;
};