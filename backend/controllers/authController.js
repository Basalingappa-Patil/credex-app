const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { checkDBConnection, dbUnavailableResponse } = require('../utils/dbHealth');

exports.signup = async (req, res) => {
  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, 'user registration');
  }

  try {
    const { email, password, name, role, profileId, universityName, employerId } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Sanitize inputs: Convert empty strings to undefined for unique sparse fields
    const sanitizedProfileId = profileId && profileId.trim() !== '' ? profileId : undefined;
    const sanitizedEmployerId = employerId && employerId.trim() !== '' ? employerId : undefined;

    if (sanitizedProfileId) {
      const existingProfileId = await User.findOne({ profileId: sanitizedProfileId });
      if (existingProfileId) {
        return res.status(400).json({ error: 'Candidate ID already taken' });
      }
    }

    if (sanitizedEmployerId) {
      const existingEmployerId = await User.findOne({ employerId: sanitizedEmployerId });
      if (existingEmployerId) {
        return res.status(400).json({ error: 'Employer ID already taken' });
      }
    }

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'candidate',
      profileId: sanitizedProfileId,
      universityName,
      employerId: sanitizedEmployerId
    });

    const token = generateToken(user._id, user.role);

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Signup error:', error);

    // Handle Duplicate Key Errors (E11000)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      const fieldName = field === 'profileId' ? 'Candidate ID' :
        field === 'employerId' ? 'Employer ID' :
          field === 'email' ? 'Email' : field;
      return res.status(400).json({ error: `${fieldName} is already taken.` });
    }

    // Handle Mongoose Validation Errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ error: messages.join(', ') });
    }

    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return dbUnavailableResponse(res, 'user registration');
    }

    // Return actual error message for debugging
    res.status(500).json({ error: 'Registration failed: ' + error.message });
  }
};

exports.login = async (req, res) => {
  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, 'user login');
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log('Login failed: User not found for email:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('Login failed: Password mismatch for user:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        profileId: user.profileId,
        employerId: user.employerId
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return dbUnavailableResponse(res, 'user login');
    }
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
