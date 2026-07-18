// Firebase - Modular v12.16.0
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  addDoc,
  serverTimestamp,
  increment
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

// এগুলা index.html এর window থেকে নিবে
const auth = window.firebaseAuth;
const db = window.firebaseDB;

let currentUser = null;

// ইউজার লগইন চেক
onAuthStateChanged(auth, async user => {
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
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const myRefCode = email.split('@')[0].toUpperCase() + Math.floor(Math.random()*1000);

    await setDoc(doc(db, "users", userCred.user.uid), {
      name: email.split('@')[0],
      email: email,
      balance: 0,
      totalEarn: 0,
      referralCode: myRefCode,
      referredBy: refCode || null,
      joinedDate: serverTimestamp()
    });

    // রেফার বোনাস
    if(refCode) {
      const q = query(collection(db, "users"), where("referralCode", "==", refCode));
      const refUser = await getDocs(q);
      if(!refUser.empty) {
        const refUserId = refUser.docs[0].id;
        await updateDoc(doc(db, "users", refUserId), {
          balance: increment(20),
          totalEarn: increment(20)
        });
      }
    }
    alert('Signup Success! 20 টাকা রেফার বোনাস পেয়েছো');
  } catch(e) {
    alert(e.message);
  }
}

// লগইন
function login() {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  signInWithEmailAndPassword(auth, email, password).catch(e => alert(e.message));
}

// লগআউট
function logout() {
  signOut(auth);
}

// ইউজার ডাটা লোড
async function loadUserData() {
  const docSnap = await getDoc(doc(db, "users", currentUser.uid));
  const data = docSnap.data();
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
  if(window.event) window.event.target.classList.add('active');
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
  const q = query(collection(db, "users"), orderBy("totalEarn", "desc"), limit(10));
  const users = await getDocs(q);
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
  const giftDoc = await getDoc(doc(db, "giftCodes", code));
  if(!giftDoc.exists()) return alert('ভুল Gift Code');
  if(giftDoc.data().used) return alert('এই কোড আগেই ব্যবহার হয়েছে');

  const amount = giftDoc.data().amount;
  await updateDoc(doc(db, "users", currentUser.uid), {
    balance: increment(amount),
    totalEarn: increment(amount)
  });
  await updateDoc(doc(db, "giftCodes", code), {used: true, usedBy: currentUser.email});
  alert(`${amount} টাকা পেয়েছো!`);
  loadUserData();
  document.getElementById('giftCodeInput').value = '';
}

// Withdraw রিকোয়েস্ট - বিকাশ/নগদ
async function requestWithdraw() {
  const amount = parseInt(document.getElementById("withdrawAmount").value);
  const method = document.getElementById("paymentMethod").value;
  const number = document.getElementById("paymentNumber").value;
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  const userData = userDoc.data();

  if(!amount || amount < 100) return alert("মিনিমাম 100 টাকা লাগবে");
  if(!method) return alert("বিকাশ নাকি নগদ সিলেক্ট করুন");
  if(!number || number.length!== 11) return alert("সঠিক 11 ডিজিট নাম্বার দিন");
  if(userData.balance < amount) return alert("ব্যালেন্স কম আছে");

  // Firebase এ সেভ
  await addDoc(collection(db, "withdrawRequests"), {
    userId: currentUser.uid,
    userEmail: currentUser.email,
    userName: userData.name,
    amount: amount,
    method: method,
    number: number,
    status: "pending",
    requestDate: serverTimestamp()
  });

  // ব্যালেন্স কাটো
  await updateDoc(doc(db, "users", currentUser.uid), {
    balance: increment(-amount)
  });

  alert(`Withdraw রিকোয়েস্ট পেন্ডিং! ${amount} টাকা ${method} নাম্বার ${number} এ 24 ঘন্টায় পাবেন`);
  loadUserData();
  document.getElementById("withdrawAmount").value = "";
  document.getElementById("paymentMethod").value = "";
  document.getElementById("paymentNumber").value = "";
}
