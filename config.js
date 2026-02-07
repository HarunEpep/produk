module.exports = {
  // Atlantic Pedia Configuration
  ATLANTIC_API_KEY: "YOUR_ATLANTIC_API_KEY_HERE", // Ganti dengan API key Atlantic Pedia Anda

  // Pterodactyl Configuration
  PTERO_EGG: "15",
  PTERO_NEST_ID: "1",
  PTERO_LOC: "1",
  PTERO_DOMAIN: "https://alpha.yop4nhosting.my.id",
  PTERO_API_KEY: "ptla_lr5D0WEBXObW4mYLMUoXHusNkQqNgTo5wuYFbnTJF38",
  PTERO_CLIENT_KEY: "ptlc_AV8NDWJGcY15gPm6zUdtmF6qyHtcazC5aKfzHT2s2rL",

  // Pricing (sesuai dengan website)
  PACKAGE_PRICES: {
    '1gb': 11000,
    '2gb': 15000,
    '3gb': 19700,
    '4gb': 26500,
    'unli1bln': 30000,
    'unli2bln': 42000,
    'unli3bln': 50000,
    'unli4bln': 67000
  },

  // Package Specifications
  PACKAGE_SPECS: {
    '1gb': { ram: 1024, cpu: 40, disk: 1024, label: 'Panel 1 GB' },
    '2gb': { ram: 2048, cpu: 70, disk: 2048, label: 'Panel 2 GB' },
    '3gb': { ram: 3072, cpu: 100, disk: 3072, label: 'Panel 3 GB' },
    '4gb': { ram: 4096, cpu: 120, disk: 4096, label: 'Panel 4 GB' },
    'unli1bln': { ram: 0, cpu: 0, disk: 0, label: 'Unlimited 1 Bulan', unlimited: true },
    'unli2bln': { ram: 0, cpu: 0, disk: 0, label: 'Unlimited 2 Bulan', unlimited: true },
    'unli3bln': { ram: 0, cpu: 0, disk: 0, label: 'Unlimited 3 Bulan', unlimited: true },
    'unli4bln': { ram: 0, cpu: 0, disk: 0, label: 'Unlimited 4 Bulan', unlimited: true }
  }
};