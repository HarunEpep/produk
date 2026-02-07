const axios = require("axios");
const fetch = require("node-fetch");
const config = require("./config");

const parseError = (err) => err?.response?.data ? JSON.stringify(err.response.data) : (err.message || String(err));

async function createUser({ email, username, first_name, last_name, password, root_admin = false }) {
  try {
    const resUser = await fetch(`${config.PTERO_DOMAIN}/api/application/users`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.PTERO_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        email: email,
        username: username,
        first_name: first_name,
        last_name: last_name,
        language: "en",
        password: password,
        root_admin: root_admin
      }),
    });

    if (!resUser.ok) {
      const errorData = await resUser.text();
      throw new Error(`Failed to create user (${resUser.status}): ${errorData}`);
    }

    const userData = await resUser.json();
    return userData.attributes;

  } catch (err) {
    err.message = "createUser Ptero: " + parseError(err);
    throw err;
  }
}

async function createServer({ name, description, userId, ram, disk, cpu, featureLimits, isPrivate = false }) {
  try {
    // Konversi RAM ke spesifikasi yang tepat
    let memo, diskSize, cpuLimit;
    switch (ram.toLowerCase()) {
      case "1": cpuLimit = 30; memo = 1048; diskSize = 1048; break;
      case "2": cpuLimit = 50; memo = 2048; diskSize = 2048; break;
      case "3": cpuLimit = 80; memo = 3048; diskSize = 3048; break;
      case "4": cpuLimit = 100; memo = 4048; diskSize = 4048; break;
      case "5": cpuLimit = 120; memo = 5048; diskSize = 5048; break;
      case "6": cpuLimit = 140; memo = 6048; diskSize = 6048; break;
      case "7": cpuLimit = 160; memo = 7048; diskSize = 7048; break;
      case "8": cpuLimit = 180; memo = 8048; diskSize = 8048; break;
      case "9": cpuLimit = 200; memo = 9048; diskSize = 9048; break;
      case "unli": case "unlimited": cpuLimit = 0; memo = 0; diskSize = 0; break;
      default: cpuLimit = cpu || 30; memo = ram * 1024 || 1048; diskSize = disk || 1048;
    }

    const serverConfig = {
      name: name,
      description: description || (isPrivate ? "Private Panel" : "Public Panel"),
      user: userId,
      egg: parseInt(config.PTERO_EGG),
      docker_image: "ghcr.io/parkervcp/yolks:nodejs_18",
      startup: 'if [ -f /home/container/package.json ]; then npm install; fi; npm start',
      environment: {
        INST: "npm",
        USER_UPLOAD: "0",
        AUTO_UPDATE: "0",
        CMD_RUN: "npm start"
      },
      limits: {
        memory: memo,
        swap: 0,
        disk: diskSize,
        io: 500,
        cpu: cpuLimit
      },
      feature_limits: featureLimits || {
        databases: 5,
        backups: 5,
        allocations: 1
      },
      deploy: {
        locations: [parseInt(config.PTERO_LOC)],
        dedicated_ip: false,
        port_range: []
      }
    };

    const resServer = await fetch(`${config.PTERO_DOMAIN}/api/application/servers`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${config.PTERO_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(serverConfig),
    });

    if (!resServer.ok) {
      const errorData = await resServer.text();
      throw new Error(`Failed to create server (${resServer.status}): ${errorData}`);
    }

    const serverData = await resServer.json();
    return serverData.attributes;

  } catch (err) {
    err.message = "createServer Ptero: " + parseError(err);
    throw err;
  }
}

module.exports = { createUser, createServer };