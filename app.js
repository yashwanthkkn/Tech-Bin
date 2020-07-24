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
	Unique                 = require("./models/unique"),

	jwt = require("jsonwebtoken");
var AWS = require("aws-sdk");
const multer = require('multer');
const multerS3 = require('multer-s3');

var LoggedInUser = 0;  
var app = express();
var KEY = "SOmeRanDOmeSbnbfsjhbdfjsbdjkb839827428397482798%^%&^^&%&^%&^?>?/jhskjdhfkjskh";


AWS.config.region = 'ap-south-1'; // Region
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'ap-south-1:bdc6bae3-952d-4a50-b94e-fabd18a34d9d',
});

AWS.config.update({
    accessKeyId : "AKIAQKY2NO7W7L2ANNHI",
 secretAccessKey : "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",
    region:"ap-south-1"
});



const rekognition = new AWS.Rekognition()




var BucketName = "bucketforsbml";


const s3 = new AWS.S3({
  accessKeyId: 'AKIAQKY2NO7W7UFWM6XI',
  secretAccessKey: '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',
  Bucket: BucketName,
  apiVersion: '2006-03-01'
 });


const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type, only JPEG and PNG is allowed!'), false);
    }
  }
  
  const upload = multer({
    // fileFilter,
    storage: multerS3({
      acl: 'public-read',
      s3:s3,
      bucket: BucketName,
      contentType: multerS3.AUTO_CONTENT_TYPE,
      metadata: function (req, file, cb) {
        cb(null, {fieldName: 'TESTING_METADATA'});
      },
      key: function (req, file, cb) {
        cb(null, Date.now().toString())
      }
    })
  });

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

// // CONNECTING THE DATABASE TO THE SERVER
// mongoose.connect('mongodb://localhost/PaytrexDb', {
	
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false,
//   useCreateIndex:true

// });

mongoose.connect('mongodb+srv://user:nN6JAsww5cMup1Ai@cluster0-f0akj.mongodb.net/SbDb?retryWrites=true&w=majority', {
	
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
  useCreateIndex:true

});

///////////////////////////////////////--- FUNCTIONS ---/////////////////////////////////////////

function jwtVerify(token){

	return 1;
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
		Unique.findOne({username:req.body.username},(err,user)=>{
			if(err){
				console.log(err);
			}else{
				res.status(200).send({user:user,token:token});	
			}		  
		})
	}else{
		res.status(401).send({'Message':"Invalid credentials"});
	}
});


 app.post("/test",(req,res)=>{
	 res.send(req.body);
 })

// @route POST /register
// @desc Adding new user to db and Authenticating
// @params name - username - password - gender - dateOfBirth
app.post("/register",function(req,res)
{
		User.register(new User(
			{
				username:req.body.username
				
			}),req.body.password,function(err,user)
		{
				if(err)
				{
					if(err.name === "UserExistsError")
					{
						res.status(401).send({"message":"exists"})
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
							Unique.findOne({username:req.body.username},(err,user)=>{
								if(err){
									console.log(err);
								}else{
									user.name = req.body.name;
									user.gender = req.body.gender;
									user.dateOfBirth = req.body.dateOfBirth;
									user.save();
									res.status(200).send({user:user,token:token});
									
								}		  
							})
						});
				}		
		});
});

////////////////////////////////////////////////////////////////////////////////////////

// @route POST /checkUser
// @desc checks if the User exists
// @params username
app.post("/checkUser",(req,res)=>{
		Unique.find({username:req.body.username},(err,user)=>{
			if(err){
				console.log(err);
			}else{
					if(user.length){
						res.status(201).send({"message":"exists"});
					}else{
						res.status(201).send({"message":"not exists"});
					}
			}
		})
})



// @route POST /logUnique
// @desc creates a new account if not exists
// @params username

app.post("/logUnique",(req,res)=>{
		Unique.find({username:req.body.username},(err,unique)=>{
			if(err){
				console.log(err);
			}else{
					if(unique.length){
						res.status(201).send({"message":"exists",user:unique[0]});
					}else{
						var unq = new Unique({
							username:req.body.username,
							data:{
	 							  trashCount:0,
								  trashWeight:0,
								  credits:0
								}
						});
						unq.save();
						res.status(201).send({"message":"not exists",user:unq});
					}
			}
		})
})

// app.post("/logUnique",upload.single("image"),(req,res)=>{
// 	var params = {
//       Image:{
//           S3Object:{
//               Bucket:"bucketforsbml",
//               Name:req.file.key
//           }
//       },
//       Filters: {
//         RegionsOfInterest: [
//           {
//             BoundingBox: {
//               Height: 0.5,
//               Left: 0.2,
//               Top: 0.4,
//               Width: 1.0
//             }
          
//           },
//         ],
//         WordFilter: {
//           // MinBoundingBoxHeight: 'NUMBER_VALUE',
//           // MinBoundingBoxWidth: 'NUMBER_VALUE',
//           MinConfidence: 0.9
//         }
//       }
//   };
  
//   rekognition.detectText(params,(err,data)=>{
//       if(err){
//           console.log(err);
//       }else{
//         var test = [];
//         data.TextDetections.forEach((x)=>{
//           if(x.DetectedText.length == 14 && x.Confidence > 95.00){
//             test.push(x.DetectedText);
//           }
//         })
// 		Unique.find({username:test[0]},(err,unique)=>{
// 			if(err){
// 				console.log(err);
// 			}else{
// 					if(unique.length){
// 						res.status(201).send({"message":"exists",user:unique[0]});
// 					}else{
// 						var unq = new Unique({
// 							username:test[0],
// 							data:{
// 	 							  trashCount:0,
// 								  trashWeight:0,
// 								  credits:0
// 								}
// 						});
// 						unq.save();
// 						res.status(201).send({"message":"not exists",user:unq});
// 					}
// 			}
// 		})
//       }
//   })
		
// })


// @route POST /updateUnique
// @desc updates the unique id user
// @params date , credits , trashWeight , sid , bid , username
app.post("/updateUnique",(req,res)=>{
			Unique.findOne({username:req.body.username},(err,unique)=>{
			if(err){
				console.log(err);
				res.status(200).send({"message":"fail"});
			}else{
				Bin.findOne({name:req.body.bid},(err,bin)=>{
					if(err){
						console.log(err);
					}else{
						bin.totalWeight += Number(req.body.trashWeight);		
						bin.scans++;
						var hist = {
							date:req.body.date,
							credits:req.body.credits,
							trashWeight:req.body.trashWeight,
							sid:req.body.sid,
							bid:req.body.bid
						}
						unique.history.push(hist);
						unique.data.trashWeight+=Number(req.body.trashWeight);
						unique.data.trashCount++;
						unique.data.credits+=Number(req.body.credits);
						bin.save();
						unique.save();
						res.status(200).send({"message":"end",user:unique});
					}
				})
			}
		})
})

app.post("/home",(req,res)=>{
	
	if(jwtVerify(req.body.token) == 1){
		res.status(200).send({'Message':"Token verified..Works"});
	}else{
		res.status(400).send({'Message':"Invalid request"});		
	}
})



app.post("/getType",upload.single("image"),(req,res)=>{
	if(jwtVerify(req.body.token) == 1){
		var params = {
						Image:{
						  S3Object:{
							  Bucket:"bucketforsbml",
							  Name:req.file.key
						  }
						},
						MaxLabels:1,
						MinConfidence:80
					};
  	rekognition.detectLabels(params,(err,data)=>{
      if(err){
          console.log(err);
      }else{
		  console.log(data);
		  res.status(200).send(data);
      }
  	})
		
 	}else{
		res.status(400).send({'Message':"Invalid request"});		
	}
});

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
  res.redirect('/adminLogin');
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
					res.redirect("/adminConsole/"+req.user.username);	
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
	Bin.find({},(err,bins)=>{
		if(err) throw err;
		else{
			Admin.find({},(err,admins)=>{
				if(err) throw err;
				else{
					var avail = []
					var unavail = []
					bins.forEach((x)=>{
						if(x.owned){
							unavail.push(x);
						}else{
							avail.push(x);
						}
					})
					res.render("alphaConsole",{bins:bins,admins:admins,avail:avail,unavail:unavail});				
				}
			})
		}
	})
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
		var avail=[];
		bins.forEach((bin)=>{
			if(!bin.owned){
				avail.push(bin);
			}
		})
		if(avail.length < req.body.bins){
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
						res.render("addAdmin",{exists:true,flag:""});
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

//////////////////////////////////////////  -- ADMIN BETA -- ///////////////////////////////////////////////////////

// @route GET /adminConsole
// @desc renders the admin console
app.get("/adminConsole/:name",(req,res)=>{
	Admin.findOne({username:req.params.name},(err,admin)=>{
		if(err) throw err;
		else{
			Bin.find({owner:req.params.name},(err,bins)=>{
				if(err) throw err;
				else{
					Offer.find({owner:req.params.name},(err,offers)=>{
						if(err) throw err;
						else{
					         res.render("adminConsole",{name:req.params.name,admin:admin,bins:bins,offers:offers});			
						}
					})
				}
				
			})
		}
	})
	
})


// @route GET /addOffer
// @desc renders the page to add new offers

app.get("/addOffer/:name",(req,res)=>{
	res.render("addOffer",{name:req.params.name,flag:""});
})

// @route GET /addOfferS
// @desc renders the page to add new offers

app.get("/addOfferS/:name",(req,res)=>{
	res.render("addOffer",{name:req.params.name,flag:"Added Successfully"});
})


// @route POST /addOffer
// @desc Adds the new offer to db

app.post("/addOffer/:name",(req,res)=>{
	Admin.findOne({username:req.params.name},(err,admin)=>{
		if(err) throw err;
		else{
				var offer = new Offer( {
				name:req.body.name,
				desc:req.body.desc,
				loc:req.body.loc,
				code:req.body.code,
				req:req.body.req,
				owner:req.params.name
				})
		offer.save();
		res.redirect("/addOfferS/"+req.params.name);			
		}
	})

})

// @route GET /deleteOffer
// @desc renders the page to delete a delete offer 

app.get("/deleteOffer/:name",(req,res)=>{
	res.render("deleteOffer",{name:req.params.name,flag:""});
})


// @route GET /deleteOfferS
// @desc renders the page to delete a delete offer 

app.get("/deleteOfferS/:name",(req,res)=>{
	res.render("deleteOffer",{name:req.params.name,flag:"Successfully deleted the offer"});
})

// @route POST /deleteOffer
// @desc removing from the db 
app.post("/deleteOffer/:name",(req,res)=>{
	Offer.findOneAndRemove({code:req.body.code},(err,offer)=>{
		if(err){
			console.log(err)
		}else{
			res.redirect("/deleteOfferS/"+req.params.name);
		}
	})
})

// @desc Server listening on PORT 3000

app.listen(process.env.PORT || 3000,()=>{
	console.log("Server started");
})

