import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
// import { getAnalytics } from "firebase/analytics"; 
import { firebaseConfig } from "./settings.js"; 
import { getApps, getApp } from "firebase/app";


const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const FirebaseDB = getDatabase(app);
export { FirebaseDB } 