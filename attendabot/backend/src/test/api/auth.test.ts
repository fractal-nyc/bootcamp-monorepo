/**
 * @fileoverview Tests for BetterAuth session middleware (api/middleware/auth.ts).
 */

import { describe, it, expect, vi } from "vitest";
import type { Response, NextFunction } from "express";

// Mock the BetterAuth module
const mockGetSession = vi.fn();
vi.mock("../../auth", () => ({
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

vi.mock("better-auth/node", () => ({
  fromNodeHeaders: vi.fn((headers: Record<string, string>) => new Headers(headers as Record<string, string>)),
}));

import {
  authenticateToken,
  AuthRequest,
} from "../../api/middleware/auth";

describe("Auth Middleware", () => {
  describe("authenticateToken middleware", () => {
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
        user: { name: "TestUser", email: "test@example.com" },
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
    });

    it("uses email as username when name is not available", async () => {
      mockGetSession.mockResolvedValue({
        user: { name: null, email: "test@example.com" },
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
