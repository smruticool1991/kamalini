import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'

// Same Firebase project as admin-app
const firebaseConfig = {
  apiKey: "AIzaSyCabUfy0a6lpw-KhbMWQwMbQvkmkYh8kdA",
  authDomain: "ka-jobs.firebaseapp.com",
  projectId: "ka-jobs",
  storageBucket: "ka-jobs.firebasestorage.app",
  messagingSenderId: "543414932327",
  appId: "1:543414932327:web:a3dadb358232598d04d5c2"
}

// Prevent re-initialization during Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export default app
