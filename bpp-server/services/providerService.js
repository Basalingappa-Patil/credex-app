const fetch = require('node-fetch');

// In-memory "Database" of Skills and Courses
const CATALOG = [
    {
        id: 'provider-1',
        descriptor: { name: 'Tech University' },
        items: [
            {
                id: 'course-1',
                descriptor: { name: 'Advanced React Certification' },
                price: { currency: 'USD', value: '100' },
                tags: { type: 'certification', skill: 'React' }
            },
            {
                id: 'course-2',
                descriptor: { name: 'Node.js Backend Masterclass' },
                price: { currency: 'USD', value: '120' },
                tags: { type: 'certification', skill: 'Node.js' }
            }
        ]
    },
    {
        id: 'provider-2',
        descriptor: { name: 'Design Institute' },
        items: [
            {
                id: 'course-3',
                descriptor: { name: 'UI/UX Fundamentals' },
                price: { currency: 'USD', value: '90' },
                tags: { type: 'course', skill: 'UI/UX' }
            }
        ]
    }
];

class ProviderService {
    async findOfferings(intent) {
        // Real logic: Filter catalog based on intent
        const query = intent.item?.descriptor?.name?.toLowerCase() || '';

        return CATALOG.map(provider => ({
            ...provider,
            items: provider.items.filter(item =>
                item.descriptor.name.toLowerCase().includes(query) ||
                item.tags.skill.toLowerCase().includes(query)
            )
        })).filter(p => p.items.length > 0);
    }

    async generateQuote(order) {
        // Logic to calculate price
        return {
            ...order,
            quote: {
                price: { currency: 'USD', value: '100' }, // Simplified
                breakup: []
            }
        };
    }

    async initializeOrder(order) {
        return {
            ...order,
            payment: {
                uri: 'https://payment.gateway/pay/123',
                status: 'NOT-PAID'
            }
        };
    }

    async confirmOrder(order) {
        return {
            ...order,
            state: 'CONFIRMED',
            fulfillment: {
                state: 'Allocated'
            }
        };
    }

    async sendCallback(bapUri, action, payload) {
        try {
            const url = `${bapUri}/${action}`;
            console.log(`[BPP] Sending callback ${action} to ${url}`);

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                console.error(`[BPP] Callback failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`[BPP] Callback error: ${error.message}`);
        }
    }
}

module.exports = new ProviderService();
