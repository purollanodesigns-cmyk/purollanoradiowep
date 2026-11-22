import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp, getApps } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const backupDir = path.resolve(rootDir, "database_backup");

// Load .env manually
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
  databaseURL:
    process.env.VITE_FIREBASE_DATABASE_URL ||
    (process.env.VITE_FIREBASE_PROJECT_ID
      ? `https://${process.env.VITE_FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`
      : undefined),
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || (!firebaseConfig.projectId && !firebaseConfig.databaseURL)) {
  console.error("❌ Faltan las credenciales de Firebase en el archivo .env");
  console.error("Por favor completa VITE_FIREBASE_API_KEY y VITE_FIREBASE_PROJECT_ID o VITE_FIREBASE_DATABASE_URL.");
  process.exit(1);
}

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getDatabase(app);

const tablesToMigrate = [
  { file: "announcements.json", node: "announcements" },
  { file: "comments.json", node: "comments" },
  { file: "recommended_videos.json", node: "recommended_videos" },
  { file: "site_visits.json", node: "site_visits" },
  { file: "profiles.json", node: "profiles" },
  { file: "push_tokens.json", node: "push_tokens" },
  { file: "user_roles.json", node: "user_roles" }
];

async function migrate() {
  console.log(`🚀 Iniciando migración a Firebase Realtime Database...`);
  console.log(`URL: ${firebaseConfig.databaseURL || "(usando default del proyecto)"}\n`);

  for (const { file, node: nodeName } of tablesToMigrate) {
    const filePath = path.join(backupDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ Archivo omitido (no encontrado): ${file}`);
      continue;
    }

    try {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      if (!content || content === "[]") {
        console.log(`ℹ️ [${nodeName}] Archivo vacío o sin registros.`);
        continue;
      }

      const items = JSON.parse(content);
      if (!Array.isArray(items)) {
        console.log(`⚠️ [${nodeName}] El contenido en ${file} no es un arreglo de registros.`);
        continue;
      }

      console.log(`📦 Migrando ${items.length} registro(s) al nodo '${nodeName}'...`);
      const dataMap = {};
      for (const item of items) {
        const id = item.id ? String(item.id).replace(/[.#$[\]]/g, "_") : undefined;
        if (id) {
          dataMap[id] = item;
        }
      }

      if (Object.keys(dataMap).length > 0) {
        const nodeRef = ref(db, nodeName);
        await set(nodeRef, dataMap);
        console.log(`✅ Nodo '${nodeName}' guardado exitosamente.\n`);
      }
    } catch (err) {
      console.error(`❌ Error migrando ${file}:`, err.message || err);
    }
  }

  console.log("🎉 Migración a Realtime Database finalizada.");
  process.exit(0);
}

migrate().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});
