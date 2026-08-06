import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled"];

function columnLetter(indexZeroBased) {
  let n = indexZeroBased + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function safeSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

function normalise(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function isBookingIdHeader(header) {
  const h = normalise(header);
  return h === "bookingid" || h === "id" || h === "booking" || h === "bookingno" || h === "bookingnumber";
}

function normalizeStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["confirmed", "accepted", "approve", "approved"].includes(text)) return "Confirmed";
  if (["cancelled", "canceled", "declined", "rejected", "cancel"].includes(text)) return "Cancelled";
  return "Pending";
}


function extractUrlFromHyperlinkFormula(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const match = text.match(/^=?HYPERLINK\(\s*"([^"]+)"/i) || text.match(/^=?HYPERLINK\(\s*'([^']+)'/i);
  return match ? match[1] : text;
}

function normalizeProofValue(value) {
  const url = extractUrlFromHyperlinkFormula(value);
  const lower = String(url || "").trim().toLowerCase();
  if (["play", "play recording", "recording", "no proof", "not found"].includes(lower)) return "";
  return url;
}

function makeAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) {
    throw new Error("Google service account env variables are missing in .env.local");
  }

  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function ensureHeader({ sheets, spreadsheetId, title, headers, name }) {
  let index = headers.findIndex((h) => normalise(h) === normalise(name));
  if (index >= 0) return { headers, index };
  index = headers.length;
  headers = [...headers, name];
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${safeSheetName(title)}!${columnLetter(index)}1`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [[name]] },
  });
  return { headers, index };
}

async function ensureStatusDropdown({ sheets, spreadsheetId, sheet, title, headers }) {
  const sheetId = sheet.properties?.sheetId;
  let statusCol = headers.findIndex((h) => ["status", "callstatus", "confirmationstatus"].includes(normalise(h)));
  if (statusCol < 0) {
    const result = await ensureHeader({ sheets, spreadsheetId, title, headers, name: "Status" });
    headers = result.headers;
    statusCol = result.index;
  }

  if (sheetId !== undefined && sheetId !== null) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            setDataValidation: {
              range: {
                sheetId,
                startRowIndex: 1,
                endRowIndex: Math.max(sheet.properties?.gridProperties?.rowCount || 1000, 1000),
                startColumnIndex: statusCol,
                endColumnIndex: statusCol + 1,
              },
              rule: {
                condition: {
                  type: "ONE_OF_LIST",
                  values: STATUS_OPTIONS.map((option) => ({ userEnteredValue: option })),
                },
                showCustomUi: true,
                strict: true,
              },
            },
          },
        ],
      },
    });
  }
  return { headers, statusCol };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const bookingId = String(body.bookingId || "").trim();
    const proofUrl = String(body.proofUrl || "").trim();
    const status = body.status ? normalizeStatus(body.status) : "";
    const callSid = body.callSid ? String(body.callSid).trim() : "";
    const requestedSheetName = body.sheetName ? String(body.sheetName).trim() : "";
    const requestedRowNumber = body.rowNumber || body.sheetRowNumber ? Number(body.rowNumber || body.sheetRowNumber) : 0;

    if (!bookingId && !(requestedSheetName && requestedRowNumber)) {
      return NextResponse.json({ success: false, error: "bookingId or exact sheetName and rowNumber are required" }, { status: 400 });
    }
    if (!proofUrl && !status && !callSid) {
      return NextResponse.json({ success: false, error: "Nothing to update. Provide proofUrl, status, or callSid." }, { status: 400 });
    }

    const spreadsheetId = process.env.GOOGLE_SHEET_ZAYDAN_CALLING_ID || process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: "GOOGLE_SHEET_ID is missing in .env.local" }, { status: 500 });
    }

    const auth = makeAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetList = spreadsheet.data.sheets || [];

    const proofFormula = proofUrl ? `=HYPERLINK("${proofUrl.replace(/"/g, '""')}", "Play Recording")` : "";
    let updated = 0;
    const checkedSheets = [];

    for (const sheet of sheetList) {
      const title = sheet.properties?.title;
      if (!title) continue;
      if (requestedSheetName && title !== requestedSheetName) continue;
      checkedSheets.push(title);

      const valuesRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${safeSheetName(title)}!A:ZZ`,
        valueRenderOption: "FORMULA",
      });
      const rows = valuesRes.data.values || [];
      if (!rows.length) continue;

      let headers = rows[0] || [];
      let proofCol = headers.findIndex((h) => normalise(h) === "proof" || normalise(h) === "voiceproof" || normalise(h) === "recordingproof");
      let callSidCol = headers.findIndex((h) => normalise(h) === "callsid" || normalise(h) === "twiliocallsid");
      const dropdownInfo = await ensureStatusDropdown({ sheets, spreadsheetId, sheet, title, headers });
      headers = dropdownInfo.headers;
      const statusCol = dropdownInfo.statusCol;

      if (proofUrl && proofCol < 0) {
        const result = await ensureHeader({ sheets, spreadsheetId, title, headers, name: "Proof" });
        headers = result.headers;
        proofCol = result.index;
      }

      if (callSid && callSidCol < 0) {
        const result = await ensureHeader({ sheets, spreadsheetId, title, headers, name: "Call SID" });
        headers = result.headers;
        callSidCol = result.index;
      }

      const idCols = headers.map((h, i) => (isBookingIdHeader(h) ? i : -1)).filter((i) => i >= 0);
      let targetRow = requestedRowNumber && (!requestedSheetName || requestedSheetName === title) ? requestedRowNumber : -1;

      if (targetRow < 1) {
        for (let r = 1; r < rows.length; r++) {
          const row = rows[r] || [];
          const idMatch = idCols.length
            ? idCols.some((col) => String(row[col] || "").trim() === bookingId)
            : row.some((cell) => String(cell || "").trim() === bookingId);
          if (idMatch) {
            targetRow = r + 1;
            break;
          }
        }
      }

      if (targetRow < 1) continue;

      const updates = [];
      if (proofUrl && proofCol >= 0) {
        updates.push({ range: `${safeSheetName(title)}!${columnLetter(proofCol)}${targetRow}`, values: [[proofFormula]] });
      }
      if (status && statusCol >= 0) {
        updates.push({ range: `${safeSheetName(title)}!${columnLetter(statusCol)}${targetRow}`, values: [[status]] });
      }
      if (callSid && callSidCol >= 0) {
        updates.push({ range: `${safeSheetName(title)}!${columnLetter(callSidCol)}${targetRow}`, values: [[callSid]] });
      }

      if (updates.length) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId,
          requestBody: {
            valueInputOption: "USER_ENTERED",
            data: updates,
          },
        });
        updated += 1;
      }

      // Exact sheet updates and booking-id updates should affect one row only.
      break;
    }

    return NextResponse.json({ success: true, updated, checkedSheets });
  } catch (error) {
    console.error("sync-bookings-proof error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not update Google Sheet proof/status column" }, { status: 500 });
  }
}
