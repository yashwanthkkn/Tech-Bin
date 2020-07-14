
var jwt = require("jsonwebtoken");

var KEY = "SOmeRanDOmeString,.,.,.,.,///jhskjdhfkjskh";

var token = jwt.sign({ foo: 'bar' }, KEY);
console.log(token);
console.log(jwt.verify(token,KEY));

console.log(Math.floor(Date.now()));