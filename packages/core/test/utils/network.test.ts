import { describe, beforeAll, afterAll, expect, it, vi } from "vitest";

vi.mock("node:os", async (importOriginal) => {
  const actual = (await importOriginal()) as any;
  const mocked = vi.fn();
  return {
    ...actual,
    default: {
      ...actual.default,
      networkInterfaces: mocked,
    },
    networkInterfaces: mocked,
  };
});

import os from "node:os";
import { getNetworkAddresses } from "../../src/utils/network";

const iface = (address: string, family: string, internal: boolean) => ({
  address,
  netmask: "255.255.255.0",
  family,
  internal,
  mac: "00:00:00:00:00:00",
  cidr: `${address}/24`,
});

describe("getNetworkAddresses", () => {
  beforeAll(() => {
    vi.mocked(os.networkInterfaces).mockReset();
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("returns http URLs for non-internal IPv4 addresses", () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({
      eth0: [
        iface("192.168.1.10", "IPv4", false),
        iface("fe80::1", "IPv6", false),
      ],
      lo: [iface("127.0.0.1", "IPv4", true)],
    } as any);

    expect(getNetworkAddresses(3000)).toEqual(["http://192.168.1.10:3000"]);
  });

  it("returns an empty array when there are no matching interfaces", () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({});

    expect(getNetworkAddresses(3000)).toEqual([]);
  });

  it("ignores entries with a null value", () => {
    vi.mocked(os.networkInterfaces).mockReturnValue({ eth0: null } as any);

    expect(getNetworkAddresses(3000)).toEqual([]);
  });
});