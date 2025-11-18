const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("scoreValue");
const livesEl = document.getElementById("livesValue");
const overlay = document.getElementById("gameOverlay");
const finalScoreEl = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartButton");

const config = {
  width: canvas.width,
  height: canvas.height,
  playerWidth: 38,
  playerHeight: 58,
  playerSpeed: 5.2,
  playerVerticalSpeed: 4.4,
  boostSpeed: 7.5,
  orbSize: 16,
  obstacleWidth: 30,
  obstacleHeight: 72,
  droneSize: 28,
  zapperThickness: 18,
  zapperGapMin: 110,
  zapperGapMax: 180,
  baseSpawnInterval: 1000,
  minSpawnInterval: 420,
  hazardInterval: 2800,
  difficultyRamp: 0.00045,
  lives: 3,
};

const state = {
  playerX: config.width / 2 - config.playerWidth / 2,
  playerY: config.height - config.playerHeight - 24,
  velocity: 0,
  score: 0,
  lives: config.lives,
  multiplier: 1,
  comboTimer: 0,
  boostTimer: 0,
  shieldTimer: 0,
  invulnerableTimer: 0,
  flashTimer: 0,
  difficulty: 0,
  spawnInterval: config.baseSpawnInterval,
  currentHazardInterval: config.hazardInterval,
  lastSpawn: 0,
  lastHazardSpawn: 0,
  lastFrame: 0,
  running: true,
  keys: new Set(),
  verticalVelocity: 0,
  orbs: [],
  obstacles: [],
  drones: [],
  zappers: [],
  particles: [],
};

const colors = {
  bgTop: "#04050d",
  bgBottom: "#010203",
  grid: "rgba(0, 255, 255, 0.12)",
  player: "#00f0ff",
  orb: "#ffe066",
  boost: "#9dffaf",
  shield: "#c0a6ff",
  obstacle: "#ff4f5e",
  drone: "#ffb347",
  zapper: "#ff3b7d",
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const randomRange = (min, max) => Math.random() * (max - min) + min;

const updateHUD = () => {
  scoreEl.textContent = `${state.score} ×${state.multiplier.toFixed(1)}`;
  livesEl.textContent = state.lives.toString();
};

const spawnParticles = (x, y, color, count = 10) => {
  for (let i = 0; i < count; i += 1) {
    state.particles.push({
      x,
      y,
      vx: randomRange(-1.5, 1.5),
      vy: randomRange(-2, -0.4),
      life: randomRange(0.4, 0.9),
      color,
    });
  }
};

const resetGame = () => {
  state.playerX = config.width / 2 - config.playerWidth / 2;
  state.velocity = 0;
  state.verticalVelocity = 0;
  state.score = 0;
  state.lives = config.lives;
  state.multiplier = 1;
  state.comboTimer = 0;
  state.boostTimer = 0;
  state.shieldTimer = 0;
  state.invulnerableTimer = 0;
  state.flashTimer = 0;
  state.difficulty = 0;
  state.spawnInterval = config.baseSpawnInterval;
  state.currentHazardInterval = config.hazardInterval;
  state.lastSpawn = 0;
  state.lastHazardSpawn = 0;
  state.lastFrame = 0;
  state.orbs = [];
  state.obstacles = [];
  state.drones = [];
  state.zappers = [];
  state.particles = [];
  state.running = true;
  overlay.setAttribute("aria-hidden", "true");
  overlay.classList.remove("visible");
  updateHUD();
};

const increaseCombo = (amount = 0.2) => {
  state.comboTimer = 3;
  state.multiplier = Math.min(4, parseFloat((state.multiplier + amount).toFixed(1)));
  updateHUD();
};

const collectOrb = (orb) => {
  if (orb.type === "score") {
    state.score += Math.round(10 * state.multiplier);
    increaseCombo(0.25);
    spawnParticles(orb.x, orb.y, colors.orb, 14);
  } else if (orb.type === "boost") {
    state.score += Math.round(6 * state.multiplier);
    state.boostTimer = 3.5;
    increaseCombo(0.15);
    spawnParticles(orb.x, orb.y, colors.boost, 18);
  } else if (orb.type === "shield") {
    state.score += Math.round(4 * state.multiplier);
    state.shieldTimer = 4.5;
    spawnParticles(orb.x, orb.y, colors.shield, 16);
  }
  updateHUD();
};

const applyDamage = () => {
  if (state.shieldTimer > 0) {
    state.shieldTimer = 0;
    spawnParticles(
      state.playerX + config.playerWidth / 2,
      state.playerY,
      colors.shield,
      24
    );
    return;
  }

  if (state.invulnerableTimer > 0) {
    return;
  }

  state.lives -= 1;
  state.multiplier = 1;
  state.comboTimer = 0;
  state.flashTimer = 0.35;
  state.invulnerableTimer = 0.9;
  updateHUD();

  if (state.lives <= 0) {
    endGame();
  }
};

const spawnEntities = (timestamp) => {
  if (timestamp - state.lastSpawn < state.spawnInterval) {
    return;
  }

  state.lastSpawn = timestamp;
  const difficultyBoost = 1 + state.difficulty * 0.05;
  const x = randomRange(40, config.width - 40);
  const roll = Math.random();

  if (roll < 0.45) {
    const width = randomRange(24, 40);
    const height = randomRange(60, 90);
    state.obstacles.push({
      x: clamp(x - width / 2, 10, config.width - width - 10),
      y: -height,
      width,
      height,
      speed: randomRange(3, 5.4) * difficultyBoost,
    });
  } else if (roll < 0.8) {
    let type = "score";
    const orbRoll = Math.random();
    if (orbRoll > 0.85) {
      type = "boost";
    } else if (orbRoll > 0.65) {
      type = "shield";
    }
    state.orbs.push({
      x,
      y: -config.orbSize,
      speed: randomRange(2.4, 3.8) * difficultyBoost,
      type,
    });
  } else {
    state.drones.push({
      baseX: x,
      x,
      y: -config.droneSize,
      speed: randomRange(3.2, 4.8) * difficultyBoost,
      amplitude: randomRange(35, 80),
      angle: Math.random() * Math.PI * 2,
      frequency: randomRange(0.8, 1.4),
    });
  }
};

const spawnZapper = (timestamp) => {
  if (timestamp - state.lastHazardSpawn < state.currentHazardInterval) {
    return;
  }

  state.lastHazardSpawn = timestamp;
  const gapWidth = randomRange(config.zapperGapMin, config.zapperGapMax);
  const gapCenter = randomRange(
    gapWidth / 2 + 40,
    config.width - gapWidth / 2 - 40
  );
  state.zappers.push({
    y: -config.zapperThickness,
    speed: randomRange(2.8, 4.4) * (1 + state.difficulty * 0.04),
    gapCenter,
    gapWidth,
  });
};

const updateTimers = (delta) => {
  const seconds = delta / 1000;
  state.boostTimer = Math.max(0, state.boostTimer - seconds);
  state.shieldTimer = Math.max(0, state.shieldTimer - seconds);
  state.invulnerableTimer = Math.max(0, state.invulnerableTimer - seconds);
  state.flashTimer = Math.max(0, state.flashTimer - seconds);

  if (state.comboTimer > 0) {
    state.comboTimer = Math.max(0, state.comboTimer - seconds);
    if (state.comboTimer === 0) {
      state.multiplier = 1;
      updateHUD();
    }
  }

  state.difficulty += delta * config.difficultyRamp;
  state.spawnInterval = Math.max(
    config.minSpawnInterval,
    config.baseSpawnInterval - state.difficulty * 140
  );
  state.currentHazardInterval = Math.max(
    1600,
    config.hazardInterval - state.difficulty * 70
  );
};

const processInput = (delta) => {
  const leftPressed = state.keys.has("ArrowLeft") || state.keys.has("a");
  const rightPressed = state.keys.has("ArrowRight") || state.keys.has("d");
  const upPressed = state.keys.has("ArrowUp") || state.keys.has("w");
  const downPressed = state.keys.has("ArrowDown") || state.keys.has("s");

  const horizontalSpeed = state.boostTimer > 0 ? config.boostSpeed : config.playerSpeed;
  const verticalSpeed = state.boostTimer > 0
    ? config.playerVerticalSpeed + 1.4
    : config.playerVerticalSpeed;
  const deltaScale = delta / 16.67;

  if (leftPressed && !rightPressed) {
    state.velocity = -1;
  } else if (rightPressed && !leftPressed) {
    state.velocity = 1;
  } else {
    state.velocity = 0;
  }

  if (upPressed && !downPressed) {
    state.verticalVelocity = -1;
  } else if (downPressed && !upPressed) {
    state.verticalVelocity = 1;
  } else {
    state.verticalVelocity = 0;
  }

  state.playerX = clamp(
    state.playerX + state.velocity * horizontalSpeed * deltaScale,
    12,
    config.width - config.playerWidth - 12
  );

  state.playerY = clamp(
    state.playerY + state.verticalVelocity * verticalSpeed * deltaScale,
    40,
    config.height - config.playerHeight - 16
  );
};

const updateEntities = (delta) => {
  const deltaScale = delta / 16.67;

  state.orbs = state.orbs
    .map((orb) => ({ ...orb, y: orb.y + orb.speed * deltaScale }))
    .filter((orb) => orb.y < config.height + config.orbSize);

  state.obstacles = state.obstacles
    .map((obs) => ({ ...obs, y: obs.y + obs.speed * deltaScale }))
    .filter((obs) => obs.y < config.height + obs.height);

  state.drones = state.drones
    .map((drone) => {
      const updated = { ...drone };
      updated.y += updated.speed * deltaScale;
      updated.angle += delta * 0.004 * updated.frequency;
      updated.x = clamp(
        updated.baseX + Math.sin(updated.angle) * updated.amplitude,
        20,
        config.width - 20
      );
      return updated;
    })
    .filter((drone) => drone.y < config.height + config.droneSize);

  state.zappers = state.zappers
    .map((zap) => ({ ...zap, y: zap.y + zap.speed * deltaScale }))
    .filter((zap) => zap.y < config.height + config.zapperThickness);

  state.particles = state.particles
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * deltaScale,
      y: particle.y + particle.vy * deltaScale,
      life: particle.life - delta / 1000,
    }))
    .filter((particle) => particle.life > 0);
};

const aabbCollision = (ax, ay, aw, ah, bx, by, bw, bh) =>
  ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

const handleCollisions = () => {
  const playerRect = {
    x: state.playerX,
    y: state.playerY,
    w: config.playerWidth,
    h: config.playerHeight,
  };

  state.orbs = state.orbs.filter((orb) => {
    const hit = aabbCollision(
      playerRect.x,
      playerRect.y,
      playerRect.w,
      playerRect.h,
      orb.x - config.orbSize / 2,
      orb.y - config.orbSize / 2,
      config.orbSize,
      config.orbSize
    );

    if (hit) {
      collectOrb(orb);
    }

    return !hit;
  });

  let damaged = false;

  state.obstacles = state.obstacles.filter((obs) => {
    const hit = aabbCollision(
      playerRect.x,
      playerRect.y,
      playerRect.w,
      playerRect.h,
      obs.x,
      obs.y,
      obs.width,
      obs.height
    );

    if (hit) {
      damaged = true;
    }

    return !hit;
  });

  state.drones = state.drones.filter((drone) => {
    const hit = aabbCollision(
      playerRect.x,
      playerRect.y,
      playerRect.w,
      playerRect.h,
      drone.x - config.droneSize / 2,
      drone.y - config.droneSize / 2,
      config.droneSize,
      config.droneSize
    );

    if (hit) {
      damaged = true;
      spawnParticles(drone.x, drone.y, colors.drone, 20);
    }

    return !hit;
  });

  state.zappers = state.zappers.filter((zap) => {
    const zapTop = zap.y;
    const zapBottom = zap.y + config.zapperThickness;
    const playerTop = playerRect.y;
    const playerBottom = playerRect.y + playerRect.h;

    if (!(playerBottom < zapTop || playerTop > zapBottom)) {
      const gapLeft = zap.gapCenter - zap.gapWidth / 2;
      const gapRight = zap.gapCenter + zap.gapWidth / 2;
      const playerCenter = playerRect.x + playerRect.w / 2;

      if (playerCenter < gapLeft || playerCenter > gapRight) {
        damaged = true;
        spawnParticles(playerCenter, zap.y, colors.zapper, 24);
      }
    }

    return zap.y < config.height + config.zapperThickness;
  });

  if (damaged) {
    applyDamage();
  }
};

const drawBackground = (timestamp) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, config.height);
  gradient.addColorStop(0, colors.bgTop);
  gradient.addColorStop(1, colors.bgBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, config.width, config.height);

  const offset = (timestamp / 35) % 40;
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;

  for (let y = -40; y < config.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y + offset);
    ctx.lineTo(config.width, y + offset);
    ctx.stroke();
  }

  for (let x = 0; x <= config.width; x += config.width / 8) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, config.height);
    ctx.stroke();
  }
};

const drawPlayer = () => {
  const x = state.playerX;
  const y = state.playerY;
  const gradient = ctx.createLinearGradient(x, y, x, y + config.playerHeight);
  gradient.addColorStop(0, "#00fbff");
  gradient.addColorStop(1, "#0061ff");
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, config.playerWidth, config.playerHeight);

  if (state.boostTimer > 0) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.7)";
    ctx.lineWidth = 3;
    ctx.strokeRect(x - 4, y - 4, config.playerWidth + 8, config.playerHeight + 8);
  }

  if (state.shieldTimer > 0) {
    ctx.strokeStyle = "rgba(192, 166, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      x + config.playerWidth / 2,
      y + config.playerHeight / 2,
      config.playerWidth,
      0,
      Math.PI * 2
    );
    ctx.stroke();
  }
};

const drawOrbs = () => {
  state.orbs.forEach((orb) => {
    const gradient = ctx.createRadialGradient(orb.x, orb.y, 2, orb.x, orb.y, config.orbSize);
    if (orb.type === "boost") {
      gradient.addColorStop(0, "#e6ffe6");
      gradient.addColorStop(1, colors.boost);
    } else if (orb.type === "shield") {
      gradient.addColorStop(0, "#f5e9ff");
      gradient.addColorStop(1, colors.shield);
    } else {
      gradient.addColorStop(0, "#fff6b7");
      gradient.addColorStop(1, colors.orb);
    }
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, config.orbSize / 2, 0, Math.PI * 2);
    ctx.fill();
  });
};

const drawObstacles = () => {
  ctx.fillStyle = colors.obstacle;
  state.obstacles.forEach((obs) => {
    ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
  });
};

const drawDrones = () => {
  state.drones.forEach((drone) => {
    ctx.fillStyle = colors.drone;
    ctx.beginPath();
    ctx.moveTo(drone.x, drone.y);
    ctx.lineTo(drone.x - config.droneSize / 2, drone.y + config.droneSize);
    ctx.lineTo(drone.x + config.droneSize / 2, drone.y + config.droneSize);
    ctx.closePath();
    ctx.fill();
  });
};

const drawZappers = () => {
  state.zappers.forEach((zap) => {
    ctx.fillStyle = "rgba(255, 59, 125, 0.25)";
    ctx.fillRect(0, zap.y, config.width, config.zapperThickness);
    ctx.clearRect(
      zap.gapCenter - zap.gapWidth / 2,
      zap.y - 1,
      zap.gapWidth,
      config.zapperThickness + 2
    );
    ctx.strokeStyle = colors.zapper;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, zap.y + config.zapperThickness / 2);
    ctx.lineTo(zap.gapCenter - zap.gapWidth / 2, zap.y + config.zapperThickness / 2);
    ctx.moveTo(zap.gapCenter + zap.gapWidth / 2, zap.y + config.zapperThickness / 2);
    ctx.lineTo(config.width, zap.y + config.zapperThickness / 2);
    ctx.stroke();
  });
};

const drawParticles = () => {
  state.particles.forEach((particle) => {
    ctx.fillStyle = particle.color;
    ctx.globalAlpha = Math.max(particle.life, 0);
    ctx.fillRect(particle.x, particle.y, 2, 2);
    ctx.globalAlpha = 1;
  });
};

const drawStatus = () => {
  ctx.font = "600 16px 'Space Grotesk', system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(`Combo ×${state.multiplier.toFixed(1)}`, 16, 26);

  if (state.boostTimer > 0) {
    ctx.fillStyle = colors.boost;
    ctx.fillText(`Boost ${state.boostTimer.toFixed(1)}s`, 16, 48);
  }

  if (state.shieldTimer > 0) {
    ctx.fillStyle = colors.shield;
    ctx.fillText(`Schild ${state.shieldTimer.toFixed(1)}s`, 16, 70);
  }
};

const drawFlash = () => {
  if (state.flashTimer > 0) {
    ctx.fillStyle = `rgba(255, 83, 83, ${state.flashTimer * 0.8})`;
    ctx.fillRect(0, 0, config.width, config.height);
  }
};

const draw = (timestamp) => {
  drawBackground(timestamp);
  drawOrbs();
  drawObstacles();
  drawDrones();
  drawZappers();
  drawParticles();
  drawPlayer();
  drawStatus();
  drawFlash();
};

const loop = (timestamp) => {
  if (!state.running) {
    return;
  }

  if (!state.lastFrame) {
    state.lastFrame = timestamp;
  }

  const delta = timestamp - state.lastFrame;
  state.lastFrame = timestamp;

  processInput(delta);
  spawnEntities(timestamp);
  spawnZapper(timestamp);
  updateEntities(delta);
  handleCollisions();
  updateTimers(delta);
  draw(timestamp);

  requestAnimationFrame(loop);
};

const endGame = () => {
  state.running = false;
  finalScoreEl.textContent = state.score.toString();
  overlay.setAttribute("aria-hidden", "false");
  overlay.classList.add("visible");
};

const startGame = () => {
  resetGame();
  requestAnimationFrame(loop);
};

const movementKeys = new Set(["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"]);

window.addEventListener(
  "keydown",
  (event) => {
    if (movementKeys.has(event.key)) {
      event.preventDefault();
    }
    state.keys.add(event.key);
    if (event.key === "Enter" && !state.running) {
      startGame();
    }
  },
  { passive: false }
);

window.addEventListener(
  "keyup",
  (event) => {
    if (movementKeys.has(event.key)) {
      event.preventDefault();
    }
    state.keys.delete(event.key);
  },
  { passive: false }
);

restartBtn.addEventListener("click", startGame);

startGame();
