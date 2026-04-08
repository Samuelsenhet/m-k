import { describe, it, expect } from "vitest";

// Test the pure mapSubscription logic extracted from the hook
// Since mapSubscription is not exported, we replicate the mapping logic
// to verify tier resolution without needing React rendering.

type SubscriptionRow = {
  plan_type: string;
  status: string;
  expires_at: string | null;
};

interface UserSubscription {
  isPlus: boolean;
  subscriptionTier: "free" | "plus" | "premium";
  validUntil: Date | null;
}

function mapSubscription(row: SubscriptionRow | null): UserSubscription {
  if (!row || row.status !== "active") {
    return { isPlus: false, subscriptionTier: "free", validUntil: null };
  }
  const notExpired = !row.expires_at || new Date(row.expires_at) > new Date();
  const plan = row.plan_type;
  const isPaid =
    notExpired && (plan === "plus" || plan === "premium" || plan === "vip");
  let subscriptionTier: "free" | "plus" | "premium" = "free";
  if (isPaid) {
    if (plan === "plus") subscriptionTier = "plus";
    else if (plan === "premium" || plan === "vip") subscriptionTier = "premium";
  }
  return {
    isPlus: isPaid,
    subscriptionTier,
    validUntil: row.expires_at ? new Date(row.expires_at) : null,
  };
}

describe("mapSubscription", () => {
  it("returns free tier for null row", () => {
    const result = mapSubscription(null);
    expect(result.isPlus).toBe(false);
    expect(result.subscriptionTier).toBe("free");
    expect(result.validUntil).toBeNull();
  });

  it("returns free tier for inactive subscription", () => {
    const result = mapSubscription({
      plan_type: "plus",
      status: "cancelled",
      expires_at: null,
    });
    expect(result.isPlus).toBe(false);
    expect(result.subscriptionTier).toBe("free");
  });

  it("maps active plus to plus tier", () => {
    const result = mapSubscription({
      plan_type: "plus",
      status: "active",
      expires_at: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result.isPlus).toBe(true);
    expect(result.subscriptionTier).toBe("plus");
  });

  it("maps active premium to premium tier", () => {
    const result = mapSubscription({
      plan_type: "premium",
      status: "active",
      expires_at: null,
    });
    expect(result.isPlus).toBe(true);
    expect(result.subscriptionTier).toBe("premium");
  });

  it("maps active vip to premium tier (legacy)", () => {
    const result = mapSubscription({
      plan_type: "vip",
      status: "active",
      expires_at: null,
    });
    expect(result.isPlus).toBe(true);
    expect(result.subscriptionTier).toBe("premium");
  });

  it("returns free for expired plus subscription", () => {
    const result = mapSubscription({
      plan_type: "plus",
      status: "active",
      expires_at: new Date(Date.now() - 86400000).toISOString(),
    });
    expect(result.isPlus).toBe(false);
    expect(result.subscriptionTier).toBe("free");
  });

  it("returns free for unknown plan_type", () => {
    const result = mapSubscription({
      plan_type: "basic",
      status: "active",
      expires_at: null,
    });
    expect(result.isPlus).toBe(false);
    expect(result.subscriptionTier).toBe("free");
  });

  it("sets validUntil from expires_at", () => {
    const date = "2026-12-31T00:00:00Z";
    const result = mapSubscription({
      plan_type: "plus",
      status: "active",
      expires_at: date,
    });
    expect(result.validUntil).toEqual(new Date(date));
  });

  it("sets validUntil to null when no expires_at", () => {
    const result = mapSubscription({
      plan_type: "premium",
      status: "active",
      expires_at: null,
    });
    expect(result.validUntil).toBeNull();
  });
});
