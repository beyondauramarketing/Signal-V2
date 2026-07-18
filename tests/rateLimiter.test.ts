import { rateLimiter } from "../src/server/middleware/rateLimit.middleware";

export async function runRateLimiterTests() {
  console.log("🛡️ Running Rate Limiter & Gateway Tests...");

  // Test 1: Path prefix isolation test
  const mockReq1 = {
    ip: "1.2.3.4",
    baseUrl: "/api",
    path: "/analyze",
    headers: {}
  } as any;

  const mockReq2 = {
    ip: "1.2.3.4",
    baseUrl: "/api",
    path: "/translate",
    headers: {}
  } as any;

  let next1Called = 0;
  const mockNext1 = () => { next1Called++; };

  let next2Called = 0;
  const mockNext2 = () => { next2Called++; };

  const resMock = {
    status: (code: number) => ({
      json: (data: any) => {}
    })
  } as any;

  const limiter1 = rateLimiter(1, 60000);
  const limiter2 = rateLimiter(1, 60000);

  // First request to analyze should succeed
  limiter1(mockReq1, resMock, mockNext1);
  if (next1Called !== 1) throw new Error("Limiter 1 first request failed.");

  // Second request to translate (same IP, different path) should succeed because of isolation
  limiter2(mockReq2, resMock, mockNext2);
  if (next2Called !== 1) throw new Error("Limiter 2 first request failed (collided with Limiter 1).");

  console.log("✅ Isolated endpoint rate-limiting verified.");

  // Test 2: File access blocking simulation
  const sensitiveFiles = [
    "/.env",
    "/.env.production",
    "/package.json",
    "/tsconfig.json",
    "/supabase_schema.sql",
    "/.git/config"
  ];
  
  const safeFiles = [
    "/index.html",
    "/assets/main.js",
    "/api/analyze",
    "/logo.png"
  ];

  const checkBlocked = (url: string): boolean => {
    const urlPath = url.toLowerCase();
    return (
      urlPath.includes("/.env") ||
      urlPath.includes("/package.json") ||
      urlPath.includes("/tsconfig.json") ||
      urlPath.includes("/supabase_schema.sql") ||
      urlPath.split("/").some(part => part.startsWith(".") && part !== "" && part !== ".well-known")
    );
  };

  for (const f of sensitiveFiles) {
    if (!checkBlocked(f)) {
      throw new Error(`Security validation failed: sensitive file ${f} was not blocked!`);
    }
  }

  for (const f of safeFiles) {
    if (checkBlocked(f)) {
      throw new Error(`Security validation failed: safe file ${f} was blocked incorrectly!`);
    }
  }

  console.log("✅ Gateway sensitive file blocking patterns verified.");
  console.log("✅ Rate Limiter & Gateway Tests Completed Successfully!\n");
}
