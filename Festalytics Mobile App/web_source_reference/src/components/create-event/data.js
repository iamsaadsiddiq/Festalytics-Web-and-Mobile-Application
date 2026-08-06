
export const EVENT_TYPES = [
    { id: 'wedding', label: 'Wedding', color: 'bg-pink-100 text-[#D6336C]' },
    { id: 'birthday', label: 'Birthday', color: 'bg-blue-100 text-blue-600' },
    { id: 'corporate', label: 'Corporate', color: 'bg-gray-100 text-gray-700' },
    { id: 'party', label: 'Party', color: 'bg-orange-100 text-orange-600' },
    { id: 'other', label: 'Other', color: 'bg-purple-100 text-purple-600' }
];

export const VENUES = [
    { id: 1, name: "The Grand Hall", capacity: "500 Guests", priceDisplay: "$5,000", cost: 5000, rating: 4.8, image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80" },
    { id: 2, name: "Sunset Gardens", capacity: "200 Guests", priceDisplay: "$2,500", cost: 2500, rating: 4.6, image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc6?w=800&q=80" },
    { id: 3, name: "Royal Palm Club", capacity: "800 Guests", priceDisplay: "$8,000", cost: 8000, rating: 4.9, image: "https://images.unsplash.com/photo-1519225421980-715cb0202128?w=800&q=80" },
    { id: 4, name: "Urban Loft Space", capacity: "100 Guests", priceDisplay: "$1,500", cost: 1500, rating: 4.5, image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80" },
];

export const VENDORS = {
    'Catering': [
        { id: 'c1', name: "Delightful Bites", rating: 4.8, priceDisplay: "$35/head", costPerHead: 35, type: 'Catering', image: "https://images.unsplash.com/photo-1555244162-803834f70033?w=800&q=80" },
        { id: 'c2', name: "Royal Feast", rating: 4.9, priceDisplay: "$50/head", costPerHead: 50, type: 'Catering', image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80" },
    ],
    'Decor': [
        { id: 'd1', name: "Dreamy Events", rating: 4.7, priceDisplay: "$1,500", cost: 1500, type: 'Decor', image: "https://images.unsplash.com/photo-1478146896981-b80c463e7e22?w=800&q=80" },
        { id: 'd2', name: "Floral Fantasy", rating: 4.9, priceDisplay: "$3,000", cost: 3000, type: 'Decor', image: "https://images.unsplash.com/photo-1507504031981-723e28429df2?w=800&q=80" },
    ],
    'Photography': [
        { id: 'p1', name: "Lens Magic", rating: 4.8, priceDisplay: "$1,000", cost: 1000, type: 'Photography', image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80" },
        { id: 'p2', name: "Capture Moments", rating: 4.6, priceDisplay: "$800", cost: 800, type: 'Photography', image: "https://images.unsplash.com/photo-1520854221250-8c2787ec3f30?w=800&q=80" },
    ],
    'Sound': [
        { id: 's1', name: "DJ Beats", rating: 4.9, priceDisplay: "$500", cost: 500, type: 'Sound', image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80" },
    ]
};

export const INITIAL_TASKS = [
    { id: 1, title: "Book Venue", due: "2025-03-01", status: "pending" },
    { id: 2, title: "Finalize Guest List", due: "2025-03-05", status: "pending" },
    { id: 3, title: "Send Invitations", due: "2025-03-10", status: "pending" },
    { id: 4, title: "Select Menu", due: "2025-03-15", status: "pending" },
];
