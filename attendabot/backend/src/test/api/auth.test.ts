/**
 * @fileoverview Tests for auth middleware (api/middleware/auth.ts).
 * Covers both API key and BetterAuth session authentication.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Response, NextFunction } from "express";

// Mock the BetterAuth module
const mockGetSession = vi.fn();
const mockGetUserRole = vi.fn();
const mockAuthDbPrepare = vi.fn();
vi.mock("../../auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
  getUserRole: (...args: unknown[]) => mockGetUserRole(...args),
  getAuthDatabase: () => ({
    prepare: (...args: unknown[]) => mockAuthDbPrepare(...args),
  }),
}));

vi.mock("better-auth/node", () => ({
  fromNodeHeaders: vi.fn((headers: Record<string, string>) => new Headers(headers as Record<string, string>)),
}));

const mockValidateApiKey = vi.fn();
vi.mock("../../services/apiKeys", () => ({
  validateApiKey: (...args: unknown[]) => mockValidateApiKey(...args),
}));

import {
  authenticateToken,
  AuthRequest,
} from "../../api/middleware/auth";

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: auth DB returns a Discord account, getUserRole returns "instructor"
    mockAuthDbPrepare.mockReturnValue({
      get: () => ({ accountId: "discord123" }),
    });
    mockGetUserRole.mockReturnValue("instructor");
  });

  describe("API key authentication", () => {
    it("calls next() for a valid API key", () => {
      mockValidateApiKey.mockReturnValue(true);

      const req = { headers: { "x-api-key": "valid-key" } } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      expect(mockValidateApiKey).toHaveBeenCalledWith("valid-key");
      expect(next).toHaveBeenCalled();
      expect(req.user).toEqual({ authenticated: true, username: "api-key", role: "instructor" });
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("returns 401 for an invalid API key", () => {
      mockValidateApiKey.mockReturnValue(false);

      const req = { headers: { "x-api-key": "bad-key" } } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: "Invalid API key" });
      expect(next).not.toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
    });

    it("falls through to BetterAuth when no x-api-key header is present", async () => {
      mockGetSession.mockResolvedValue(null);

      const req = { headers: {} } as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      expect(mockValidateApiKey).not.toHaveBeenCalled();
      await vi.waitFor(() => {
        expect(res.status).toHaveBeenCalledWith(401);
      });
    });
  });

  describe("BetterAuth session authentication", () => {
    it("returns 401 when no session exists", async () => {
      mockGetSession.mockResolvedValue(null);

      const req = { headers: {} } as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      await vi.waitFor(() => {
        expect(res.status).toHaveBeenCalledWith(401);
      });
      expect(res.json).toHaveBeenCalledWith({ error: "Authentication required" });
      expect(next).not.toHaveBeenCalled();
    });

    it("calls next() and sets req.user for valid BetterAuth session", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user1", name: "TestUser", email: "test@example.com" },
      });

      const req = { headers: { cookie: "session=abc123" } } as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });
      expect(req.user).toBeDefined();
      expect(req.user?.authenticated).toBe(true);
      expect(req.user?.username).toBe("TestUser");
      expect(req.user?.role).toBe("instructor");
      expect(req.user?.discordAccountId).toBe("discord123");
    });

    it("uses email as username when name is not available", async () => {
      mockGetSession.mockResolvedValue({
        user: { id: "user2", name: null, email: "test@example.com" },
      });

      const req = { headers: { cookie: "session=abc123" } } as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });
      expect(req.user?.username).toBe("test@example.com");
    });

    it("sets student role when getUserRole returns student", async () => {
      mockGetUserRole.mockReturnValue("student");
      mockGetSession.mockResolvedValue({
        user: { id: "user3", name: "StudentUser", email: "student@example.com" },
      });

      const req = { headers: { cookie: "session=abc123" } } as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      await vi.waitFor(() => {
        expect(next).toHaveBeenCalled();
      });
      expect(req.user?.role).toBe("student");
    });

    it("skips re-authentication when user is already set", () => {
      const req = {
        headers: {},
        user: { authenticated: true, username: "existing", role: "instructor" as const },
      } as unknown as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(mockGetSession).not.toHaveBeenCalled();
      expect(mockValidateApiKey).not.toHaveBeenCalled();
    });

    it("returns 401 when BetterAuth throws", async () => {
      mockGetSession.mockRejectedValue(new Error("DB error"));

      const req = { headers: {} } as AuthRequest;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as unknown as Response;
      const next = vi.fn() as unknown as NextFunction;

      authenticateToken(req, res, next);

      await vi.waitFor(() => {
        expect(res.status).toHaveBeenCalledWith(401);
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
