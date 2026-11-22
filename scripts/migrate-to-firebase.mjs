import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backupDir = path.resolve(rootDir, "database_backup");

// Load .env manually if needed
const envPath = path.resolve(rootDir, ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...values] = trimmed.split("=");
    if (key && values.length > 0) {
      const val = values.join("=").replace(/^["']|["']$/g, "").trim();
      process.env[key.trim()] = val;
    }
  }
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Faltan las credenciales de Firebase en el archivo .env");
  console.error("Por favor completa VITE_FIREBASE_API_KEY y VITE_FIREBASE_PROJECT_ID antes de ejecutar.");
  process.exit(1);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

const collectionsToMigrate = [
  { file: "announcements.json", collection: "announcements" },
  { file: "comments.json", collection: "comments" },
  { file: "recommended_videos.json", collection: "recommended_videos" },
  { file: "site_visits.json", collection: "site_visits" },
  { file: "profiles.json", collection: "profiles" },
  { file: "push_tokens.json", collection: "push_tokens" },
  { file: "user_roles.json", collection: "user_roles" }
];

async function migrate() {
  console.log(`🚀 Iniciando migración a Firebase Firestore (Proyecto: ${firebaseConfig.projectId})...\n`);

  for (const { file, collection: colName } of collectionsToMigrate) {
    const filePath = path.join(backupDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Archivo omitido (no encontrado): ${file}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      if (!content || content === "[]") {
        console.log(`ℹ️ [${colName}] Archivo vacío o sin registros.`);
        continue;
      }

      const items = JSON.parse(content);
      if (!Array.isArray(items)) {
        console.log(`⚠️ [${colName}] El formato en ${file} no es un arreglo de registros.`);
        continue;
      }

      console.log(`📦 Migrando ${items.length} registro(s) a la colección '${colName}'...`);
      for (const item of items) {
        // Usar item.id si existe, o generar uno
        const docId = item.id ? String(item.id) : undefined;
        if (docId) {
          const docRef = doc(db, colName, docId);
          await setDoc(docRef, item, { merge: true });
        }
      }
      console.log(`✅ Colección '${colName}' migrada exitosamente.\n`);
    } catch (err) {
      console.error(`❌ Error migrando ${file}:`, err.message || err);
    }
  }

  console.log("🎉 Migración finalizada.");
}

migrate().catch(console.error);
