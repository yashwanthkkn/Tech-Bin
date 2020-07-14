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

// SETTING UP THE VIEW ENGINE
app.set("view engine","ejs");

// TO ENABLE BODY PARSING
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extented:true}));

// CONNECTING THE DATABASE TO THE SERVER
mongoose.connect('mongodb://localhost/PaytrexDb', {
	
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex:true

});

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

// FUNCTIONS

function displayData(){
	console.log("NO. of users logged in : ",LoggedInUser);
}

function jwtVerify(token){
	var flag = 0;
	jwt.verify(token,KEY,function(err,token){
		if(err){
			console.log(err);
		}else{
			console.log(token);
			flag = 1;
		}
	})
	return flag;
}

// ROUTES

// app.get("/",(req,res)=>{
// 	res.send("Home");
// });


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
				LoggedInUser++;
				displayData();		
			}		  
		})
	}else{
		res.status(401).send({'Message':"Invalid credentials"});
	}
});



// REGISTER ROUTE

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
									LoggedInUser++;
									displayData();		
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

app.get("/addOffer",(req,res)=>{
	res.render("addOffer");
})

app.post("/addOffer",(req,res)=>{
	var offer = new Offer( {
		name:req.body.name,
		desc:req.body.desc,
		loc:req.body.loc,
		code:req.body.code
	})
	offer.save();
	res.redirect("addOffer");
})

app.post("/getOffers",(req,res)=>{
	console.log(req.body);
	if(jwtVerify(req.body.token) == 1){
		Offer.find({},(err,offers)=>{
		res.status(200).send({"message":"Success",offers:offers});
	})
	}else{
		res.status(400).send({'Message':"Invalid request"});		
	}
	
})

app.listen(3000,()=>{
	console.log("Server started");
})

