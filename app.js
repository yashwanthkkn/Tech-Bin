// PACKAGES REQUIRED
var express               = require("express"),
    mongoose              = require("mongoose"),
    bodyparser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User                  = require("./models/user"),
	Offer                 = require("./models/offers"),
	Bin                 = require("./models/bin"),	
	Admin                 = require("./models/admin"),

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
	res.redirect("/adminLogin");
});

// @route POST /login
// @desc Authenticating user and iss a token

app.post("/login",passport.authenticate('local'),function(req,res){
		
	if(req.user){
		var id = req.user.id;
		var token = jwt.sign({id:id}, KEY);
		User.findById(req.user.id,(err,user)=>{
			if(err){
				console.log(err);
			}else{
				res.status(200).send({'name':req.user.name,
									 'creditsEarned':user.data.credits,
									 'disposedQuantity':user.data.trashWeight,
									 'usageCount':user.data.trashCount,
									 'token':token,
									 "history":user.history});	
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
									user.history = [];
									user.save();
								res.status(200).send(
									{
									 'name':req.user.name,
									 'creditsEarned':user.data.credits,
									 'disposedQuantity':user.data.trashWeight,
									 'usageCount':user.data.trashCount,
									 'token':token,
									"history":user.history});
									
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
				var hist = {
					date:req.body.date,
					credits:req.body.credits,
					trashWeight:req.body.quantity,
				}
				user.data.credits += req.body.credits;
				user.data.trashCount++;
				user.data.trashWeight+=req.body.quantity;
				user.history.push(hist);
				user.save();
				res.status(200).send({"message":"ok"});
			})
		}
		})
	}
})

// @route POST /redeemOffer
// @desc redeem an offer i.e reduce credits

app.post("/redeemOffer",(req,res)=>{
	if(jwtVerify(req.body.token)==1){
		jwt.verify(req.body.token,KEY,function(err,token){
		if(err){
			console.log(err);
		}else{
			User.findById(token.id,(err,user)=>{
				var flag = user.data.credits-req.body.credits;
				if(flag<0){	
					user.save();
					res.status(200).send({"message":"neg"});
				}else{
					user.data.credits -= req.body.credits;	
					user.save();
					res.status(200).send({"message":"ok"});
				}
			})
		}
		})
	}else{
			res.status(400).send({"message":"Invalid req"});
	}
	
})

// @route GET /logout
// @desc Logs out user

app.get('/logout', function(req, res){
  req.logout();
  res.status(200).send({"message":"logged out"});
});

/////////////////////////////////////////////A D M I N -- A L P H A///////////////////////////////////

// @route GET /adminRegister
// @desc Loads the admin register page
app.get('/adminRegister',(req,res)=>{
	res.render("adminRegister",{exists:false});
})

// @route POST /registerAdmin
// @desc Registering Bin admins
app.post("/adminRegister",(req,res)=>{
User.register(new User(
			{
				username:req.body.username,
				
			}),req.body.password,function(err,user)
		{
				if(err)
				{
					if(err.name === "UserExistsError")
					{
						res.render("adminRegister",{exists:true});
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
							
							User.findById(req.user.id,(err,user)=>{
								if(err){
									console.log(err);
								}else{
									res.redirect("/alphaConsole");						
								}		  
							})
						});
				}		
		});

})


// @route GET /adminLogin
// @desc Loads the admin login page
app.get('/adminLogin',(req,res)=>{
	res.render("adminLogin",{check:false});
})

// @route GET /adminLogin
// @desc Loads the admin login page
app.get('/adminLoginErr',(req,res)=>{
	res.render("adminLogin",{check:true});
})


// @route POST /adminLogin
// @desc Authenticating user

app.post("/adminLogin",passport.authenticate('local', { failureRedirect: '/adminLoginErr' }),function(req,res){
		
	if(req.user){
		var id = req.user.id;
		User.findById(req.user.id,(err,user)=>{
			if(err){
				console.log(err);
			}else{
				if(req.body.username == 'adminalpha'){
					res.redirect("/alphaConsole");
				}else{
					res.redirect("/adminConsole");	
				}
			}		  
		})
	}else{
		res.render("/adminLogin",{check:true});
	}
});


// @route GET /alphaConsole
// @desc renders the alpha console
app.get("/alphaConsole",(req,res)=>{
	res.render("alphaConsole");
})

// @route GET /addBin
// @desc renders the page to add new bin
app.get("/addBin",(req,res)=>{
	res.render("addBin",{exists:false,flag:""});
})

// @route POST /addBin
// @desc adds the new bin to db
app.post("/addBin",(req,res)=>{
	Bin.findOne({name:req.body.username},(err,bin)=>{
		if(err) throw err;
		if(bin){
			// Bin exists
			res.render('addBin',{exists:true,flag:""})
		}else{
			// new bin
			var newBin = new Bin({
				name:req.body.username,
				totalWeight:0,
				scans:0,
				owner:"none",
				owned:false
			});
			newBin.save();
			res.render("addBin",{exists:false,flag:'Added Successfully'})
		}
	})
})

// @route GET /addAdmin
// @desc renders the page to add admins

app.get("/addAdmin",(req,res)=>{
	res.render("addAdmin",{exists:false,flag:""});
});

// @route POST /addAdmin
// @desc register the admins

app.post("/addAdmin",(req,res)=>{

	Bin.find({},(err,bins)=>{
		if(bins.length < req.body.bins){
			res.render("addAdmin",{exists:false,flag:"Insufficient Bins"})
		}else{
			User.register(new User(
			{
				username:req.body.username,
				
			}),req.body.password,function(err,user)
			{
				if(err)
				{
					if(err.name === "UserExistsError")
					{
						res.render("addAdmin",{exists:true,flag:"User exists"});
					}
					else
					{	
						console.log(err);
						res.status(400).send({'message':'I fkd up'});
					}
				}
				else
				{	
					var admin = new Admin({
						username:req.body.username,
						corp:req.body.corp,
						NOB:req.body.bins
					});
					var temp = []
					Bin.find({owned:false},(err,bins)=>{
						for(i=0;i<req.body.bins;i++){
							temp.push(bins[i].name);
							bins[i].owned = true;
							bins[i].owner = req.body.username;
							bins[i].save();
						}	
						admin.bins = temp;
						admin.save();
						res.render('addAdmin',{flag:"Added Successfully",exists:false})
				
					})
				}		
		});
		
		}
	})
})

/////////////////////////////////////////////////////////////////////////////////////////////

// @route GET /adminConsole
// @desc renders the admin console
app.get("/adminConsole",(req,res)=>{
	res.render("adminConsole");
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

// @desc Server listening on PORT 3000

app.listen(process.env.PORT || 3000,()=>{
	console.log("Server started");
})

