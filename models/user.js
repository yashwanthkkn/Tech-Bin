var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose"); 


// DEFINING THE SCHEMA
const UserSchema = new mongoose.Schema({
  name: String,
  dateOfBirth:String,
  gender:String,
  username: String,
  password: String,
  data:{
	  trashCount:Number,
 	  trashWeight:Number,
  	  credits:Number
  }
});

UserSchema.plugin(passportLocalMongoose);
// EXPORTING THE MODULE OBJECT
module.exports = mongoose.model("User",UserSchema);
