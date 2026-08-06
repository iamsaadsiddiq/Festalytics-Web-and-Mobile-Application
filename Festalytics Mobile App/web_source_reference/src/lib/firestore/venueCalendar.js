import { doc, setDoc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "@/firebase";

/** @returns {string} YYYY-MM-DD */
export function toDateKey(year, monthIndex, day) {
  const m = String(monthIndex + 1).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${year}-${m}-${d}`;
}

export function parseDateKey(dateKey) {
  const [y, m, d] = dateKey.split("-").map(Number);
  return { year: y, monthIndex: m - 1, day: d };
}

export function formatDisplayDate(dateKey) {
  if (!dateKey) return "Select a date";
  const { year, monthIndex, day } = parseDateKey(dateKey);
  return new Date(year, monthIndex, day).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function getMonthLabel(year, monthIndex) {
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function buildMonthGrid(year, monthIndex) {
  const firstDay = new Date(year, monthIndex, 1).getDay();
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, monthIndex, 0).getDate();
  const cells = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({
      day: daysInPrevMonth - i,
      dateKey: null,
      muted: true,
    });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({
      day,
      dateKey: toDateKey(year, monthIndex, day),
      muted: false,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length, dateKey: null, muted: true });
  }

  return cells;
}

/** Normalize legacy day-of-month arrays to YYYY-MM-DD for current month view only — prefer Firestore blockedDates. */
export function normalizeLegacyDayNumbers(dayNumbers, year, monthIndex) {
  if (!Array.isArray(dayNumbers) || dayNumbers.length === 0) return [];
  if (typeof dayNumbers[0] === "string" && dayNumbers[0].includes("-")) {
    return dayNumbers;
  }
  return dayNumbers
    .filter((n) => typeof n === "number" && n >= 1 && n <= 31)
    .map((n) => toDateKey(year, monthIndex, n));
}

export async function saveVenueCalendar(venueId, calendarState) {
  const docRef = doc(db, "venues", venueId);
  const blockedDates = calendarState.blockedDates || [];
  const blackoutDates = calendarState.blackoutDates || [];

  await setDoc(
    docRef,
    {
      blockedDates,
      blackoutDates,
      bookedDates: blockedDates,
      operatingHours: calendarState.operatingHours || {
        defaultFrom: "9:00 AM",
        defaultTo: "6:00 PM",
      },
      dayOverrides: calendarState.dayOverrides || {},
      calendarUpdatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export function subscribeVenueCalendar(venueId, callback) {
  const docRef = doc(db, "venues", venueId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(snap.data());
    },
    (error) => {
      console.error("[subscribeVenueCalendar]", error);
      callback(null, error);
    }
  );
}

export async function fetchVenueCalendar(venueId) {
  const snap = await getDoc(doc(db, "venues", venueId));
  return snap.exists() ? snap.data() : null;
}

/**
 * @param {string} dateKey
 * @param {{ blockedDates: string[], blackoutDates: string[], pendingDates: string[] }} calendar
 * @returns {'blackout'|'booked'|'pending'|'available'}
 */
export function getDateStatus(dateKey, calendar) {
  if (!dateKey) return "available";
  if (calendar.blackoutDates?.includes(dateKey)) return "blackout";
  if (calendar.blockedDates?.includes(dateKey)) return "booked";
  if (calendar.pendingDates?.includes(dateKey)) return "pending";
  return "available";
}
