import fs from "fs";
import path from "path";

// Helper to parse .replit file
function parseReplitEnv() {
  try {
    const replitContent = fs.readFileSync(path.join(process.cwd(), ".replit"), "utf8");
    const envVars = {};
    const regex = /^\s*([A-Z0-9_]+)\s*=\s*"(.*)"\s*$/gm;
    let match;
    while ((match = regex.exec(replitContent)) !== null) {
      envVars[match[1]] = match[2];
    }
    return envVars;
  } catch (err) {
    console.error("Failed to parse .replit:", err.message);
    return {};
  }
}

// Prepare configuration
const replitEnv = parseReplitEnv();
const SUPABASE_URL =
  process.env.SUPABASE_URL || replitEnv.SUPABASE_URL || replitEnv.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  process.env.SUPABASE_ANON_KEY || replitEnv.SUPABASE_ANON_KEY || replitEnv.VITE_SUPABASE_ANON_KEY;
const SUPABASE_PUBLISHABLE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  replitEnv.SUPABASE_PUBLISHABLE_KEY ||
  replitEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  replitEnv.SUPABASE_SERVICE_ROLE_KEY ||
  replitEnv.SUPABASE_SERVICE_KEY;

console.log("=== SUPABASE CONFIGURATION DIAGNOSTICS ===");
console.log(`SUPABASE_URL: ${SUPABASE_URL}`);
console.log(
  `SUPABASE_ANON_KEY: ${SUPABASE_ANON_KEY ? SUPABASE_ANON_KEY.substring(0, 15) + "..." : "Not set"}`,
);
console.log(
  `SUPABASE_PUBLISHABLE_KEY: ${SUPABASE_PUBLISHABLE_KEY ? SUPABASE_PUBLISHABLE_KEY.substring(0, 15) + "..." : "Not set"}`,
);
console.log(
  `SUPABASE_SERVICE_ROLE_KEY: ${SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.substring(0, 15) + "..." : "Not set"}`,
);

if (!SUPABASE_URL) {
  console.error("❌ SUPABASE_URL is not set.");
  process.exit(1);
}

// Perform tests
async function runTests() {
  const keyToUse = SUPABASE_ANON_KEY || SUPABASE_PUBLISHABLE_KEY;
  if (!keyToUse) {
    console.error("❌ No public/anon key available to test standard queries.");
    return;
  }

  console.log("\n--- TEST 1: Ping Supabase REST API Root ---");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        apikey: keyToUse,
        Authorization: `Bearer ${keyToUse}`,
      },
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    if (res.ok) {
      const data = await res.json();
      console.log(`✅ Success! Connected to PostgREST.`);
      console.log(`OpenAPI Spec Title: "${data.info?.title}"`);
      console.log(`OpenAPI Spec Version: "${data.info?.version}"`);
    } else {
      const body = await res.text();
      console.error(`❌ Failed with body: ${body}`);
    }
  } catch (err) {
    console.error("❌ Error pinging REST API:", err.message);
  }

  console.log("\n--- TEST 2: Querying 'profiles' table with Anon Key ---");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, {
      headers: {
        apikey: keyToUse,
        Authorization: `Bearer ${keyToUse}`,
      },
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const body = await res.text();
    if (res.ok) {
      console.log("✅ Query succeeded!");
      console.log("Result (up to 1 row):", body);
    } else {
      console.log(`❌ Query failed: ${body}`);
    }
  } catch (err) {
    console.error("❌ Error querying profiles table:", err.message);
  }

  console.log("\n--- TEST 3: Querying 'communities' table with Anon Key ---");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/communities?select=*&limit=1`, {
      headers: {
        apikey: keyToUse,
        Authorization: `Bearer ${keyToUse}`,
      },
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const body = await res.text();
    if (res.ok) {
      console.log("✅ Query succeeded!");
      console.log("Result (up to 1 row):", body);
    } else {
      console.log(`❌ Query failed: ${body}`);
    }
  } catch (err) {
    console.error("❌ Error querying communities table:", err.message);
  }

  if (SUPABASE_SERVICE_ROLE_KEY) {
    console.log("\n--- TEST 4: Querying 'profiles' table with Service Role Key ---");
    try {
      const isOpaqueKey =
        SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_secret_") ||
        SUPABASE_SERVICE_ROLE_KEY.startsWith("sb_publishable_");
      const headers = {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        ...(isOpaqueKey ? {} : { Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` }),
      };
      const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&limit=1`, { headers });
      console.log(`Status: ${res.status} ${res.statusText}`);
      const body = await res.text();
      if (res.ok) {
        console.log("✅ Service Role Query succeeded!");
        console.log("Result (up to 1 row):", body);
      } else {
        console.log(`❌ Service Role Query failed: ${body}`);
      }
    } catch (err) {
      console.error("❌ Error querying with service role:", err.message);
    }
  } else {
    console.log("\n--- TEST 4: Service Role Key check ---");
    console.log("⚠️ No service role key set. Server-side admin functions will fail.");
  }
}

runTests();
