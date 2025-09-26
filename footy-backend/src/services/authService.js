const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  // Generate JWT token
  generateToken(userId) {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });
  }

  // Register new user
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { username: userData.username }
        ]
      });

      if (existingUser) {
        if (existingUser.email === userData.email) {
          throw new Error('User with this email already exists');
        }
        if (existingUser.username === userData.username) {
          throw new Error('Username is already taken');
        }
      }

      // Create new user
      const user = new User(userData);
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      // Return user data without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResponse,
          token
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Login user
  async login(identifier, password) {
    try {
      // Find user by email or username
      const user = await User.findOne({
        $or: [
          { email: identifier.toLowerCase() },
          { username: identifier.toLowerCase() }
        ]
      }).select('+password');

      if (!user) {
        throw new Error('Invalid credentials');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        throw new Error('Invalid credentials');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Check if user is suspended
      if (user.isSuspended) {
        // Check if suspension has expired
        if (user.suspensionExpiresAt && new Date() > user.suspensionExpiresAt) {
          user.isSuspended = false;
          user.suspensionReason = null;
          user.suspensionExpiresAt = null;
          await user.save();
        } else {
          throw new Error(`Account is suspended. Reason: ${user.suspensionReason || 'Account violation'}`);
        }
      }

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      // Generate token
      const token = this.generateToken(user._id);

      // Return user data without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        success: true,
        message: 'Login successful',
        data: {
          user: userResponse,
          token
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Get current user profile
  async getProfile(userId) {
    try {
      const user = await User.findById(userId).select('-password');
      if (!user) {
        throw new Error('User not found');
      }

      return {
        success: true,
        message: 'Profile retrieved successfully',
        data: { user }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // If updating username, check if it's already taken
      if (updateData.username && updateData.username !== user.username) {
        const existingUser = await User.findOne({ username: updateData.username });
        if (existingUser) {
          throw new Error('Username is already taken');
        }
      }

      // Update user fields
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          user[key] = updateData[key];
        }
      });

      await user.save();

      // Return updated user without password
      const userResponse = user.toObject();
      delete userResponse.password;

      return {
        success: true,
        message: 'Profile updated successfully',
        data: { user: userResponse }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Change user password
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findById(userId).select('+password');
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      // Check if new password is different
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        throw new Error('New password must be different from current password');
      }

      // Update password
      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Find nearby players
  async findNearbyPlayers(userId, maxDistance = 10000) {
    try {
      const currentUser = await User.findById(userId);
      if (!currentUser) {
        throw new Error('User not found');
      }

      const [longitude, latitude] = currentUser.location.coordinates;

      const nearbyPlayers = await User.findNearby(longitude, latitude, maxDistance)
        .select('-password')
        .limit(50); // Limit to 50 nearby players

      // Filter out the current user
      const filteredPlayers = nearbyPlayers.filter(player => 
        player._id.toString() !== userId
      );

      return {
        success: true,
        message: 'Nearby players retrieved successfully',
        data: {
          players: filteredPlayers,
          count: filteredPlayers.length
        }
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Deactivate user account
  async deactivateAccount(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.isActive = false;
      await user.save();

      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }

  // Reactivate user account
  async reactivateAccount(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      user.isActive = true;
      await user.save();

      return {
        success: true,
        message: 'Account reactivated successfully'
      };
    } catch (error) {
      throw new Error(error.message);
    }
  }
}

module.exports = new AuthService();