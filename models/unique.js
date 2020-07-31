var mongoose = require("mongoose");
 


// DEFINING THE SCHEMA
const UniqueSchema = new mongoose.Schema({
	username:String,
	data:{
	  trashCount:Number,
 	  trashWeight:Number,
  	  credits:Number
    },
    history:[],
	name: String,
  	dateOfBirth:String,
  	gender:String,
	sec:Boolean,
	chals:[],
	ntfy:[]
});


// EXPORTING THE MODULE OBJECT
module.exports = mongoose.model("Unique",UniqueSchema);
