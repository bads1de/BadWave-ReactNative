import * as SQLite from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "@/lib/db/schema";

// DB名（アプリ固有）
const DATABASE_NAME = "badwave.db";

// SQLite 接続を取得 (手動でのVACUUMなどに使うためexportもする)
export const expoDb = SQLite.openDatabaseSync(DATABASE_NAME);

// Drizzle クライアントをエクスポート
export const db = drizzle(expoDb, { schema });

// 型エクスポート（推論用）
export type Database = typeof db;
