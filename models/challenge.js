var mongoose = require("mongoose");
 


// DEFINING THE SCHEMA
const ChallengeSchema = new mongoose.Schema({
	code:String,
	totalWeight:Number,
	owner:String,
	parts:[],
	date:Date,
	points:Number,
	state:Boolean
});


// EXPORTING THE MODULE OBJECT
module.exports = mongoose.model("Challenge",ChallengeSchema);
