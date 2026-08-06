"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";
import { useVendorVenue } from "@/hooks/useVendorVenue";

function inStock(item) {
  return Number(item.availableStockQuantity || 0) > 0;
}

function displayPrice(item) {
  const amount = Number(item.b2bPricePerDay ?? item.pricePerUnit ?? 0);
  if (!amount) return "Rs. 0 / Day";
  return `Rs. ${amount.toLocaleString()} / Day`;
}

function thumbnail(item) {
  if (Array.isArray(item.assetImages) && item.assetImages.length > 0) {
    return item.assetImages[0];
  }
  if (Array.isArray(item.images) && item.images.length > 0) {
    const first = item.images[0];
    return typeof first === "string" ? first : first?.url || "";
  }
  return "";
}

export default function MyInventoryPage() {
  const { venueId, isLoading: venueLoading } = useVendorVenue();
  const [inventory, setInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentVendorSlug = venueId || "";

  useEffect(() => {
    if (venueLoading || !currentVendorSlug) {
      if (!venueLoading) setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const unsubscribe = onSnapshot(
      doc(db, "venues", currentVendorSlug),
      (snapshot) => {
        const venueData = snapshot.exists() ? snapshot.data() : {};
        setInventory(Array.isArray(venueData.borrowableInventory) ? venueData.borrowableInventory : []);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || "Failed to load vendor inventory.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentVendorSlug, venueLoading]);

  const filteredInventory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return inventory;

    return inventory.filter((item) => {
      const haystack = [
        item.title,
        item.assetTitle,
        item.category,
        item.notes,
        item.description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [inventory, searchQuery]);

  const totalProducts = inventory.length;
  const outOfStockProducts = inventory.filter((item) => !inStock(item)).length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <span className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Inventory Catalog Overview</h1>
        <p className="text-sm text-slate-600">
          Manage your B2B asset catalog. Published items appear on Borrow Hub for other vendors
          when network participation is enabled.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Total Products</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{totalProducts}</p>
        </div>
        <div className="rounded-xl border border-slate-200/80 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Out of Stock</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{outOfStockProducts}</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-4">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="relative w-full md:max-w-xl">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
              search
            </span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search assets by name, category, or description..."
              className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Link
            href="/vendor-dashboard/my-inventory/add"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add Asset
          </Link>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200/80">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Media</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Asset Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Stock Status</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Inventory Count</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">B2B Price Rate</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                    No inventory assets found for your search.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const hasStock = inStock(item);
                  const image = thumbnail(item);
                  const assetName = item.title || item.assetTitle || "Untitled Asset";
                  const category = item.category || "Uncategorized";
                  const available = Number(item.availableStockQuantity || 0);
                  const total = Number(item.totalStockQuantity || 0);

                  return (
                    <tr key={item.itemId || assetName} className="align-top">
                      <td className="px-4 py-3">
                        {image ? (
                          <img
                            src={image}
                            alt={assetName}
                            className="h-10 w-10 rounded-md object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-[10px] font-semibold text-slate-400">
                            IMG
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 whitespace-normal break-words">
                        {assetName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600">
                          {category}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                            hasStock
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-rose-50 text-rose-700 border border-rose-200"
                          }`}
                        >
                          {hasStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700 whitespace-normal break-words">
                        {available} available of {total}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-semibold">{displayPrice(item)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
