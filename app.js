// PACKAGES REQUIRED
var express               = require("express"),
    mongoose              = require("mongoose"),
    bodyparser            = require("body-parser"),
    passport              = require("passport"),
    LocalStrategy         = require("passport-local"),
    passportLocalMongoose = require("passport-local-mongoose"),
    User                  = require("./models/user"),
	Offer                 = require("./models/offers"),
	Bin                   = require("./models/bin"),	
	Admin                 = require("./models/admin"),
	Unique                = require("./models/unique"),	
	Challenge                = require("./models/challenge"),
	QRCode                = require('qrcode'),
	CryptoJS              = require("crypto-js"),
	cryptoRandomString    = require('crypto-random-string');

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

function sort(temp){
	flag = 0;
	for(i=0;i<temp.length-1;i++){
		for(j=i+1;j<temp.length;j++){
			if(temp[i].totalWeight<temp[j].totalWeight){
				t = temp[i];
				temp[i]= temp[j];
				temp[j]=t;
			}
			if(i==temp.length-2){
				return temp;			
			}
		}
	}
	if(flag == 0){
		return temp
	}
	
}

var d = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
    [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
    [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
    [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
    [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
    [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
    [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
    [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
    [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
];

// permutation table p
var p = [
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
    [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
    [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
    [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
    [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
    [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
    [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
    [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
];

// inverse table inv
var inv = [0, 4, 3, 2, 1, 5, 6, 7, 8, 9];

// converts string or number to an array and inverts it
function invArray(array) {

    if (Object.prototype.toString.call(array) === "[object Number]") {
        array = String(array);
    }

    if (Object.prototype.toString.call(array) === "[object String]") {
        array = array.split("").map(Number);
    }

    return array.reverse();

}

// generates checksum
function generate(array) {

    var c = 0;
    var invertedArray = invArray(array);

    for (var i = 0; i < invertedArray.length; i++) {
        c = d[c][p[((i + 1) % 8)][invertedArray[i]]];
    }

    return inv[c];
}

// validates checksum
function validate(array) {

    var c = 0;
    var invertedArray = invArray(array);

    for (var i = 0; i < invertedArray.length; i++) {
        c = d[c][p[(i % 8)][invertedArray[i]]];
    }

    return (c === 0);
}

function check(n){
    let res="";
    for(i=0;i<n.length;i++){
        if(! (n[i]==" ")){
            res+=n[i];
        }
    }
    return validate(res);
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
	if(!check(req.body.username)){
			res.status(402).send({"message":"invalid"});
	}else{
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
	}
});


 app.post("/test",(req,res)=>{
	 res.send(req.body);
 })

// @route POST /register
// @desc Adding new user to db and Authenticating
// @params name(random name) - username - password - gender - dateOfBirth
app.post("/register",function(req,res)
		 
{		
	if(!check(req.body.username)){
			res.status(402).send({"message":"invalid"});
	}else{
		Unique.findOne({username:req.body.username},(err,uniq)=>{
			if(err) throw err;
			else if(!uniq){
				res.status(402).send({message:"noUser"})
			}else{
				User.register(new User(
					{
						username:req.body.username

					}),req.body.password,(err,user)=>{
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
									uniq.name = req.body.name;
									uniq.gender = req.body.gender;
									uniq.dateOfBirth = req.body.dateOfBirth;
									uniq.save();
									res.status(200).send({user:uniq,token:token});

								});
						}		
				});		
			}
		})
	}
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
						User.find({username:req.body.username},(err,user)=>{
							if(user.length == 0){
								res.status(201).send({"message":"signup"});		
							}	else{
								res.status(201).send({"message":"login"});
							}
						})
					}else{
						res.status(201).send({"message":"not exists"});
					}
			}
		})
})

// >>>>>>>>>>>>>>>>>>>>>>>>>> NEW <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

// @route POST /logUnique
// @desc creates a new account if not exists
// @params username

app.post("/logUnique",(req,res)=>{
	if(!check(req.body.username)){
			res.status(201).send({"message":"invalid"});
	}
	else{
		Unique.find({username:req.body.username},(err,unique)=>{
			if(err){
				console.log(err);
			}else{
					if(unique.length != 0){
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
	}
})


// // @route POST /updateUnique
// // @desc updates the unique id user
// // @params date , credits , trashWeight , sid , bid , username
// app.post("/updateUnique",(req,res)=>{
// 			Unique.findOne({username:req.body.username},(err,unique)=>{
// 			if(err){
// 				console.log(err);
// 				res.status(200).send({"message":"fail"});
// 			}else{
// 				Bin.findOne({name:req.body.bid},(err,bin)=>{
// 					if(err){
// 						console.log(err);
// 					}else if(!unique){
// 						res.status(200).send({"message":"no such user"});
// 					}else{
// 						var credits = Number(req.body.trashWeight)/2;
// 						unique.data.credits+=credits;
// 						bin.totalWeight += Number(req.body.trashWeight);		
// 						bin.scans++;
// 						var hist = {
// 							date:req.body.date,
// 							credits:credits,
// 							trashWeight:req.body.trashWeight,
// 							sid:req.body.sid,
// 							bid:req.body.bid,
// 							by:req.body.username
// 						}
// 						unique.history.push(hist);
// 						bin.history.push(hist);
// 						unique.data.trashWeight+=Number(req.body.trashWeight);
// 						unique.data.trashCount++;
// 						bin.save();
// 						unique.save();
// 						res.status(200).send({"message":"end",user:unique});
// 					}
// 				})
// 			}
// 		})
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
					}else if(!unique){
						res.status(200).send({"message":"no such user"});
					}else{
						var credits = Number(req.body.trashWeight)/2;
						unique.data.credits+=credits;
						bin.totalWeight += Number(req.body.trashWeight);		
						bin.scans++;
						var hist = {
							date:req.body.date,
							credits:credits,
							trashWeight:req.body.trashWeight,
							sid:req.body.sid,
							bid:req.body.bid,
							by:req.body.username
						}
						if(unique.chals.length!=0){
								Challenge.findOne({owner:req.body.sid},(err,chal)=>{
									if(chal){
										var temp = chal.parts;
										var i = 0;
										for(y =0;y<temp.length;y++){
											if(temp[y].username==unique.username){
												temp[y].totalWeight+=Number(req.body.trashWeight);
												temp[y].scans++;
												chal.parts = temp;
												chal.totalWeight+=Number(req.body.trashWeight);
												chal.markModified('parts');
												chal.save();
												unique.history.push(hist);
												bin.history.push(hist);
												unique.data.trashWeight+=Number(req.body.trashWeight);
												unique.data.trashCount++;
												bin.save();
												unique.save();
												res.status(200).send({"message":"end",user:unique});
												
											}
										}
									}else{
												unique.history.push(hist);
												bin.history.push(hist);
												unique.data.trashWeight+=Number(req.body.trashWeight);
												unique.data.trashCount++;
												bin.save();
												unique.save();
												res.status(200).send({"message":"end",user:unique});
										
									}
								})
						}else{
						unique.history.push(hist);
						bin.history.push(hist);
						unique.data.trashWeight+=Number(req.body.trashWeight);
						unique.data.trashCount++;
						bin.save();
						unique.save();
						res.status(200).send({"message":"end",user:unique});
						}
					}
				})
			}
		})
})

// @route POST /getUserData
// @desc returns the user data
// @params username
app.post("/getUserData",(req,res)=>{
	Unique.findOne({username:req.body.username},(err,user)=>{
		if(err) throw err;
		else if(!user){
			res.status(400).send({"message":"noUser"});
		}else{
			res.status(200).send({user:user});
		}
	})
})

// @route POST /getMyQr
// @desc creates a hash => QR for the user
// @params username
app.post("/getMyQr",(req,res)=>{
	Unique.findOne({username:req.body.username},(err,user)=>{
		if(err) throw err;
		else{
			if(!user){
				res.status(400).send("noUser");	
			}else{
			// var random = cryptoRandomString({length: 10});
			user.sec = true;	
			user.save();
			QRCode.toDataURL(req.body.username, function (err, url) {
				res.status(200).send(url);
			})
			}
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
	
});




// @route POST /redeemOffer
// @desc redeem an offer i.e reduce credits
// params username credits
app.post("/redeemOffer",(req,res)=>{
	if(jwtVerify(req.body.token)==1){
			Unique.findOne({username:req.body.username},(err,user)=>{
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
	}else{
			res.status(400).send({"message":"Invalid req"});
	}
})

// @route GET /redeemOfferAdmin
// @desc redeem an offer i.e reduce credits
// params username credits

app.get("/viewMyOffer/redeemOfferAdmin/:name/:username/:points",(req,res)=>{
	if(jwtVerify(req.params.name)==1){
			Unique.findOne({username:req.params.username},(err,user)=>{
					user.data.credits -= Number(req.params.points);	
					user.save();
					res.render("claimOffer",{name:req.params.name,flag:"Offer Successfully Redeemed",offers:[],user:null});
			})
	}else{
			res.render("claimOffer",{name:req.params.name,flag:"Oops..Try again later",offers:[],user:null});
	}
})

// @route POST /joinChallenge
// @desc allows user to join a challenge
// @params username code

app.post("/joinChallenge",(req,res)=>{
	Unique.findOne({username:req.body.username},(err,user)=>{
		if(err) throw err;
		else if(!user){
			res.status(400).send({message:"noUser"})
		}else{
			Challenge.findOne({code:req.body.code},(er,chal)=>{
				if(err) throw err;
				else if(!chal){
					res.status(400).send({message:"noCode"})
				}else if(!chal.state){
					res.status(400).send({message:"expired"})
				}else{
					user.chals.push(chal.code);
					chal.parts.push({username:user.username,totalWeight:0,scans:0})
					chal.save();
					user.save();
					res.status(200).send({message:"joined",chals:user.chals})
				}
			})
		}
	})
})

// @route POST /getChallengeList
// @desc Returns the user data regarding challenge
// @params username
app.post("/getChallengeList",(req,res)=>{
	Unique.findOne({username:req.body.username},(err,user)=>{
		if(err) throw err;
		else if(!user){
			res.status(400).send({message:"noUser"})
		}else{
			res.status(200).send(user.chals);
		}
	})
})

// @route POST /getChallengeData
// @desc Returns the user data regarding challenge
// @params username code
app.post("/getChallengeData",(req,res)=>{
	Unique.findOne({username:req.body.username},(err,user)=>{
		if(err) throw err;
		else if(!user){
			res.status(400).send({message:"noUser"})
		}else{
			Challenge.findOne({code:req.body.code},(err,chal)=>{
				if(err) throw err;
				else if(!chal){
					res.status(400).send({message:"noChallenge"});
				}else{
					var sorted = sort(chal.parts);
					let i;
					for(i=0;i<sorted.length;i++){
						if(sorted[i].username == user.username){
							res.status(200).send({chals:sorted[i],position:i+1});
							break;
						}
					}
					// res.send(sorted);
				}
			})
			
		}
	})
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

// @route GET /claimOffer
// @desc seller redeem

app.get("/claimOffer/:name",(req,res)=>{
	res.render("claimOffer",{name:req.params.name,flag:"",offers:[],user:null});
})


// @route GET /codeScanner/:name
// @desc Returns the Scan QR page
// @params name(admin name)

app.get("/codeScanner/:name",(req,res)=>{
	res.render("codeScanner",{name:req.params.name});
})

// @route POST /checkqr/:name/:hash
// @desc validate user
// @params name(a_name) hash

app.get("/checkQR/:name/:username",(req,res)=>{
	
	Unique.findOne({username:req.params.username},(err,user)=>{
		if(err) throw err;
		else{
			if(!user){
				res.render("claimOffer",{name:req.params.name,flag:"",offers:[],user:null});
			}
			else if(user.sec){
				res.redirect("/viewMyOffer/"+req.params.name+"/"+req.params.username);
				user.sec = false;
				user.save();
			}else{
				res.render("claimOffer",{name:req.params.name,flag:"",offers:[],user:null});
			}
		}
	})
})

// @route /viewMyOffer/:name
// @desc Returns offers available for the user
// @params name(admin name) 
// @body username
app.post("/viewMyOffer/:name",(req,res)=>{
	Unique.findOne({username:req.body.code},(err,user)=>{
		if(err){
			console.log(err);
		}else if(!user){
			res.render("claimOffer",{name:req.params.name,flag:"No such User",offers:[],user:null});
		}else{
			Offer.find({owner:req.params.name},(err,offers)=>{
				if(err){
					console.log(err);
				}else{
					var avail = [];
					offers.forEach((x)=>{
						if(!( x.req > user.data.credits)){
							avail.push(x);
						}
					})
					res.render("claimOffer",{name:req.params.name,flag:"",offers:avail,user:user});
				}
			})		
		}
	})
})

// @route GET /viewMyOffer/:name/:username
// @desc Returns offers available for the user
// @params name(admin name) username
app.get("/viewMyOffer/:name/:username",(req,res)=>{
	
	Unique.findOne({username:req.params.username},(err,user)=>{
		if(err){
			console.log(err);
		}else if(!user){
			res.render("claimOffer",{name:req.params.name,flag:"No such User",offers:[],user:null});
		}else{
			Offer.find({owner:req.params.name},(err,offers)=>{
				if(err){
					console.log(err);
				}else{
					var avail = [];
					offers.forEach((x)=>{
						if(!( x.req > user.data.credits)){
							avail.push(x);
						}
					})
					res.render("claimOffer",{name:req.params.name,flag:"",offers:avail,user:user});
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

app.post("/addOffer/:name",upload.single("image"),(req,res)=>{
	Admin.findOne({username:req.params.name},(err,admin)=>{
		if(err) throw err;
		else{
				var offer = new Offer( {
				name:req.body.name,
				desc:req.body.desc,
				loc:req.body.loc,
				code:req.body.code,
				req:req.body.req,
				owner:req.params.name,
				img:req.file.location,
				type:req.body.type
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

// @route GET /binData/:admin_id
// @desc Display details of Individual Bins

app.get("/binData/:admin_id/:bid",(req,res)=>{
	Bin.findOne({name:req.params.bid},(err,bin)=>{
		if(bin.owner == req.params.admin_id){
			res.render("binData",{bin:bin});	
		}else{
			res.send("You dont own this Bin")
		}
			
	})
	
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

// @route GET /clearBin/:bid
// @desc Resets the bin

app.get("/clearBin/:aid/:bid",(req,res)=>{
	Bin.findOne({name:req.params.bid},(err,bin)=>{
		bin.totalWeight = 0;
		bin.scans = 0;
		bin.save();
		res.redirect("/adminConsole/"+req.params.aid);
	})
})

// @route GET /challenge/:name
// @desc get the challenges page

app.get("/challenge/:name",(req,res)=>{
	Admin.findOne({username:req.params.name},(err,admin)=>{
		if(!admin.challenge){
			res.render("challenge",{name:req.params.name,flag:false});		
		}else{
			Challenge.findOne({code:admin.challenge},(err,chal)=>{
				if(!chal){
					res.render("challenge",{name:req.params.name,flag:false});		
				}else if(chal.state){
					var sorted = sort(chal.parts);
					res.render("challenge",{name:req.params.name,flag:true,chal:chal,winner:false});	
				}else{
					res.render("challenge",{name:req.params.name,flag:true,chal:chal,winner:true});	
				}
				
			})
			
		}
	})
	
})

// @route POST /addChallenge/:name
// @desc Add a new challenge

app.post("/addChallenge/:name",(req,res)=>{
	Admin.findOne({username:req.params.name},(err,admin)=>{
		if(err) throw err;
		else{
			if(admin){
			var random = cryptoRandomString({length: 4});
			admin.challenge = random;
			admin.save();
			var chal = new Challenge({
				code:random,
				owner:req.params.name,
				totalWeight:0,
				date:req.body.date,
				points:req.body.points,
				state:true
			});
			chal.save();
			res.redirect("/challenge/"+req.params.name);
			}else{
				res.send("Poor Request")
			}
		}
	})
})

// @route GET /endChallenge
// @desc End the Challenge
app.get("/endChallenge/:name/:winner",(req,res)=>{
	Unique.findOne({username:req.params.winner},(err,user)=>{
		if(err) throw err;
		else{
			Admin.findOne({username:req.params.name},(err,admin)=>{
				if(err){
					throw err;
				}else{
					Challenge.findOne({code:admin.challenge},(err,chal)=>{
						if(err) throw err
						else{
							user.data.credits+=Number(chal.points);
							chal.state = false;
							user.ntfy.push( "You have WON "+chal.points.toString()+" POINTS from the Contest Conducted by " +admin.corp);
							user.save();
							admin.save();
							chal.save();
							res.redirect("/challenge/"+req.params.name);
						}
					})
				}
			})
		}
	})
})

// @route GET /removeChallenge/:name
// @desc Deletes the challenge
app.get("/removeChallenge/:name",(req,res)=>{
	Admin.findOne({username:req.params.name},(err,admin)=>{
		if(err) throw err;
		else{
			Challenge.findOneAndRemove({code:admin.challenge},(err,chal)=>{
				if(err) throw err;
				else{
					admin.challenge = null;
					admin.save();
					res.redirect("/challenge/"+req.params.name);
				}
			})
			
			
		}
	})
})
// @desc Server listening on PORT 3000

app.listen(process.env.PORT || 3000,()=>{
	console.log("Server started");
})

