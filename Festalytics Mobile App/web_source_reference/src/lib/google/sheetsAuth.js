import crypto from "crypto";
import fs from "fs";
import path from "path";

function normalizeEnvValue(value) {
  if (!value) return value;
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  return v.replace(/\\n/g, "\n");
}

export function loadGoogleServiceAccount() {
  const email = normalizeEnvValue(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
  const privateKey = normalizeEnvValue(process.env.GOOGLE_PRIVATE_KEY);

  if (email && privateKey) {
    return { client_email: email, private_key: privateKey };
  }

  const keyPath = path.join(process.cwd(), "google-key.json");
  if (fs.existsSync(keyPath)) {
    return JSON.parse(fs.readFileSync(keyPath, "utf8"));
  }

  throw new Error(
    "Google Sheets credentials missing. Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY in .env.local, or add google-key.json to the project root."
  );
}

export async function getGoogleAccessToken(email, privateKey) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Claim = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signInput = `${base64Header}.${base64Claim}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(signInput);
  const signature = signer.sign(privateKey, "base64url");
  const jwt = `${signInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(
      `Google OAuth response was not JSON (status ${res.status}): ${text.substring(0, 300)}`
    );
  }

  if (!res.ok) {
    throw new Error(`Google Auth failed: ${JSON.stringify(data)}`);
  }

  return data.access_token;
}

export async function getSheetsAccessToken() {
  const key = loadGoogleServiceAccount();
  return getGoogleAccessToken(key.client_email, key.private_key);
}

/**
 * Resolves worksheet tab: env override → tab named like the spreadsheet → Sheet1 → first tab.
 */
export async function resolveSheetTabName(sheetId, accessToken, preferredTabName) {
  if (process.env.ZAYDAN_CALLING_SHEET_TAB) {
    return normalizeEnvValue(process.env.ZAYDAN_CALLING_SHEET_TAB);
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Could not read spreadsheet tabs: ${JSON.stringify(data)}`);
  }

  const sheets = data.sheets || [];
  const titles = sheets.map((s) => s.properties?.title).filter(Boolean);

  if (preferredTabName && titles.includes(preferredTabName)) {
    return preferredTabName;
  }
  if (titles.includes("Zaydan_booking_calling_sheet")) {
    return "Zaydan_booking_calling_sheet";
  }
  if (titles.includes("Sheet1")) {
    return "Sheet1";
  }

  return titles[0] || "Sheet1";
}

export function getZaydanSpreadsheetId() {
  return (
    normalizeEnvValue(process.env.GOOGLE_SHEET_ZAYDAN_CALLING_ID) ||
    normalizeEnvValue(process.env.GOOGLE_SHEET_ID) ||
    "172-0kSjh3iQUujFd3zg09pnenLysDIN1ZNPbAR8e9VU"
  );
}

export const ZAYDAN_CALLING_TAB_NAME = "Zaydan_booking_calling_sheet";

/**
 * Ensures the dedicated calling-sheet tab exists; creates it if missing.
 */
export async function ensureZaydanCallingTab(sheetId, accessToken) {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=sheets.properties`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(`Could not read spreadsheet: ${JSON.stringify(data)}`);
  }

  const exists = (data.sheets || []).some(
    (s) => s.properties?.title === ZAYDAN_CALLING_TAB_NAME
  );

  if (exists) {
    return ZAYDAN_CALLING_TAB_NAME;
  }

  const createUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`;
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          addSheet: {
            properties: { title: ZAYDAN_CALLING_TAB_NAME },
          },
        },
      ],
    }),
  });

  const createData = await createRes.json();
  if (!createRes.ok) {
    throw new Error(`Could not create calling sheet tab: ${JSON.stringify(createData)}`);
  }

  return ZAYDAN_CALLING_TAB_NAME;
}
