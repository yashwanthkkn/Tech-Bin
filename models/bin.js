var mongoose = require("mongoose");
 


// DEFINING THE SCHEMA
const BinSchema = new mongoose.Schema({
	name:String,
	totalWeight:Number,
	owner:String,
	scans:Number,
	owned:false
});


// EXPORTING THE MODULE OBJECT
module.exports = mongoose.model("Bin",BinSchema);
