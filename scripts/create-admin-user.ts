import "../server/config/env";
import { hashPassword } from "../server/auth";
import { storage } from "../server/storage";

async function createAdminUser() {
  const email = "djumanji";
  const password = "cmre7163";
  const username = "djumanji";

  try {
    // Check if admin user already exists
    const existingUser = await storage.getUserByEmail(email);
    
    if (existingUser) {
      // Update existing user to be admin
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(existingUser.id, {
        password: hashedPassword,
        isAdmin: true,
        username: username,
      });
      console.log(`✅ Admin user updated: ${email}`);
      console.log(`   User ID: ${existingUser.id}`);
    } else {
      // Create new admin user
      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        username,
        provider: "local",
        isEmailVerified: true,
        isAdmin: true,
      });
      console.log(`✅ Admin user created: ${email}`);
      console.log(`   User ID: ${user.id}`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    process.exit(1);
  }
}

createAdminUser();

