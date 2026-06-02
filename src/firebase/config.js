import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyBSeLYCOH2bL3KXKQby2-ty_y3E9n9msys",
  authDomain: "moa-budget.firebaseapp.com",
  projectId: "moa-budget",
  storageBucket: "moa-budget.firebasestorage.app",
  messagingSenderId: "327190499292",
  appId: "1:327190499292:web:1363d5cf3d6c84bc47c919"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()