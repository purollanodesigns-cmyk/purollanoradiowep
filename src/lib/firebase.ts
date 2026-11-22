import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

// Lee las variables de Vite o procesadas, con fallback seguro a la configuración directa del proyecto
const apiKey = import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyC-8UJUQcQX-1meKwlSpR-gozptwKwumIQ";
const projectId = import.meta.env?.VITE_FIREBASE_PROJECT_ID || "puro-llano-radio";
const authDomain = import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`;
const databaseURL =
  import.meta.env?.VITE_FIREBASE_DATABASE_URL ||
  `https://${projectId}-default-rtdb.firebaseio.com`;
const storageBucket = import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || `${projectId}.firebasestorage.app`;
const messagingSenderId = import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "526331475757";
const appId = import.meta.env?.VITE_FIREBASE_APP_ID || "1:526331475757:web:8bea3b708143637a2bc5a4";
const measurementId = import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || "G-0FZHVV2528";

const firebaseConfig = {
  apiKey,
  authDomain,
  databaseURL,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
};

export const isFirebaseConfigured = Boolean(apiKey && projectId);

export const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

export const db: Database = getDatabase(app);
export const auth: Auth = getAuth(app);
