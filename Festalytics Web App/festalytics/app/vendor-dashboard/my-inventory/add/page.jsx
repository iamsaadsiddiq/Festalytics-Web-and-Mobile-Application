"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/firebase";
import { useVendorVenue } from "@/hooks/useVendorVenue";
import {
  appendBorrowableInventoryItem,
  generateInventoryItemId,
  INVENTORY_CATEGORIES,
} from "@/lib/firestore/borrowHub";

export default function AddInventoryAssetPage() {
  const router = useRouter();
  const { venueId } = useVendorVenue();
  const currentVendorSlug = venueId || "";

  const [assetTitle, setAssetTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("power");
  const [assetImages, setAssetImages] = useState([]);
  const [assetVideoUrl, setAssetVideoUrl] = useState("");
  const [b2bPricePerDay, setB2bPricePerDay] = useState("");
  const [b2bContactNumber, setB2bContactNumber] = useState("");
  const [totalStockQuantity, setTotalStockQuantity] = useState("1");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(
    () =>
      Boolean(currentVendorSlug) &&
      assetTitle.trim().length > 0 &&
      description.trim().length > 0 &&
      Number(b2bPricePerDay) > 0 &&
      b2bContactNumber.trim().length > 0 &&
      Number(totalStockQuantity) >= 1,
    [
      assetTitle,
      b2bContactNumber,
      b2bPricePerDay,
      currentVendorSlug,
      description,
      totalStockQuantity,
    ]
  );

  const uploadImageFiles = async (files) => {
    if (!currentVendorSlug) {
      setError("Vendor context is missing. Please refresh and try again.");
      console.error("[uploadImageFiles] Missing currentVendorSlug");
      return;
    }
    if (!Array.isArray(files) || files.length === 0) {
      setError("No valid files selected.");
      console.error("[uploadImageFiles] Files array is empty/invalid:", files);
      return;
    }

    const validFiles = files.filter(
      (file) =>
        file instanceof File &&
        file.type.startsWith("image/") &&
        Number(file.size || 0) > 0
    );

    if (!validFiles.length) {
      setError("Selected files are invalid or empty.");
      console.error("[uploadImageFiles] No valid File objects:", files);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadMessage("Preparing upload...");
    setError("");
    try {
      const totalBytes = validFiles.reduce(
        (sum, file) => sum + Number(file.size || 0),
        0
      );
      const progressByTask = {};

      const uploads = await Promise.all(
        validFiles.map(
          (file, index) =>
            new Promise((resolve, reject) => {
              const safeName = String(file.name || "asset").replace(/\s+/g, "_");
              const path = `venues/${currentVendorSlug}/inventory/${Date.now()}_${index}_${safeName}`;
              const storageRef = ref(storage, path);
              const task = uploadBytesResumable(storageRef, file);
              const taskKey = `${index}-${safeName}`;

              console.log("[uploadImageFiles] Upload started", {
                name: file.name,
                size: file.size,
                type: file.type,
                path,
              });

              task.on(
                "state_changed",
                (snapshot) => {
                  progressByTask[taskKey] = snapshot.bytesTransferred;

                  const totalTransferred = Object.values(progressByTask).reduce(
                    (sum, value) => sum + Number(value || 0),
                    0
                  );
                  const pct =
                    totalBytes > 0
                      ? Math.min(
                          100,
                          Math.max(0, Math.round((totalTransferred / totalBytes) * 100))
                        )
                      : 100;
                  setUploadProgress(pct);
                  setUploadMessage(`Uploading ${pct}%`);
                  console.log("[uploadImageFiles] Progress", {
                    file: file.name,
                    bytesTransferred: snapshot.bytesTransferred,
                    totalBytes: snapshot.totalBytes,
                    aggregatePercent: pct,
                    state: snapshot.state,
                  });
                },
                (taskError) => {
                  console.error("[uploadImageFiles] Upload task failed", {
                    file: file.name,
                    code: taskError?.code,
                    message: taskError?.message,
                    fullError: taskError,
                  });
                  reject(taskError);
                },
                async () => {
                  try {
                    const url = await getDownloadURL(task.snapshot.ref);
                    console.log("[uploadImageFiles] Upload complete", {
                      file: file.name,
                      url,
                    });
                    resolve(url);
                  } catch (urlError) {
                    console.error("[uploadImageFiles] getDownloadURL failed", {
                      file: file.name,
                      code: urlError?.code,
                      message: urlError?.message,
                      fullError: urlError,
                    });
                    reject(urlError);
                  }
                }
              );
            })
        )
      );
      setAssetImages((prev) => [...prev, ...uploads]);
      setUploadProgress(100);
      setUploadMessage("Upload complete");
    } catch (uploadError) {
      console.error("[uploadImageFiles] Upload failed", uploadError);
      setError(uploadError.message || "Failed to upload images.");
      setUploadMessage("Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => {
        setUploadProgress(0);
        setUploadMessage("");
      }, 1200);
    }
  };

  const handleDrop = async (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files || []).filter((file) =>
      file.type.startsWith("image/")
    );
    await uploadImageFiles(files);
  };

  const handleFileSelection = async (event) => {
    const files = Array.from(event.target.files || []).filter((file) =>
      file.type.startsWith("image/")
    );
    await uploadImageFiles(files);
    event.target.value = "";
  };

  const submitAsset = async (event) => {
    event.preventDefault();
    if (!canSubmit) {
      setError("Please complete all required fields correctly.");
      return;
    }

    const stock = Number(totalStockQuantity);
    const availableStockQuantity = stock;

    const payload = {
      itemId: generateInventoryItemId(),
      title: assetTitle.trim(),
      assetTitle: assetTitle.trim(),
      description: description.trim(),
      notes: description.trim(),
      category,
      assetImages,
      assetVideoUrl: assetVideoUrl.trim(),
      b2bPricePerDay: Number(b2bPricePerDay),
      b2bContactNumber: b2bContactNumber.trim(),
      totalStockQuantity: stock,
      availableStockQuantity,
      quantityTotal: stock,
      quantityAvailable: availableStockQuantity,
      unit: "units",
      listingType: "rent",
      pricePerUnit: Number(b2bPricePerDay),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSaving(true);
    setError("");
    try {
      await appendBorrowableInventoryItem(currentVendorSlug, payload);
      router.push("/vendor-dashboard/my-inventory");
    } catch (submitError) {
      setError(submitError.message || "Failed to add inventory asset.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submitAsset} className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-3xl font-bold text-slate-900">Add New Inventory Asset</h1>
        <p className="text-sm text-slate-600">
          Publish a high-quality B2B asset listing with media, pricing, and stock metadata.
        </p>
      </header>

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
        <h2 className="text-lg font-semibold text-slate-900">Core Info</h2>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Asset Title *</label>
          <input
            type="text"
            value={assetTitle}
            onChange={(event) => setAssetTitle(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="500KVA Heavy Backup Generator"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Specifications & Description *</label>
          <textarea
            rows={5}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y"
            placeholder="Power output, fuel type, expected runtime, handling instructions, dimensions..."
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Category</label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {INVENTORY_CATEGORIES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Media Upload Panel</h2>
          <p className="text-sm text-slate-500 mt-1">
            Optional — you can publish without images and add media later.
          </p>
        </div>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
          className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center space-y-3"
        >
          <p className="text-sm font-medium text-slate-700">
            Drag and drop images here, or choose files manually.
          </p>
          <label className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:bg-indigo-700">
            <span className="material-symbols-outlined text-base">upload</span>
            {uploading ? uploadMessage || `Uploading ${uploadProgress}%` : "Select Images"}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelection}
              className="hidden"
              disabled={uploading}
            />
          </label>
          {uploading && (
            <div className="max-w-xs mx-auto w-full">
              <div className="h-2 rounded-full bg-indigo-100 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {assetImages.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {assetImages.map((url) => (
              <div key={url} className="relative">
                <img
                  src={url}
                  alt="Asset upload"
                  className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setAssetImages((prev) => prev.filter((value) => value !== url))}
                  className="absolute top-1 right-1 rounded-md bg-white/95 border border-slate-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Asset Video URL (optional)</label>
          <input
            type="url"
            value={assetVideoUrl}
            onChange={(event) => setAssetVideoUrl(event.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="https://..."
          />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Pricing & Team Coordination</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">B2B Price Per Day *</label>
            <input
              type="number"
              min="1"
              value={b2bPricePerDay}
              onChange={(event) => setB2bPricePerDay(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="15000"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">B2B Contact Number *</label>
            <input
              type="text"
              value={b2bContactNumber}
              onChange={(event) => setB2bContactNumber(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="+92..."
              required
            />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Inventory Logistics Tracking</h2>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Total Stock Quantity *</label>
            <input
              type="number"
              min="1"
              value={totalStockQuantity}
              onChange={(event) => setTotalStockQuantity(event.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            Available stock will be initialized automatically to{" "}
            <span className="font-semibold text-slate-800">
              {Number(totalStockQuantity) >= 1 ? Number(totalStockQuantity) : 1}
            </span>{" "}
            on save.
          </div>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={!canSubmit || saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-base">save</span>
          {saving ? "Publishing..." : "Save Asset"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/vendor-dashboard/my-inventory")}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
