import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled"];

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getByAliases(columns, aliases, fallback = "") {
  const wanted = aliases.map(normalizeKey);
  for (const [key, value] of Object.entries(columns || {})) {
    if (wanted.includes(normalizeKey(key)) && value !== undefined && value !== null && String(value).trim() !== "") {
      return value;
    }
  }
  return fallback;
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
    throw new Error("GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_PRIVATE_KEY is missing in .env.local");
  }
  return new google.auth.JWT({
    email,
    key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function safeSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

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

function numeric(value) {
  const text = String(value ?? "").replace(/,/g, "");
  const match = text.match(/\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : 0;
}

function normalizeStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  if (["confirmed", "accepted", "approve", "approved"].includes(text)) return "Confirmed";
  if (["cancelled", "canceled", "declined", "rejected", "cancel"].includes(text)) return "Cancelled";
  return "Pending";
}

async function ensureStatusDropdown({ sheets, spreadsheetId, sheet, title, headers }) {
  const sheetId = sheet.properties?.sheetId;
  if (sheetId === undefined || sheetId === null) return { headers, statusCol: -1 };

  let statusCol = headers.findIndex((h) => ["status", "callstatus", "confirmationstatus"].includes(normalizeKey(h)));
  if (statusCol < 0) {
    statusCol = headers.length;
    headers = [...headers, "Status"];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${safeSheetName(title)}!${columnLetter(statusCol)}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [["Status"]] },
    });
  }

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

  return { headers, statusCol };
}

export async function GET() {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEET_ZAYDAN_CALLING_ID || process.env.GOOGLE_SHEET_ID;
    if (!spreadsheetId) {
      return NextResponse.json({ success: false, error: "GOOGLE_SHEET_ID is missing in .env.local" }, { status: 500 });
    }

    const auth = makeAuth();
    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetList = spreadsheet.data.sheets || [];
    const bookings = [];

    for (const sheet of sheetList) {
      const title = sheet.properties?.title;
      if (!title) continue;

      const valuesRes = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${safeSheetName(title)}!A:ZZ`,
        valueRenderOption: "FORMULA",
      });
      const rows = valuesRes.data.values || [];
      if (rows.length < 1) continue;

      let headers = (rows[0] || []).map((h, index) => String(h || `Column ${index + 1}`).trim() || `Column ${index + 1}`);
      const dropdownInfo = await ensureStatusDropdown({ sheets, spreadsheetId, sheet, title, headers });
      headers = dropdownInfo.headers;

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r] || [];
        if (!row.some((cell) => String(cell || "").trim() !== "")) continue;

        const columns = {};
        headers.forEach((header, index) => {
          columns[header] = row[index] ?? "";
        });

        const id = getByAliases(columns, ["Booking ID", "BookingID", "ID", "Booking No", "Booking Number"], `${title}-${r + 1}`);
        const customerName = getByAliases(columns, ["Customer", "Customer Name", "Client", "Client Name", "Name", "Full Name"], "Client");
        const contact = getByAliases(columns, ["Contact", "Phone", "Phone Number", "Mobile", "Customer Contact", "Number", "Email"], "No Contact");
        const eventDate = getByAliases(columns, ["Event Date", "Date", "Function Date", "Booking Date"], "");
        const timing = getByAliases(columns, ["Timing", "Slot", "Event Timing", "Time"], "");
        const category = getByAliases(columns, ["Service", "Event", "Event Type", "Category", "Event Category"], "Wedding Event");
        const status = normalizeStatus(getByAliases(columns, ["Status", "Call Status", "Confirmation Status"], "Pending"));
        const source = getByAliases(columns, ["Source", "Booking Source"], `Google Sheet: ${title}`);
        const amount = getByAliases(columns, ["Amount", "Grand Total", "Total", "Total Amount", "Price", "Package Amount"], 0);
        const proof = normalizeProofValue(getByAliases(columns, ["Proof", "Voice Proof", "Recording", "Recording Proof", "Call Recording", "Recording URL"], ""));
        const targetVenueId = getByAliases(columns, ["targetVenueId", "Venue ID", "VenueId", "venueId", "Venue", "Hall Slug"], "");

        bookings.push({
          id,
          docId: id,
          sheetName: title,
          rowNumber: r + 1,
          targetVenueId,
          customer: { name: customerName, contact, email: contact },
          eventDetails: { category, date: eventDate, timing, venueId: targetVenueId, source },
          financials: { grandTotal: numeric(amount) },
          status,
          bookingSource: source,
          proof,
          voiceProofUrl: proof,
          sheetColumns: columns,
          raw: { sheetName: title, rowNumber: r + 1, columns },
        });
      }
    }

    return NextResponse.json({ success: true, bookings, total: bookings.length, statusOptions: STATUS_OPTIONS });
  } catch (error) {
    console.error("live-google-sheet error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not read live Google Sheet" }, { status: 500 });
  }
}
