import os from "node:os";

function getNetworkAddresses(port: number): string[] {
  const interfaces = os.networkInterfaces();

  const addresses: string[] = [];

  for (const entries of Object.values(interfaces)) {
    if (!entries) {
      continue;
    }

    for (const network of entries) {
      if (network.family === "IPv4" && !network.internal) {
        addresses.push(`http://${network.address}:${port}`);
      }
    }
  }

  return addresses;
}

export { getNetworkAddresses };
