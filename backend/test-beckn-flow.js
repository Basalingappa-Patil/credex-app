const fetch = require('node-fetch');

const BAP_URI = 'http://localhost:5001/api/beckn';

async function testBecknFlow() {
    try {
        console.log('1. Testing Search...');
        const searchResponse = await fetch(`${BAP_URI}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                intent: {
                    skillName: 'JavaScript',
                    issuerName: 'ONEST Provider'
                }
            })
        });

        if (!searchResponse.ok) throw new Error(`Search failed: ${searchResponse.statusText}`);
        const searchData = await searchResponse.json();
        console.log('Search Response:', JSON.stringify(searchData, null, 2));

        // Simulate on_search callback (since we don't have a real network)
        const context = searchData.context;
        console.log('\n2. Simulating on_search...');
        const onSearchResponse = await fetch(`${BAP_URI}/on_search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                context: { ...context, action: 'on_search' },
                message: {
                    catalog: {
                        providers: [{
                            id: 'provider-1',
                            descriptor: { name: 'Test Provider' },
                            items: [{ id: 'item-1', descriptor: { name: 'Verification Service' } }]
                        }]
                    }
                }
            })
        });

        if (!onSearchResponse.ok) throw new Error(`on_search failed: ${onSearchResponse.statusText}`);
        console.log('on_search callback sent successfully');

    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testBecknFlow();
