import { NextResponse } from "next/server";
import {
  getSheetsAccessToken,
  getZaydanSpreadsheetId,
  ensureZaydanCallingTab,
} from "@/lib/google/sheetsAuth";
import {
  ZAYDAN_CALLING_SHEET_HEADERS,
  quotationToCallingRow,
  bookingToCallingRow,
} from "@/lib/google/zaydanCallingSheet";

async function getSpreadsheetConfig(accessToken) {
  const sheetId = getZaydanSpreadsheetId();
  const tabName = await ensureZaydanCallingTab(sheetId, accessToken);
  return { sheetId, tabName };
}

function tabRange(tabName, a1) {
  return `'${tabName.replace(/'/g, "''")}'!${a1}`;
}

async function clearSheetRange(accessToken, sheetId, tabName) {
  const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabRange(tabName, "A1:Z2000"))}:clear`;
  const res = await fetch(clearUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sheet clear failed: ${err}`);
  }
}

async function writeSheetValues(accessToken, sheetId, tabName, values, append = false) {
  const range = tabRange(tabName, append ? "A1" : "A1");
  const method = append ? "append" : "update";
  const url =
    method === "append"
      ? `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
      : `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;

  const res = await fetch(url, {
    method: method === "append" ? "POST" : "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`Sheet write failed: ${JSON.stringify(data)}`);
  }
  return data;
}

function buildRowsFromPayload(body) {
  const rows = [];

  if (Array.isArray(body.quotations)) {
    body.quotations.forEach((q) => rows.push(quotationToCallingRow(q)));
  }

  if (Array.isArray(body.bookings)) {
    body.bookings.forEach((b) => {
      const docId = b.docId || b.id;
      rows.push(bookingToCallingRow(b.raw || b, docId));
    });
  }

  if (Array.isArray(body.rows)) {
    rows.push(...body.rows);
  }

  return rows;
}

/** POST: append row(s) or full sync Firestore data for Zaydan */
export async function POST(req) {
  try {
    const accessToken = await getSheetsAccessToken();
    const { sheetId, tabName } = await getSpreadsheetConfig(accessToken);
    const body = await req.json();
    const { action = "append" } = body;
    const dataRows = buildRowsFromPayload(body);

    if (action === "fullSync") {
      await clearSheetRange(accessToken, sheetId, tabName);
      const allValues = [ZAYDAN_CALLING_SHEET_HEADERS, ...dataRows];
      await writeSheetValues(accessToken, sheetId, tabName, allValues, false);
      return NextResponse.json({
        success: true,
        message: `Full sync: ${dataRows.length} Zaydan record(s) written to calling sheet.`,
        count: dataRows.length,
      });
    }

    if (!dataRows.length) {
      return NextResponse.json(
        { success: false, error: "No rows provided to append." },
        { status: 400 }
      );
    }

    await writeSheetValues(accessToken, sheetId, tabName, dataRows, true);
    return NextResponse.json({
      success: true,
      message: `Appended ${dataRows.length} row(s) to Zaydan calling sheet.`,
      count: dataRows.length,
    });
  } catch (error) {
    console.error("[zaydan-calling-sheet] POST error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/** GET: read current Zaydan calling sheet rows */
export async function GET() {
  try {
    const accessToken = await getSheetsAccessToken();
    const { sheetId, tabName } = await getSpreadsheetConfig(accessToken);

    const fetchUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(tabRange(tabName, "A1:Z2000"))}`;
    const response = await fetch(fetchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(`Google Sheets fetch failed: ${JSON.stringify(data)}`);
    }

    const rows = data.values || [];
    return NextResponse.json({
      success: true,
      headers: rows[0] || ZAYDAN_CALLING_SHEET_HEADERS,
      rows: rows.slice(1),
    });
  } catch (error) {
    console.error("[zaydan-calling-sheet] GET error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
