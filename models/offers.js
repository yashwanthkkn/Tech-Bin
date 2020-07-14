var mongoose = require("mongoose");
 


// DEFINING THE SCHEMA
const OfferSchema = new mongoose.Schema({
	name:String,
	desc:String,
	code:String,
	loc:String
});


// EXPORTING THE MODULE OBJECT
module.exports = mongoose.model("Offer",OfferSchema);
