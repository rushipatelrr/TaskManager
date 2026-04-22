const User = require('../models/User');

/**
 * Seeds a default admin user on server startup.
 * Reads credentials from environment variables:
 *   ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD
 *
 * - If all three env vars are set and no user with that email exists → creates the admin.
 * - If the user already exists but isn't an admin → promotes them to admin.
 * - If the admin already exists → does nothing (no-op).
 */
const seedAdmin = async () => {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

  // Skip if admin credentials are not configured
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return;
  }

  try {
    const existingUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    if (existingUser) {
      // If user exists but isn't admin, promote them
      if (existingUser.role !== 'admin') {
        existingUser.role = 'admin';
        await existingUser.save();
        console.log(`👑 Existing user "${ADMIN_EMAIL}" promoted to admin.`);
      }
      // Already an admin — nothing to do
      return;
    }

    // Create new admin user
    await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase(),
      password: ADMIN_PASSWORD,
      role: 'admin',
    });

    console.log(`👑 Default admin created: ${ADMIN_EMAIL}`);
  } catch (error) {
    console.error('❌ Admin seed error:', error.message);
  }
};

module.exports = seedAdmin;
