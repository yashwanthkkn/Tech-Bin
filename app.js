// PACKAGES REQUIRED
var express               = require("express"),
    mongoose              = require("mongoose"),
    bodyparser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User                  = require("./models/user"),
	Offer                 = require("./models/offers"),
	jwt = require("jsonwebtoken");

var LoggedInUser = 0;  
var app = express();
var KEY = "SOmeRanDOmeSbnbfsjhbdfjsbdjkb839827428397482798%^%&^^&%&^%&^?>?/jhskjdhfkjskh";


// MIDDLEWARES

app.use(require("express-session")({
	secret : "ThisIsNotMy Random_Salt",
	resave : false,
	saveUninitialized : false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extented:true}));

// SETTING UP THE VIEW ENGINE
app.set("view engine","ejs");

// CONNECTING THE DATABASE TO THE SERVER
mongoose.connect('mongodb://localhost/PaytrexDb', {
	
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex:true

});


///////////////////////////////////////--- FUNCTIONS ---/////////////////////////////////////////

function jwtVerify(token){
	var flag = 0;
	jwt.verify(token,KEY,function(err,token){
		if(err){
			console.log(err);
		}else{
			flag = 1;
		}
	})
	return flag;
}

///////////////////////////////// ROUTES/////////////////////////////////////

// @route GET /
// @desc testing

app.get("/",(req,res)=>{
	res.send("Home");
});

// @route POST /login
// @desc Authenticating user and iss a token

app.post("/login",passport.authenticate('local'),function(req,res){
		
	if(req.user){
		var id = req.user.id;
		var token = jwt.sign({id:id}, KEY);
		console.log("Logged : ",req.user.id);
		User.findById(req.user.id,(err,user)=>{
			if(err){
				console.log(err);
			}else{
				res.status(200).send({'name':req.user.name,
									 'creditsEarned':user.data.credits,
									 'disposedQuantity':user.data.trashWeight,
									 'usageCount':user.data.trashCount,
									 'token':token});	
			}		  
		})
	}else{
		res.status(401).send({'Message':"Invalid credentials"});
	}
});

// @route POST /register
// @desc Adding new user to db and Authenticating

app.post("/register",function(req,res)
{
		User.register(new User(
			{
				name:req.body.name,
				dateOfBirth:req.body.dateOfBirth,
				gender:req.body.gender,
				username:req.body.username,
				
			}),req.body.password,function(err,user)
		{
				if(err)
				{
					if(err.name === "UserExistsError")
					{
						res.status(401).send({'message':'account exists'});
					}
					else
					{	
						console.log(err);
						res.status(400).send({'message':'I fkd up'});
					}
				}
				else
				{	
						passport.authenticate("local")(req,res,function(){
							
							var id = req.user.id;
							var token = jwt.sign({id:id}, KEY);
							User.findById(req.user.id,(err,user)=>{
								if(err){
									console.log(err);
								}else{
									user.data.trashCount = 0;
									user.data.trashWeight= 0;
									user.data.credits = 0;
									user.save();
								res.status(200).send(
									{
									 'name':req.user.name,
									 'creditsEarned':user.data.credits,
									 'disposedQuantity':user.data.trashWeight,
									 'usageCount':user.data.trashCount,
									 'token':token});
									
								}		  
							})
						});
				}		
		});
});

app.post("/home",(req,res)=>{
	
	if(jwtVerify(req.body.token) == 1){
		res.status(200).send({'Message':"Token verified..Works"});
	}else{
		res.status(400).send({'Message':"Invalid request"});		
	}
})

// @route GET /addOffer
// @desc renders the page to add new offers

app.get("/addOffer",(req,res)=>{
	res.render("addOffer");
})

// @route POST /addOffer
// @desc Adds the new offer to db

app.post("/addOffer",(req,res)=>{
	var offer = new Offer( {
		name:req.body.name,
		desc:req.body.desc,
		loc:req.body.loc,
		code:req.body.code,
		req:req.body.req
	})
	offer.save();
	res.redirect("addOffer");
})

// @route GET /deleteOffer
// @desc renders the page to delete a delete offer 

app.get("/deleteOffer",(req,res)=>{
	res.render("deleteOffer");
})

// @route POST /deleteOffer
// @desc removing from the db 
app.post("/deleteOffer",(req,res)=>{
	Offer.findOneAndRemove({code:req.body.code},(err,offer)=>{
		if(err){
			console.log(err)
		}else{
			res.render("deleteOffer");
		}
	})
})

// @route POST /getOffers
// @desc Returns All existing offers

app.post("/getOffers",(req,res)=>{
	if(jwtVerify(req.body.token) == 1){
		Offer.find({},(err,offers)=>{
		res.status(200).send({"message":"Success",offers:offers});
	})
	}else{
		res.status(400).send({'Message':"Invalid request"});		
	}
	
})

// @route POST /updateData
// @desc Updating the User data

app.post("/updateData",(req,res)=>{
	if(jwtVerify(req.body.token)==1){
		jwt.verify(req.body.token,KEY,function(err,token){
		if(err){
			console.log(err);
		}else{
			User.findById(token.id,(err,user)=>{
				user.data.credits += req.body.credits;
				user.data.trashCount++;
				user.data.trashWeight+=req.body.quantity;
				user.save();
				res.status(200).send({"message":"ok"});
			})
		}
		})
	}
})

// @route GET /logout
// @desc Logs out user

app.get('/logout', function(req, res){
  req.logout();
  res.status(200).send({"message":"logged out"});
});

// @desc Server listening on PORT 3000

app.listen(process.env.PORT || 3000,()=>{
	console.log("Server started");
})

