/// <reference types="vitest/globals" />
import { describe, it, expect } from "vitest";
import { cn, getInstagramUsername, getLinkedInUsername } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("getInstagramUsername", () => {
  it("returns handle without @", () => {
    expect(getInstagramUsername("user")).toBe("user");
    expect(getInstagramUsername("@user")).toBe("user");
  });
  it("extracts from URL", () => {
    expect(getInstagramUsername("https://instagram.com/foo")).toBe("foo");
  });
});

describe("getLinkedInUsername", () => {
  it("returns handle without @", () => {
    expect(getLinkedInUsername("user")).toBe("user");
  });
  it("extracts from URL", () => {
    expect(getLinkedInUsername("https://linkedin.com/in/bar")).toBe("bar");
  });
});
