import React, { useEffect } from 'react';
import { db } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { computeEventBudget, formatRs } from '@/lib/venuePricing';

const Budget = ({ eventData, updateFormData }) => {
  const slug = eventData.selectedVenueSlug;

  useEffect(() => {
    if (!slug) return undefined;
    const unsub = onSnapshot(doc(db, 'venues', slug), (snap) => {
      const dbVenue = snap.exists() ? snap.data() : null;
      const budget = computeEventBudget({
        dbVenue,
        guestCount: eventData.guestCount,
        selectedPkg: eventData.selectedCateringPackage,
        addons: eventData.selectedAddons,
      });
      updateFormData('budgetBreakdown', budget.breakdown);
      updateFormData('budgetTotal', budget.grandTotal);
    });
    return () => unsub();
  }, [
    slug,
    eventData.guestCount,
    eventData.selectedCateringPackage,
    eventData.selectedAddons,
    updateFormData,
  ]);

  const breakdown = eventData.budgetBreakdown || [];
  const totalCost = eventData.budgetTotal || 0;
  const paidAmount = 0;
  const remainingAmount = totalCost - paidAmount;

  const budgetPercent = paidAmount > 0 && totalCost > 0 ? Math.round((paidAmount / totalCost) * 100) : 0;

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Budget Overview</h1>
        <p className="text-gray-500">
          Estimated costs for {eventData.selectedVenueName || 'your selected venue'} based on
          current menu and service rates.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white shadow-lg">
          <p className="text-gray-400 text-sm font-medium mb-1">Total Estimated</p>
          <h2 className="text-3xl font-bold">{formatRs(totalCost)}</h2>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Paid So Far</p>
          <h2 className="text-3xl font-bold text-green-600">{formatRs(paidAmount)}</h2>
        </div>
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
          <p className="text-gray-500 text-sm font-medium mb-1">Remaining</p>
          <h2 className="text-3xl font-bold text-[#D6336C]">{formatRs(remainingAmount)}</h2>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between text-sm font-bold text-gray-700 mb-2">
          <span>Budget Used</span>
          <span>{budgetPercent}%</span>
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-[#D6336C] rounded-full shadow-lg transition-all duration-500"
            style={{ width: `${budgetPercent}%` }}
          />
        </div>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl overflow-hidden">
        <div className="p-4 border-b border-gray-50 font-bold text-gray-900 flex justify-between bg-gray-50">
          <span>Expense Item</span>
          <span>Estimated Cost</span>
        </div>
        <div className="divide-y divide-gray-50">
          {breakdown.length > 0 ? (
            breakdown.map((expense, idx) => (
              <div
                key={idx}
                className="p-4 flex justify-between text-sm hover:bg-gray-50 transition-colors gap-4"
              >
                <span className="text-gray-700">{expense.item}</span>
                <span className="font-bold text-gray-900 shrink-0">{expense.display}</span>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400 italic">
              Complete the Menu & Services step to see your budget breakdown.
            </div>
          )}
        </div>
        {breakdown.length > 0 && (
          <div className="p-4 flex justify-between font-bold text-gray-900 bg-pink-50 border-t border-pink-100">
            <span>Grand Total</span>
            <span className="text-[#D6336C]">{formatRs(totalCost)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;
