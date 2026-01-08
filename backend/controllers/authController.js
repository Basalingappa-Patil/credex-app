const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { checkDBConnection, dbUnavailableResponse } = require('../utils/dbHealth');

exports.signup = async (req, res) => {
  console.log('Signup Request Body:', req.body); // DEBUG LOG

  if (!checkDBConnection()) {
    return dbUnavailableResponse(res, 'user registration');
  }

  try {
    let { email, password, name, role, profileId, universityName, employerId } = req.body;

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
      console.log('Signup failed: Email already registered:', email);
      return res.status(400).json({ error: 'Email already registered' });
    }

    if (profileId) {
      const existingProfileId = await User.findOne({ profileId });
      if (existingProfileId) {
        console.log('Signup failed: Candidate ID taken:', profileId);
        return res.status(400).json({ error: 'Candidate ID already taken' });
      }
    }

    if (employerId) {
      const existingEmployerId = await User.findOne({ employerId });
      if (existingEmployerId) {
        console.log('Signup failed: Employer ID taken:', employerId);
        return res.status(400).json({ error: 'Employer ID already taken' });
      }
    }

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'candidate',
      profileId,
      universityName,
      employerId
    });

    const token = generateToken(user._id, user.role);

    console.log('Signup successful for:', email);
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
    console.error('Signup error details:', error); // DETAILED LOG
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      return dbUnavailableResponse(res, 'user registration');
    }
    // Return the actual error message for debugging (remove in prod)
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
