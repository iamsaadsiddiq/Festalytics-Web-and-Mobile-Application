import { NextResponse } from "next/server";
import { google } from "googleapis";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled"];
const DEFAULT_HEADERS = [
  "Booking ID",
  "Customer",
  "Contact",
  "Service",
  "Event Date",
  "Timing",
  "Source",
  "Status",
  "Amount",
  "Proof",
  "Call SID",
];

function normalizeKey(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
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
  if (["confirmed", "accepted", "accept", "approve", "approved", "yes"].includes(text)) return "Confirmed";
  if (["cancelled", "canceled", "declined", "rejected", "reject", "cancel", "no"].includes(text)) return "Cancelled";
  return "Pending";
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

async function getSheetsClient() {
  const spreadsheetId = process.env.GOOGLE_SHEET_ZAYDAN_CALLING_ID || process.env.GOOGLE_SHEET_ID;
  if (!spreadsheetId) {
    throw new Error("GOOGLE_SHEET_ID is missing in .env.local");
  }
  const auth = makeAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  return { sheets, spreadsheetId, spreadsheet };
}

function chooseWritableSheet(sheetList, requestedTitle = "") {
  if (!sheetList.length) return null;
  if (requestedTitle) {
    const exact = sheetList.find((s) => s.properties?.title === requestedTitle);
    if (exact) return exact;
  }
  return (
    sheetList.find((s) => /zaydan|calling|booking/i.test(s.properties?.title || "")) ||
    sheetList[0]
  );
}

async function readRows({ sheets, spreadsheetId, title }) {
  const valuesRes = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${safeSheetName(title)}!A:ZZ`,
    valueRenderOption: "FORMULA",
  });
  return valuesRes.data.values || [];
}

async function ensureHeaders({ sheets, spreadsheetId, title, rows }) {
  let headers = (rows[0] || []).map((h, index) => String(h || `Column ${index + 1}`).trim() || `Column ${index + 1}`);
  if (!headers.length) headers = [...DEFAULT_HEADERS];

  let changed = false;
  for (const header of DEFAULT_HEADERS) {
    if (!headers.some((h) => normalizeKey(h) === normalizeKey(header))) {
      headers.push(header);
      changed = true;
    }
  }

  if (changed || !rows.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${safeSheetName(title)}!A1:${columnLetter(headers.length - 1)}1`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [headers] },
    });
  }

  return headers;
}

async function ensureStatusDropdown({ sheets, spreadsheetId, sheet, headers }) {
  const title = sheet.properties?.title;
  const sheetId = sheet.properties?.sheetId;
  if (!title || sheetId === undefined || sheetId === null) return;

  const statusCol = headers.findIndex((h) => ["status", "callstatus", "confirmationstatus"].includes(normalizeKey(h)));
  if (statusCol < 0) return;

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

function bookingToColumns(booking = {}) {
  const id = booking.id || booking.docId || booking.bookingId || `BK-${Date.now()}`;
  const customer = booking.customer || {};
  const eventDetails = booking.eventDetails || {};
  const financials = booking.financials || {};

  return {
    "Booking ID": id,
    "Customer": customer.name || booking.customerName || booking.name || "Client",
    "Contact": customer.contact || customer.email || booking.contact || booking.phone || "",
    "Service": eventDetails.category || booking.service || booking.category || "Wedding Event",
    "Event Date": eventDetails.date || booking.eventDate || booking.date || "",
    "Timing": eventDetails.timing || booking.timing || "",
    "Source": booking.bookingSource || eventDetails.source || booking.source || "web",
    "Status": normalizeStatus(booking.status || "Pending"),
    "Amount": financials.grandTotal ?? booking.amount ?? booking.total ?? "",
    "Proof": booking.proof || booking.voiceProofUrl || booking.voiceCallRecordingUrl || booking.callRecordingUrl || "",
    "Call SID": booking.voiceCallSid || booking.callSid || "",
  };
}

function rowFromColumns(headers, columns) {
  return headers.map((header) => {
    const match = Object.entries(columns).find(([key]) => normalizeKey(key) === normalizeKey(header));
    return match ? match[1] : "";
  });
}

function findBookingRow(rows, headers, bookingId) {
  const idCols = headers
    .map((h, i) => (["bookingid", "id", "bookingno", "bookingnumber"].includes(normalizeKey(h)) ? i : -1))
    .filter((i) => i >= 0);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] || [];
    const match = idCols.length
      ? idCols.some((col) => String(row[col] || "").trim() === String(bookingId).trim())
      : row.some((cell) => String(cell || "").trim() === String(bookingId).trim());
    if (match) return r + 1;
  }
  return -1;
}

function mapRowsToBookings({ rows, headers, title }) {
  const bookings = [];
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
  return bookings;
}

export async function GET() {
  try {
    const { sheets, spreadsheetId, spreadsheet } = await getSheetsClient();
    const bookings = [];
    for (const sheet of spreadsheet.data.sheets || []) {
      const title = sheet.properties?.title;
      if (!title) continue;
      const rows = await readRows({ sheets, spreadsheetId, title });
      if (!rows.length) continue;
      const headers = await ensureHeaders({ sheets, spreadsheetId, title, rows });
      await ensureStatusDropdown({ sheets, spreadsheetId, sheet, headers });
      bookings.push(...mapRowsToBookings({ rows, headers, title }));
    }
    return NextResponse.json({ success: true, bookings, total: bookings.length, statusOptions: STATUS_OPTIONS });
  } catch (error) {
    console.error("sync-bookings GET error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not read Google Sheet bookings" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const bookings = Array.isArray(body.bookings) ? body.bookings : [];
    if (!bookings.length) {
      return NextResponse.json({ success: true, updated: 0, appended: 0, message: "No bookings were provided." });
    }

    const { sheets, spreadsheetId, spreadsheet } = await getSheetsClient();
    const sheetList = spreadsheet.data.sheets || [];
    const targetSheet = chooseWritableSheet(sheetList, body.sheetName || body.targetSheetName || "");
    if (!targetSheet?.properties?.title) {
      return NextResponse.json({ success: false, error: "No writable sheet tab found." }, { status: 500 });
    }

    const title = targetSheet.properties.title;
    let rows = await readRows({ sheets, spreadsheetId, title });
    const headers = await ensureHeaders({ sheets, spreadsheetId, title, rows });
    await ensureStatusDropdown({ sheets, spreadsheetId, sheet: targetSheet, headers });
    rows = await readRows({ sheets, spreadsheetId, title });

    let updated = 0;
    let appended = 0;
    const appendRows = [];

    for (const booking of bookings) {
      const columns = bookingToColumns(booking);
      const bookingId = columns["Booking ID"];
      const newRow = rowFromColumns(headers, columns);
      const existingRowNumber = findBookingRow(rows, headers, bookingId);

      if (existingRowNumber > 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${safeSheetName(title)}!A${existingRowNumber}:${columnLetter(headers.length - 1)}${existingRowNumber}`,
          valueInputOption: "USER_ENTERED",
          requestBody: { values: [newRow] },
        });
        updated += 1;
      } else {
        appendRows.push(newRow);
        appended += 1;
      }
    }

    if (appendRows.length) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${safeSheetName(title)}!A:${columnLetter(headers.length - 1)}`,
        valueInputOption: "USER_ENTERED",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: appendRows },
      });
    }

    return NextResponse.json({ success: true, updated, appended, sheetName: title });
  } catch (error) {
    console.error("sync-bookings POST error:", error);
    return NextResponse.json({ success: false, error: error.message || "Could not sync bookings to Google Sheets" }, { status: 500 });
  }
}
