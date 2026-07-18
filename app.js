// app.js - EarnZone Final Version

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const auth = window.firebaseAuth;
const db = window.firebaseDB;

// Global function বানানো লাগবে onclick এর জন্য
window.login = async function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    if(!email ||!password) return alert('ইমেইল ও পাসওয়ার্ড দিন');
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) { alert(error.message); }
}

window.signup = async function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const refer = document.getElementById('referralCode').value;
    if(!email ||!password) return alert('ইমেইল ও পাসওয়ার্ড দিন');
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        await setDoc(doc(db, "users", uid), {
            email: email, balance: 0, referCode: uid.substring(0,6), referredBy: refer || null, createdAt: serverTimestamp()
        });
        alert('একাউন্ট তৈরি হয়েছে!');
    } catch (error) { alert(error.message); }
}

window.logout = function() { signOut(auth); }

window.showPage = function(pageId) {
    document.querySelectorAll('#dashboardDiv.card').forEach(c => c.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

window.copyReferCode = function() {
    navigator.clipboard.writeText(document.getElementById('myReferCode').value);
    alert('কোড কপি হয়েছে');
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

async function loadUserData(uid) {
    const userDoc = await getDoc(doc(db, "users", uid));
    if(userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById('userName').innerText = data.email.split('@')[0];
        document.getElementById('userBalance').innerText = data.balance || 0;
        document.getElementById('myReferCode').value = data.referCode;
    }
}
