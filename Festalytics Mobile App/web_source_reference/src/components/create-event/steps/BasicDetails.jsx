import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { EVENT_TYPES } from '../data';
import { lahoreAreas } from '../../../data/lahoreAreas';

const BasicDetails = ({ eventData, updateFormData }) => {
    return (
        <div className="max-w-2xl mx-auto w-full space-y-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2 text-gray-900">Basic Details</h1>
                <p className="text-gray-500">Let's get the basics down to start planning.</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Event Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Sarah's 25th Birthday"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none"
                        value={eventData.title}
                        onChange={(e) => updateFormData('title', e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Event Type</label>
                    <select
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none bg-white"
                        value={eventData.eventType}
                        onChange={(e) => updateFormData('eventType', e.target.value)}
                    >
                        <option value="">Select an event type</option>
                        {EVENT_TYPES.map(type => (
                            <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
                        <div className="relative">
                            <Calendar className="absolute top-3.5 left-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input
                                type="date"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none"
                                value={eventData.date}
                                onChange={(e) => updateFormData('date', e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Time</label>
                        <div className="relative">
                            <Clock className="absolute top-3.5 left-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                            <select
                                className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-[#D6336C]/20 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none bg-white"
                                value={eventData.time}
                                onChange={(e) => updateFormData('time', e.target.value)}
                            >
                                <option value="">Select Timing</option>
                                <option value="morning">Morning</option>
                                <option value="evening">Evening</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">City/Location</label>
                        <div className="relative">
                            <MapPin className="absolute top-3.5 left-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input
                                type="text"
                                list="lahore-areas"
                                placeholder="Search or select area..."
                                className="w-full pl-10 pr-4 py-3 rounded-[10px] border border-[#D6336C]/20 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none transition-all shadow-sm"
                                value={eventData.location}
                                onChange={(e) => updateFormData('location', e.target.value)}
                            />
                            <datalist id="lahore-areas">
                                {lahoreAreas.map(area => (
                                    <option key={area} value={area} />
                                ))}
                            </datalist>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Guests</label>
                        <div className="relative">
                            <Users className="absolute top-3.5 left-3.5 text-gray-400 w-5 h-5 pointer-events-none" />
                            <input
                                type="number"
                                placeholder="100"
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-[#D6336C] focus:ring-2 focus:ring-pink-100 outline-none"
                                value={eventData.guestCount}
                                onChange={(e) => updateFormData('guestCount', e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BasicDetails;
