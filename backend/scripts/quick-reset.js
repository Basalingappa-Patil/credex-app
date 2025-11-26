const mongoose = require('mongoose');

console.log('Starting Quick Reset...');

const resetDb = async () => {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/skill-verification-network');
        console.log('Connected!');

        const collections = await mongoose.connection.db.collections();

        for (let collection of collections) {
            await collection.deleteMany({});
            console.log(`Cleared collection: ${collection.collectionName}`);
        }

        console.log('All data cleared successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
};

resetDb();
