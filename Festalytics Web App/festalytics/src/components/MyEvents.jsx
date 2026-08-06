import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  Calendar,
  MapPin,
  Edit3,
  Trash2,
  Users,
  Building2,
  Wallet,
  ChevronRight,
  FileText,
} from 'lucide-react';
import DashboardHeader from './DashboardHeader';
import Footer from './Footer';
import {
  formatEventDate,
  formatRs,
  getEventLocation,
  getStatusConfig,
} from '@/lib/eventDisplay';

const MyEvents = () => {
  const router = useRouter();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const storedEvents = JSON.parse(localStorage.getItem('festalytics_events') || '[]');
    setEvents(storedEvents.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  }, []);

  const handleDelete = (e, eventId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this event? This cannot be undone.')) return;
    const updatedEvents = events.filter((ev) => ev.id !== eventId);
    localStorage.setItem('festalytics_events', JSON.stringify(updatedEvents));
    setEvents(updatedEvents);
  };

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-slate-800 font-sans flex flex-col">
      <DashboardHeader />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">My Events</h1>
            <p className="text-gray-500 mt-1">Manage all your upcoming and past events.</p>
          </div>
          <button
            type="button"
            onClick={() => router.push('/create-event')}
            className="flex items-center gap-2 bg-[#D6336C] text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-pink-200/60 hover:brightness-110 transition-all active:scale-95"
          >
            <Plus className="w-5 h-5" />
            Create New Event
          </button>
        </div>

        {events.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-gray-200">
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mb-6">
              <Plus className="w-10 h-10 text-[#D6336C]" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Events Found</h3>
            <p className="text-gray-500 mb-8 max-w-md">
              You haven&apos;t created any events yet. Start planning your first event now!
            </p>
            <button
              type="button"
              onClick={() => router.push('/create-event')}
              className="bg-[#D6336C] text-white px-8 py-3 rounded-xl font-bold hover:brightness-110 transition-colors"
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {events.map((event, index) => {
              const status = getStatusConfig(event.status);
              const venueName = event.selectedVenueName;
              const location = getEventLocation(event);
              const hasQuotation = Boolean(event.quotationId);

              return (
                <motion.article
                  key={event.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => router.push(`/manage-event/${event.id}`)}
                  className="group bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-[#D6336C]/30 transition-all cursor-pointer flex flex-col overflow-hidden"
                >
                  <div className="h-1 bg-gradient-to-r from-[#D6336C] to-pink-300" />

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-[#D6336C] transition-colors">
                          {event.title || 'Untitled Event'}
                        </h3>
                        {event.eventType && (
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-0.5 capitalize">
                            {event.eventType}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold border capitalize ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-[#D6336C] shrink-0" />
                        <span>{formatEventDate(event.date)}</span>
                        {event.time && (
                          <span className="text-gray-400">· {event.time}</span>
                        )}
                      </div>

                      {venueName && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Building2 className="w-4 h-4 text-[#D6336C] shrink-0" />
                          <span className="truncate font-medium text-gray-800">{venueName}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{location}</span>
                      </div>

                      {event.guestCount && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Users className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>{event.guestCount} guests</span>
                        </div>
                      )}

                      {event.budgetTotal > 0 && (
                        <div className="flex items-center gap-2.5 text-sm text-gray-600">
                          <Wallet className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="font-semibold text-gray-800">
                            Est. {formatRs(event.budgetTotal)}
                          </span>
                        </div>
                      )}

                      {hasQuotation && (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg w-fit">
                          <FileText className="w-3.5 h-3.5" />
                          Quotation sent to venue
                        </div>
                      )}
                    </div>

                    <div className="mt-auto pt-4 border-t border-gray-100 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/edit-event/${event.id}`);
                        }}
                        className="flex-1 bg-gray-50 text-gray-700 border border-gray-200 rounded-xl py-2.5 text-sm font-bold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, event.id)}
                        className="p-2.5 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors border border-red-100"
                        aria-label="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <span className="hidden sm:flex items-center text-[#D6336C] opacity-0 group-hover:opacity-100 transition-opacity pr-1">
                        <ChevronRight className="w-5 h-5" />
                      </span>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MyEvents;
