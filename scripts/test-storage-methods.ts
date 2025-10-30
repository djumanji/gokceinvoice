import "../server/config/env";
import { storage } from "../server/storage";

async function testStorageMethods() {
  try {
    console.log("=== Testing Storage Methods ===");
    console.log("Storage type:", storage.constructor.name);
    console.log("Storage instance:", storage);
    console.log("");
    
    // Check if getUserByUsername exists
    console.log("getUserByUsername method exists:", typeof storage.getUserByUsername);
    console.log("getUserByUsername is function:", typeof storage.getUserByUsername === 'function');
    console.log("");
    
    // Try to call it
    console.log("Testing getUserByUsername('djumanji')...");
    const user = await storage.getUserByUsername("djumanji");
    console.log("Result:", user ? `Found: ${user.email}` : "Not found");
    
    if (!user) {
      console.log("\n❌ getUserByUsername returned undefined!");
      console.log("This means the method exists but didn't find the user.");
    } else {
      console.log("\n✅ getUserByUsername works!");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    process.exit(1);
  }
}

testStorageMethods();

