/**
 * Manual API Smoke Test Script
 * 
 * This script tests the entire Phase 3 flow:
 * 1. Create a project
 * 2. Create a collection
 * 3. Create an API endpoint
 * 4. Wait for route registration
 * 5. Test the mock endpoint
 * 
 * Running Instructions:
 * ====================
 * 1. Make sure the server is running:
 *    cd mock-desktop/server
 *    npm run dev
 * 
 * 2. Run this test script:
 *    node test/manualApiSmokeTest.js
 * 
 * Requirements:
 * - Node.js 18+ (for native fetch support)
 * - Server running on http://127.0.0.1:5050
 * 
 * Note: If you're using Node.js < 18, install node-fetch:
 *   npm install node-fetch@2
 *   Then uncomment the node-fetch import at the top
 */

// Uncomment if using Node.js < 18:
// const fetch = require('node-fetch');

const BASE_URL = "http://127.0.0.1:5050";

/**
 * Helper function to generate a URL-friendly slug from a string
 */
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

/**
 * Helper function to make API requests
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\n${errorText}`
    );
  }

  return response.json();
}

/**
 * Helper function to wait for a specified number of milliseconds
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main test function
 */
async function runSmokeTest() {
  console.log("🚀 Starting API Smoke Test...\n");

  try {
    // Step 1: Create a project
    console.log("📦 Step 1: Creating project...");
    const projectData = {
      name: "Smoke Test Project",
      description: "Test project for smoke testing",
    };
    const project = await apiRequest("/projects", {
      method: "POST",
      body: JSON.stringify(projectData),
    });
    console.log("✅ Project created:", project);
    console.log(`   ID: ${project.id}`);
    console.log(`   Name: ${project.name}\n`);

    // Step 2: Create a collection
    console.log("📁 Step 2: Creating collection...");
    const collectionSlug = "smoke-test";
    const collectionData = {
      name: "Smoke Test Collection",
      slug: collectionSlug,
    };
    const collection = await apiRequest(
      `/projects/${project.id}/collections`,
      {
        method: "POST",
        body: JSON.stringify(collectionData),
      }
    );
    console.log("✅ Collection created:", collection);
    console.log(`   ID: ${collection.id}`);
    console.log(`   Slug: ${collection.slug}\n`);

    // Step 3: Create an API endpoint
    console.log("🔌 Step 3: Creating API endpoint...");
    const apiData = {
      method: "GET",
      endpoint: "/hello",
      status_code: 200,
      response_type: "text/plain",
      response_body: "hello world",
      delay_ms: 0,
    };
    const api = await apiRequest(`/collections/${collection.id}/apis`, {
      method: "POST",
      body: JSON.stringify(apiData),
    });
    console.log("✅ API created:", api);
    console.log(`   ID: ${api.id}`);
    console.log(`   Method: ${api.method}`);
    console.log(`   Endpoint: ${api.endpoint}\n`);

    // Step 4: Wait 500ms for route registration
    console.log("⏳ Step 4: Waiting 500ms for route registration...");
    await wait(500);
    console.log("✅ Wait complete\n");

    // Step 5: Fetch the mock endpoint
    console.log("🌐 Step 5: Fetching mock endpoint...");
    const projectSlug = slugify(project.name);
    const mockUrl = `${BASE_URL}/mock/${projectSlug}/${collectionSlug}/hello`;
    console.log(`   URL: ${mockUrl}`);

    const mockResponse = await fetch(mockUrl, {
      method: "GET",
    });

    const responseBody = await mockResponse.text();

    console.log("\n📊 Mock Endpoint Response:");
    console.log(`   Status: ${mockResponse.status} ${mockResponse.statusText}`);
    console.log(`   Content-Type: ${mockResponse.headers.get("content-type")}`);
    console.log(`   Body: "${responseBody}"`);

    // Verify the response
    if (mockResponse.status === 200 && responseBody === "hello world") {
      console.log("\n✅ SUCCESS: Mock endpoint returned expected response!");
      console.log("   ✓ Status code: 200");
      console.log("   ✓ Response body: 'hello world'");
    } else {
      console.log("\n❌ FAILURE: Mock endpoint did not return expected response");
      console.log(`   Expected: Status 200, Body "hello world"`);
      console.log(`   Got: Status ${mockResponse.status}, Body "${responseBody}"`);
      process.exit(1);
    }

    console.log("\n🎉 Smoke test completed successfully!");
  } catch (error) {
    console.error("\n❌ Smoke test failed with error:");
    console.error(error.message);
    if (error.stack) {
      console.error("\nStack trace:");
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
runSmokeTest();

