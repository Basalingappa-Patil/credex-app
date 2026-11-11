const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { checkDBConnection, dbUnavailableResponse } = require('../utils/dbHealth');
const { getPublicRegistrationRole } = require('../utils/registrationPolicy');

exports.signup = async (req, res) => {
  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, 'user registration');
  }

  try {
    let { email, password, name, profileId, universityName, employerId } = req.body;
    // Public self-registration must never create privileged accounts.
    // Employer accounts remain self-service in this prototype, but admin provisioning is out-of-band.
    const role = getPublicRegistrationRole(req.body.role);
    if (!role) {
      return res.status(403).json({ error: 'This role cannot be created through public registration' });
    }

    // Sanitize inputs: Convert empty strings to undefined
    if (!profileId || profileId.trim() === '') {
      // Auto-generate profileId if missing
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const namePrefix = name ? name.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'user';
      profileId = `${namePrefix}${randomSuffix}`;
    }
    if (!employerId) employerId = undefined;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.warn('Signup rejected: email already registered');
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (profileId) {
      const existingProfileId = await User.findOne({ profileId });
      if (existingProfileId) {
        console.warn('Signup rejected: candidate profile ID already exists');
        return res.status(400).json({ error: 'Candidate ID already taken' });
      }
    }

    if (employerId) {
      const existingEmployerId = await User.findOne({ employerId });
      if (existingEmployerId) {
        console.warn('Signup rejected: employer ID already exists');
        return res.status(400).json({ error: 'Employer ID already taken' });
      }
    }

    const user = await User.create({
      email,
      password,
      name,
      role,
      profileId,
      universityName,
      employerId
    });

    const token = generateToken(user._id, user.role);

    console.log('Signup successful');
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
    console.error('Signup failed:', error.name || 'UnknownError');
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return dbUnavailableResponse(res, 'user registration');
    }
    res.status(500).json({ error: 'Registration failed' });
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
      console.warn('Login failed: unknown account');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn('Login failed: invalid credentials');
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
