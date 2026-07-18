// app.js - EarnZone Modular v12

// Firebase global theke nibo
const auth = window.firebaseAuth;
const db = window.firebaseDB;
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { doc, setDoc, getDoc, collection, getDocs, query, orderBy, limit, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// Page show/hide
function showPage(pageId) {
    document.querySelectorAll('#dashboardDiv .card').forEach(c => c.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
}

// Auth State Check
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('loginDiv').classList.add('hidden');
        document.getElementById('dashboardDiv').classList.remove('hidden');
        loadUserData(user.uid);
    } else {
        document.getElementById('loginDiv').classList.remove('hidden');
        document.getElementById('dashboardDiv').classList.add('hidden');
    }
});

// Signup
async function signup() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const refer = document.getElementById('referralCode').value;

    if(!email || !password) return alert('ইমেইল ও পাসওয়ার্ড দিন');
    
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        await setDoc(doc(db, "users", uid), {
            email: email,
            balance: 0,
            referCode: uid.substring(0,6),
            referredBy: refer || null,
            createdAt: serverTimestamp()
        });
        alert('একাউন্ট তৈরি হয়েছে!');
    } catch (error) {
        alert(error.message);
    }
}

// Login
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        alert(error.message);
    }
}

// Logout
function logout() {
    signOut(auth);
}

// User Data Load
async function loadUserData(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if(userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById('userName
