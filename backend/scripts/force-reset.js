const mongoose = require('mongoose');

// Hardcoded URI from .env to ensure we hit the right DB
const URI = 'mongodb+srv://DivateManasi:12H2345juk@cluster1.i7qmdcm.mongodb.net/skillverify?retryWrites=true&w=majority';

console.log('Starting FORCE RESET on Atlas...');

const resetDb = async () => {
    try {
        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(URI);
        console.log('Connected!');

        const collections = await mongoose.connection.db.collections();

        if (collections.length === 0) {
            console.log('No collections found to clear.');
        }

        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared collection: ${collection.collectionName}`);
        }

        console.log('All data cleared successfully from Atlas');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
};

resetDb();
