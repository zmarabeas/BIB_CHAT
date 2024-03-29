import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// import { getAnalytics } from "firebase/analytics"; 
import { firebaseConfig } from "./settings.js"; 
import { getApps, getApp } from "firebase/app";


// if (!firebase.apps.length) {
//     firebase.initializeApp({});
//  }else {
//     firebase.app(); // if already initialized, use that one
//  }
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
// const app = initializeApp(firebaseConfig);

// const FirebaseAnalytics = getAnalytics(app);
const FirebaseDB = getDatabase(app);

export { FirebaseDB } 