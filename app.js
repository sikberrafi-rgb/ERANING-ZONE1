import { initializeApp }
from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import {

getAuth,
createUserWithEmailAndPassword,
signInWithEmailAndPassword,
signOut

}

from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const firebaseConfig = {

apiKey: "AIzaSyBw2LPnbQ_T4wQxAT-J2iWcJs0jYA3F0so",

authDomain: "earnzone-39a95.firebaseapp.com",

projectId: "earnzone-39a95",

storageBucket: "earnzone-39a95.firebasestorage.app",

messagingSenderId: "217879766538",

appId: "1:217879766538:web:0cc3a449e387a97cbda1f3",

measurementId: "G-LC9MGWYN1L"

};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

/* AUTO LOGIN */

if(localStorage.getItem("login")){

if(window.location.pathname.includes("index.html")){

window.location.href = "home.html";

}

}

/* SIGNUP */

window.signup = function(){

let email =
document.getElementById("email").value;

let password =
document.getElementById("password").value;

createUserWithEmailAndPassword(auth,email,password)

.then((userCredential)=>{

localStorage.setItem("login","true");

localStorage.setItem(
"username",
email
);

alert("Account Created Successfully");

window.location.href="home.html";

})

.catch((error)=>{

alert(error.message);

});

}

/* LOGIN */

window.login = function(){

let email =
document.getElementById("email").value;

let password =
document.getElementById("password").value;

signInWithEmailAndPassword(auth,email,password)

.then(()=>{

localStorage.setItem("login","true");

localStorage.setItem(
"username",
email
);

alert("Login Success");

window.location.href="home.html";

})

.catch((error)=>{

alert(error.message);

});

}

/* LOGOUT */

window.logout = function(){

localStorage.removeItem("login");

localStorage.removeItem("username");

signOut(auth).then(()=>{

window.location.href="index.html";

});

}

/* USER NAME SHOW */

if(document.getElementById("username")){

document.getElementById("username").innerText =

localStorage.getItem("username");

}

/* ADD BALANCE */

window.addBalance = function(){

let balance =
document.getElementById("balance");

let current =
parseInt(balance.innerText);

balance.innerText = current + 5;

alert("5 TK Added");

}

/* WITHDRAW */

window.withdraw = function(){

let number =
document.getElementById("bkash").value;

let amount =
document.getElementById("amount").value;

let method =
document.getElementById("method").value;

alert(

"Withdraw Request Sent\n\nMethod: "
+ method +

"\nNumber: "
+ number +

"\nAmount: "
+ amount

);

}
