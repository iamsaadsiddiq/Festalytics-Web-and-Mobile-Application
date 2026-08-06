import React, { useEffect, useMemo, useState } from 'react';
import { Check, UtensilsCrossed, Sparkles } from 'lucide-react';
import { db } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import {
  resolveCateringPackages,
  VENUE_HIRE_ONLY,
  getAddonOptions,
  computeEventBudget,
  formatRs,
} from '@/lib/venuePricing';

const Vendors = ({ eventData, updateFormData }) => {
  const [dbVenue, setDbVenue] = useState(null);
  const slug = eventData.selectedVenueSlug;

  useEffect(() => {
    if (!slug) return undefined;
    const unsub = onSnapshot(
      doc(db, 'venues', slug),
      (snap) => setDbVenue(snap.exists() ? snap.data() : null),
      (err) => console.error('Venue menu load error:', err)
    );
    return () => unsub();
  }, [slug]);

  const packages = useMemo(() => {
    const list = resolveCateringPackages(dbVenue, {
      one_dish_chicken: eventData.one_dish_chicken,
      one_dish_beef: eventData.one_dish_beef,
      one_dish_mutton: eventData.one_dish_mutton,
    });
    return list.length > 0 ? list : [VENUE_HIRE_ONLY];
  }, [dbVenue, eventData.one_dish_chicken, eventData.one_dish_beef, eventData.one_dish_mutton]);

  const addonOptions = useMemo(() => getAddonOptions(dbVenue), [dbVenue]);

  const selectedPkgId =
    eventData.selectedCateringPackageId || eventData.selectedCateringPackage?.id;
  const selectedPkg =
    packages.find((p) => p.id === selectedPkgId) ||
    (selectedPkgId === VENUE_HIRE_ONLY.id ? VENUE_HIRE_ONLY : null);

  const addons = eventData.selectedAddons || {
    ac: false,
    generator: false,
    decor: false,
    sound: false,
    security: false,
  };

  const syncBudget = (pkg, nextAddons) => {
    const budget = computeEventBudget({
      dbVenue,
      guestCount: eventData.guestCount,
      selectedPkg: pkg,
      addons: nextAddons,
    });
    updateFormData('budgetBreakdown', budget.breakdown);
    updateFormData('budgetTotal', budget.grandTotal);
  };

  const selectPackage = (pkg) => {
    updateFormData('selectedCateringPackageId', pkg.id);
    updateFormData('selectedCateringPackage', {
      id: pkg.id,
      name: pkg.name,
      type: pkg.type,
      perPlatePrice: pkg.perPlatePrice,
      dishes: pkg.dishes || [],
    });
    syncBudget(pkg, addons);
  };

  const toggleAddon = (key) => {
    const next = { ...addons, [key]: !addons[key] };
    updateFormData('selectedAddons', next);
    syncBudget(selectedPkg || VENUE_HIRE_ONLY, next);
  };

  useEffect(() => {
    if (!packages.length || selectedPkgId) return;
    selectPackage(packages[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [packages.length, slug, selectedPkgId]);

  if (!slug) {
    return (
      <div className="text-center py-16 text-gray-500">
        Please select a venue in the previous step.
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col lg:flex-row gap-8">
      <div className="flex-1 flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Menu & Services</h1>
          <p className="text-gray-500">
            Choose catering and add-ons for{' '}
            <span className="font-semibold text-gray-800">{eventData.selectedVenueName}</span>
          </p>
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UtensilsCrossed size={20} className="text-[#D6336C]" />
            Catering Packages
          </h2>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            <label
              className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                selectedPkgId === VENUE_HIRE_ONLY.id
                  ? 'border-[#D6336C] bg-pink-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <input
                type="radio"
                name="cateringPackage"
                className="sr-only"
                checked={selectedPkgId === VENUE_HIRE_ONLY.id}
                onChange={() => selectPackage(VENUE_HIRE_ONLY)}
              />
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-gray-900">Venue Hire Only</p>
                  <p className="text-sm text-gray-500 mt-1">No catering package selected</p>
                </div>
                <span className="font-bold text-[#D6336C]">{formatRs(0)}/head</span>
              </div>
            </label>

            {packages
              .filter((p) => p.id !== VENUE_HIRE_ONLY.id)
              .map((pkg) => {
                const isSelected = selectedPkgId === pkg.id;
                return (
                  <label
                    key={pkg.id}
                    className={`block p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#D6336C] bg-pink-50'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="cateringPackage"
                      className="sr-only"
                      checked={isSelected}
                      onChange={() => selectPackage(pkg)}
                    />
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <p className="font-bold text-gray-900">
                          {pkg.name}{' '}
                          <span className="text-xs font-normal text-gray-500">({pkg.type})</span>
                        </p>
                        {pkg.dishes?.length > 0 && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {pkg.dishes.join(' · ')}
                          </p>
                        )}
                      </div>
                      <span className="font-bold text-[#D6336C] shrink-0">
                        {formatRs(pkg.perPlatePrice)}/head
                      </span>
                    </div>
                  </label>
                );
              })}
          </div>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles size={20} className="text-[#D6336C]" />
            Add-ons
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {addonOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => toggleAddon(opt.key)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  addons[opt.key]
                    ? 'border-[#D6336C] bg-pink-50'
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-900">{opt.label}</span>
                  {addons[opt.key] && <Check size={18} className="text-[#D6336C]" />}
                </div>
                <span className="text-sm text-gray-500">{formatRs(opt.price)}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="w-full lg:w-80 shrink-0">
        <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 sticky top-4">
          <h3 className="font-bold text-gray-900 mb-4">Selected Services</h3>
          {selectedPkg ? (
            <div className="space-y-4 text-sm">
              <div className="p-3 bg-white rounded-xl border border-gray-100">
                <p className="font-bold text-gray-900">{selectedPkg.name}</p>
                <p className="text-[#D6336C] font-semibold mt-1">
                  {formatRs(selectedPkg.perPlatePrice)}/head
                </p>
                {eventData.guestCount && (
                  <p className="text-gray-500 mt-1">
                    Est. catering:{' '}
                    {formatRs(
                      (Number(selectedPkg.perPlatePrice) || 0) *
                        (parseInt(eventData.guestCount, 10) || 1)
                    )}
                  </p>
                )}
              </div>
              {addonOptions.filter((o) => addons[o.key]).length > 0 ? (
                <ul className="space-y-2">
                  {addonOptions
                    .filter((o) => addons[o.key])
                    .map((o) => (
                      <li
                        key={o.key}
                        className="flex justify-between text-gray-700 bg-white p-2 rounded-lg border border-gray-100"
                      >
                        <span>{o.label}</span>
                        <span className="font-semibold">{formatRs(o.price)}</span>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="text-gray-400 italic">No add-ons selected</p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 italic">Select a catering package</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Vendors;
