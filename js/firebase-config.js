// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, addDoc, deleteDoc, updateDoc, query, orderBy, writeBatch } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDIvwhTSyUiOKUQTE85551_d9aClnTJrm0",
    authDomain: "penilaianum.firebaseapp.com",
    projectId: "penilaianum",
    storageBucket: "penilaianum.firebasestorage.app",
    messagingSenderId: "901894802645",
    appId: "1:901894802645:web:bb470ef1c44e4d0347265c",
    measurementId: "G-PCKEZGREL2"
};

let app, db;

try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firestore Berhasil Diinisialisasi");
} catch (error) {
    console.error("Gagal menginisialisasi Firestore:", error);
}

// Ekspor ke global window
window.db = db;
window.firestore = {
    collection, doc, setDoc, getDoc, getDocs, addDoc, deleteDoc, updateDoc, query, orderBy, writeBatch
};
