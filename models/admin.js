var mongoose = require("mongoose");
 


// DEFINING THE SCHEMA
const AdminSchema = new mongoose.Schema({
	username:String,
	corp:String,
	bins:[],
	NOB:String,
});


// EXPORTING THE MODULE OBJECT
module.exports = mongoose.model("Admin",AdminSchema);
