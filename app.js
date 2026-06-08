// Firebase Config - তোমারটা বসানো আছে
const firebaseConfig = {
  apiKey: "AIzaSyDFFx13m5qHDf2UnhAeedbQNQCt50vV668",
  authDomain: "eraning-zone-3c6f6.firebaseapp.com",
  projectId: "eraning-zone-3c6f6",
  storageBucket: "eraning-zone-3c6f6.firebasestorage.app",
  messagingSenderId: "936778556193",
  appId: "1:936778556193:web:a03b5d3c2c2b7506b25460"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
let currentUser = null;

// ইউজার লগইন চেক
auth.onAuthStateChanged(async user => {
  if (user) {
    currentUser = user;
    document.getElementById('loginDiv').classList.add('hidden');
    document.getElementById('dashboardDiv').classList.remove('hidden');
    loadUserData();
    loadLeaderboard();
  } else {
    document.getElementById('loginDiv').classList.remove('hidden');
    document.getElementById('dashboardDiv').classList.add('hidden');
  }
});

// সাইনআপ
async function signup() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const refCode = document.getElementById('referralCode').value;
  if(!email ||!password) return alert('Email Password দাও');
  if(password.length < 6) return alert('পাসওয়ার্ড কমপক্ষে 6 অক্ষর');

  try {
    const userCred = await auth.createUserWithEmailAndPassword(email, password);
    const myRefCode = email.split('@')[0].toUpperCase() + Math.floor(Math.random()*1000);

    await db.collection("users").doc(userCred.user.uid).set({
      name: email.split('@')[0],
      email: email,
      balance: 0,
      totalEarn: 0,
      referralCode: myRefCode,
      referredBy: refCode || null,
      joinedDate: firebase.firestore.FieldValue.serverTimestamp()
    });

    // রেফার বোনাস
    if(refCode) {
      const refUser = await db.collection("users").where("referralCode", "==", refCode).get();
      if(!refUser.empty) {
        await db.collection("users").doc(refUser.docs[0].id).update({
          balance: firebase.firestore.FieldValue.increment(20),
          totalEarn: firebase.firestore.FieldValue.increment(20)
        });
      }
    }
    alert('Signup Success! 20 টাকা রেফার বোনাস পেয়েছো');
  } catch(e) { alert(e.message); }
}

// লগইন
function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password).catch(e => alert(e.message));
}

// লগআউট
function logout() { auth.signOut(); }

// ইউজার ডাটা লোড
async function loadUserData() {
  const doc = await db.collection("users").doc(currentUser.uid).get();
  const data = doc.data();
  document.getElementById('userName').innerText = data.name;
  document.getElementById('userBalance').innerText = data.balance;
  document.getElementById('myReferCode').value = data.referralCode;
}

// পেজ শো
function showPage(pageId) {
  ['livePage','leaderboardPage','referPage','supportPage','withdrawPage'].forEach(id => {
    const el = document.getElementById(id);
    if(el) el.classList.add('hidden');
  });
  const el = document.getElementById(pageId);
  if(el) el.classList.remove('hidden');

  // Active বাটন
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
}

// রেফার কোড কপি
function copyReferCode() {
  document.getElementById('myReferCode').select();
  document.execCommand('copy');
  alert('রেফার কোড কপি হয়েছে!');
}

// Offerwall খোলা
function openOfferwall() {
  window.open(`https://www.cpagrip.com/offerwall.php?user_id=${currentUser.uid}`, '_blank');
}

// লিডারবোর্ড লোড
async function loadLeaderboard() {
  const users = await db.collection("users").orderBy("totalEarn", "desc").limit(10).get();
  let html = '';
  let rank = 1;
  users.forEach(doc => {
    const data = doc.data();
    html += `<div class="task-item"><p><b>${rank}. ${data.name}</b> - ৳${data.totalEarn || 0}</p></div>`;
    rank++;
  });
  document.getElementById('leaderboardList').innerHTML = html || '<p>কেউ নাই এখনো</p>';
}

// Gift Code রিডিম
async function redeemGiftCode() {
  const code = document.getElementById('giftCodeInput').value.trim();
  if(!code) return alert('Gift Code লিখো');

  const giftDoc = await db.collection("giftCodes").doc(code).get();
  if(!giftDoc.exists) return alert('ভুল Gift Code');
  if(giftDoc.data().used) return alert('এই কোড আগেই ব্যবহার হয়েছে');

  const amount = giftDoc.data().amount;
  await db.collection("users").doc(currentUser.uid).update({
    balance: firebase.firestore.FieldValue.increment(amount),
    totalEarn: firebase.firestore.FieldValue.increment(amount)
  });
  await db.collection("giftCodes").doc(code).update({used: true, usedBy: currentUser.email});

  alert(`${amount} টাকা পেয়েছো!`);
  loadUserData();
  document.getElementById('giftCodeInput').value = '';
}

// Withdraw রিকোয়েস্ট - বিকাশ/নগদ
async function requestWithdraw() {
  const amount = parseInt(document.getElementById("withdrawAmount").value);
  const method = document.getElementById("paymentMethod").value;
  const number = document.getElementById("paymentNumber").value;

  const userDoc = await db.collection("users").doc(currentUser.uid).get();
  const userData = userDoc.data();

  if(!amount || amount < 100) return alert("মিনিমাম 100 টাকা লাগবে");
  if(!method) return alert("বিকাশ নাকি নগদ সিলেক্ট করুন");
  if(!number || number.length!== 11) return alert("সঠিক 11 ডিজিট নাম্বার দিন");
  if(userData.balance < amount) return alert("ব্যালেন্স কম আছে");

  // Firebase এ সেভ
  await db.collection("withdrawRequests").add({
    userId: currentUser.uid,
    userEmail: currentUser.email,
    userName: userData.name,
    amount: amount,
    method: method,
    number: number,
    status: "pending",
    requestDate: firebase.firestore.FieldValue.serverTimestamp()
  });

  // ব্যালেন্স কাটো
  await db.collection("users").doc(currentUser.uid).update({
    balance: firebase.firestore.FieldValue.increment(-amount)
  });

  alert(`Withdraw রিকোয়েস্ট পেন্ডিং! ${amount} টাকা ${method} নাম্বার ${number} এ 24 ঘন্টায় পাবেন`);
  loadUserData();
  document.getElementById("withdrawAmount").value = "";
  document.getElementById("paymentMethod").value = "";
  document.getElementById("paymentNumber").value = "";
}
