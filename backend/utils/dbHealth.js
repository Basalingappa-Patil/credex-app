const mongoose = require('mongoose');

const checkDBConnection = () => {
  return mongoose.connection.readyState === 1;
};

const dbUnavailableResponse = (res, operation = 'operation') => {
  return res.status(503).json({
    error: 'Database unavailable',
    message: `Cannot perform ${operation} - MongoDB is not connected. Please ensure MongoDB is running and restart the server.`,
    hint: 'See README.md for MongoDB setup instructions'
  });
};

const wrapDBOperation = async (res, operation, dbFunction) => {
  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, operation);
  }
  
  try {
    return await dbFunction();
  } catch (error) {
    console.error(`${operation} error:`, error);
    
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return dbUnavailableResponse(res, operation);
    }
    
    throw error;
  }
};

module.exports = {
  checkDBConnection,
  dbUnavailableResponse,
  wrapDBOperation
};
