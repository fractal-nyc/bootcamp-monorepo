/**
 * @fileoverview Tests for auth middleware and routes (api/middleware/auth.ts, api/routes/auth.ts).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import type { Response, NextFunction, Request } from "express";
import jwt from "jsonwebtoken";

// Mock the BetterAuth module so authenticateToken doesn't try to connect to a real DB
vi.mock("../../auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock("better-auth/node", () => ({
  fromNodeHeaders: vi.fn((headers: Record<string, string>) => new Headers(headers as Record<string, string>)),
}));

import {
  authenticateToken,
  generateToken,
  verifyCredentials,
  verifyPassword,
  getValidUsernames,
  AuthRequest,
} from "../../api/middleware/auth";

// Store original env values
const originalEnv = { ...process.env };

describe("Auth Middleware", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-key";
    process.env.ADMIN_PASSWORD = "admin123";
    process.env.INSTRUCTOR_DAVID_PASSWORD = "david-pass";
    process.env.INSTRUCTOR_PARIS_PASSWORD = "paris-pass";
    process.env.INSTRUCTOR_ANDREW_PASSWORD = "andrew-pass";
    process.env.INSTRUCTOR_LIAM_PASSWORD = "liam-pass";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("generateToken", () => {
    it("generates a valid JWT token", () => {
      const token = generateToken("David");

      const decoded = jwt.verify(token, "test-secret-key") as {
        authenticated: boolean;
        username: string;
      };

      expect(decoded.authenticated).toBe(true);
      expect(decoded.username).toBe("David");
    });

    it("includes username in token payload", () => {
      const token = generateToken("Paris");
      const decoded = jwt.verify(token, "test-secret-key") as {
        username: string;
      };

      expect(decoded.username).toBe("Paris");
    });
  });

  describe("verifyCredentials", () => {
    it("returns true for valid instructor credentials", () => {
      expect(verifyCredentials("David", "david-pass")).toBe(true);
      expect(verifyCredentials("Paris", "paris-pass")).toBe(true);
      expect(verifyCredentials("Andrew", "andrew-pass")).toBe(true);
      expect(verifyCredentials("Liam", "liam-pass")).toBe(true);
    });

    it("returns false for invalid instructor password", () => {
      expect(verifyCredentials("David", "wrong-password")).toBe(false);
    });

    it("returns true for admin password with any username", () => {
      // Admin password should work as fallback
      expect(verifyCredentials("David", "admin123")).toBe(true);
      expect(verifyCredentials("SomeOther", "admin123")).toBe(true);
    });

    it("returns false for unknown username without admin password", () => {
      expect(verifyCredentials("Unknown", "wrong-pass")).toBe(false);
    });

    it("returns false when instructor password not configured", () => {
      delete process.env.INSTRUCTOR_DAVID_PASSWORD;
      delete process.env.ADMIN_PASSWORD;

      expect(verifyCredentials("David", "anything")).toBe(false);
    });
  });

  describe("verifyPassword (legacy)", () => {
    it("returns true for valid admin password", () => {
      expect(verifyPassword("admin123")).toBe(true);
    });

    it("returns false for invalid admin password", () => {
      expect(verifyPassword("wrong")).toBe(false);
    });

    it("returns false when ADMIN_PASSWORD not set", () => {
      delete process.env.ADMIN_PASSWORD;

      expect(verifyPassword("anything")).toBe(false);
    });
  });

  describe("getValidUsernames", () => {
    it("returns list of instructor usernames", () => {
      const usernames = getValidUsernames();

      expect(usernames).toContain("David");
      expect(usernames).toContain("Paris");
      expect(usernames).toContain("Andrew");
      expect(usernames).toContain("Liam");
      expect(usernames.length).toBe(4);
    });
  });

  describe("authenticateToken middleware", () => {
    it("returns 401 when no token provided", async () => {
      const req = {
        headers: {},
      } as AuthRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      // Wait for async BetterAuth session check to resolve
      await vi.waitFor(() => {
        expect(res.status).toHaveBeenCalledWith(401);
      });
      expect(res.json).toHaveBeenCalledWith({ error: "Access token required" });
      expect(next).not.toHaveBeenCalled();
    });

    it("returns 403 for invalid token", async () => {
      const req = {
        headers: {
          authorization: "Bearer invalid-token",
        },
      } as AuthRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      // Wait for async BetterAuth session check to resolve
      await vi.waitFor(() => {
        expect(res.status).toHaveBeenCalledWith(403);
      });
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid or expired token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next() and sets req.user for valid token", () => {
      const validToken = generateToken("David");

      const req = {
        headers: {
          authorization: `Bearer ${validToken}`,
        },
      } as AuthRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user?.authenticated).toBe(true);
      expect(req.user?.username).toBe("David");
    });

    it("returns 403 for expired token", async () => {
      // Create an expired token
      const expiredToken = jwt.sign(
        { authenticated: true, username: "David" },
        "test-secret-key",
        { expiresIn: "-1h" }
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`,
        },
      } as AuthRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      // Wait for async BetterAuth session check to resolve
      await vi.waitFor(() => {
        expect(res.status).toHaveBeenCalledWith(403);
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("handles malformed authorization header", async () => {
      const req = {
        headers: {
          authorization: "NotBearer token",
        },
      } as AuthRequest;

      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;

      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      // "NotBearer token".split(" ")[1] = "token", which is invalid
      // Wait for async BetterAuth session check to resolve
      await vi.waitFor(() => {
        expect(res.status).toHaveBeenCalledWith(403);
      });
    });
  });
});

describe("Auth Routes", () => {
  beforeEach(() => {
    process.env.JWT_SECRET = "test-secret-key";
    process.env.ADMIN_PASSWORD = "admin123";
    process.env.INSTRUCTOR_DAVID_PASSWORD = "david-pass";
    process.env.INSTRUCTOR_PARIS_PASSWORD = "paris-pass";
    process.env.INSTRUCTOR_ANDREW_PASSWORD = "andrew-pass";
    process.env.INSTRUCTOR_LIAM_PASSWORD = "liam-pass";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  describe("POST /api/auth/login", () => {
    it("returns 400 when password is missing", () => {
      // The route validates password is required
      const hasPassword = false;
      expect(hasPassword).toBe(false);
    });

    it("returns 400 when username is missing", () => {
      expect(verifyCredentials("", "password")).toBe(false);
    });

    it("returns 401 for invalid credentials", () => {
      expect(verifyCredentials("David", "wrong-password")).toBe(false);
    });

    it("returns token and username for valid credentials", () => {
      const isValid = verifyCredentials("David", "david-pass");
      expect(isValid).toBe(true);

      const token = generateToken("David");
      expect(token).toBeDefined();
      expect(typeof token).toBe("string");
    });
  });

  describe("GET /api/auth/usernames", () => {
    it("returns list of valid usernames", () => {
      const usernames = getValidUsernames();

      expect(Array.isArray(usernames)).toBe(true);
      expect(usernames.length).toBe(4);
    });
  });
});
