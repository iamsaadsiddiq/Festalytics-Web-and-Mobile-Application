// Mock Service simulating AI analysis
export const analyzeImage = async (imageData) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                tags: ['Bohemian', 'Rustic Chic', 'Pastel Garden', 'Vintage', 'Dreamy'],
                colors: ['#FFE4E1', '#E6E6FA', '#F5DEB3', '#D3D3D3', '#F0F8FF'],
                vendors: [
                    {
                        id: 1,
                        name: 'Bloom & Wild',
                        type: 'Florist',
                        match: '98%',
                        image: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800&q=80'
                    },
                    {
                        id: 2,
                        name: 'Vintage Vibes Decor',
                        type: 'Decor Rental',
                        match: '95%',
                        image: 'https://images.unsplash.com/photo-1516053641242-7065aa8014e3?w=800&q=80'
                    },
                    {
                        id: 3,
                        name: 'Golden Hour Events',
                        type: 'Event Planner',
                        match: '92%',
                        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'
                    }
                ]
            });
        }, 3000); // 3 seconds simulated delay
    });
};
