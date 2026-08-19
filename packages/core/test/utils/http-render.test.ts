import { describe, expect, it } from "vitest";
import { redirect } from "../../src/utils/http";
import { render } from "../../src/view/index";
import { Purpose } from "../../src/types/http_utils";

describe("redirect", () => {
  it("returns a redirect payload with default status 302", () => {
    const payload = redirect("/login");
    expect(payload).toEqual({
      __isZentifyResponse: true,
      purpose: Purpose.redirect,
      payload: { url: "/login", status: 302 },
    });
  });

  it("honors a custom status code", () => {
    const payload = redirect("https://example.com", 301);
    expect(payload.payload).toEqual({ url: "https://example.com", status: 301 });
  });
});

describe("render", () => {
  it("returns a view payload with empty props by default", () => {
    const payload = render("home");
    expect(payload).toEqual({
      __isZentifyResponse: true,
      purpose: Purpose.view,
      payload: { page: "home", props: {} },
    });
  });

  it("passes through the provided props", () => {
    const payload = render("user", { id: 1 });
    expect(payload.payload.props).toEqual({ id: 1 });
  });
});

describe("Purpose", () => {
  it("defines the known purposes", () => {
    expect(Purpose).toEqual({
      redirect: "redirect",
      view: "view",
      json: "json",
    });
  });
});