import { defineConvexConfig } from "convex/server";

export default defineConvexConfig({
  // The path to your schema file
  schema: "./schema.ts",
  
  // The path to your functions directory
  functions: {
    // Define your functions here
  },
  
  // The path to your generated types
  generated: "./generated",
  
  // The path to your node_modules
  nodeModules: "../../../node_modules",
});
