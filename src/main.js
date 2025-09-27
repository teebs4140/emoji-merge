const {
  Engine,
  Runner,
  Bodies,
  Composite,
  Events,
  Body,
  Vector,
} = Matter;

const EMOJI_TIERS = [
  "🐭",
  "🐹",
  "🐸",
  "🐰",
  "🐱",
  "🐷",
  "🐶",
  "🐻",
  "🦁",
  "🐻‍❄️",
];

const TIER_DATA = EMOJI_TIERS.map((emoji, index) => {
  const baseRadius = 26;
  const radius = baseRadius + index * 5;
  return {
    emoji,
    index,
    radius,
    score: (index + 1) * 12,
    fontSize: Math.round(radius * 2 * 0.95),
  };
});

const SPAWN_Y = 100;
const PLAYFIELD_TOP = 140;
const CONTAINER = {
  width: 320,
  wallThickness: 40,
  height: 520,
  floorOffset: 80,
};

const CANVAS_SIZE = {
  width: 480,
  height: 720,
};

const state = {
  engine: null,
  runner: null,
  currentTier: 0,
  nextTier: 0,
  isDroppingLocked: false,
  activeBody: null,
  isGameOver: false,
  isVictory: false,
  score: 0,
  dropX: CANVAS_SIZE.width / 2,
  mergeQueue: [],
  mergingBodies: new Set(),
  highestTierReached: 0,
};

const ui = {
  canvas: document.getElementById("game-canvas"),
  score: document.getElementById("score-value"),
  nextEmoji: document.getElementById("next-emoji"),
  currentEmoji: document.getElementById("current-emoji"),
  ladderList: document.getElementById("emoji-ladder-list"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modal-title"),
  modalMessage: document.getElementById("modal-message"),
  restartButton: document.getElementById("restart-button"),
};

const ctx = ui.canvas.getContext("2d");
let dpr = window.devicePixelRatio || 1;
const ladderItems = [];

function configureCanvas() {
  dpr = window.devicePixelRatio || 1;
  ui.canvas.width = CANVAS_SIZE.width * dpr;
  ui.canvas.height = CANVAS_SIZE.height * dpr;
  ui.canvas.style.width = `${CANVAS_SIZE.width}px`;
  ui.canvas.style.height = `${CANVAS_SIZE.height}px`;
  ctx.scale(dpr, dpr);
}

function randomTier() {
  // Weighted distribution favoring lower tiers
  const weights = [35, 30, 15, 10, 6, 2, 1, 1, 0, 0];
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < weights.length; i += 1) {
    roll -= weights[i];
    if (roll <= 0) {
      return i;
    }
  }
  return 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function buildLadderUI() {
  ui.ladderList.innerHTML = "";
  ladderItems.length = 0;
  EMOJI_TIERS.forEach((emoji, index) => {
    const li = document.createElement("li");
    li.className = "ladder-item";

    const rank = document.createElement("span");
    rank.className = "ladder-rank";
    rank.textContent = (index + 1).toString();

    const glyph = document.createElement("span");
    glyph.className = "ladder-emoji";
    glyph.textContent = emoji;

    li.append(rank, glyph);
    ui.ladderList.appendChild(li);
    ladderItems.push(li);
  });
}

function refreshLadderUI() {
  ladderItems.forEach((item, index) => {
    item.classList.toggle("current", index === state.currentTier && !state.isGameOver);
    item.classList.toggle("reached", index <= state.highestTierReached);
  });
}

function resetState() {
  state.score = 0;
  state.isGameOver = false;
  state.isVictory = false;
  state.isDroppingLocked = false;
  state.activeBody = null;
  state.mergeQueue = [];
  state.mergingBodies.clear();
  state.currentTier = randomTier();
  state.nextTier = randomTier();
  state.highestTierReached = state.currentTier;
  updateQueueUI();
  updateScoreUI();
  refreshLadderUI();
  hideModal();
}

function updateQueueUI() {
  ui.currentEmoji.textContent = EMOJI_TIERS[state.currentTier];
  ui.nextEmoji.textContent = EMOJI_TIERS[state.nextTier];
  refreshLadderUI();
}

function updateScoreUI() {
  ui.score.textContent = state.score.toString();
}

function showModal(title, message) {
  ui.modalTitle.textContent = title;
  ui.modalMessage.textContent = message;
  ui.modal.classList.remove("hidden");
}

function hideModal() {
  ui.modal.classList.add("hidden");
}

function setupPhysics() {
  const engine = Engine.create({ enableSleeping: true });
  engine.world.gravity.y = 1.1;
  state.engine = engine;
  state.runner = Runner.create();

  const { width, wallThickness, height, floorOffset } = CONTAINER;
  const centerX = CANVAS_SIZE.width / 2;
  const floorY = CANVAS_SIZE.height - floorOffset;

  const leftWall = Bodies.rectangle(
    centerX - width / 2 - wallThickness / 2,
    floorY - height / 2,
    wallThickness,
    height,
    {
      isStatic: true,
      restitution: 0.2,
      friction: 0.8,
    }
  );

  const rightWall = Bodies.rectangle(
    centerX + width / 2 + wallThickness / 2,
    floorY - height / 2,
    wallThickness,
    height,
    {
      isStatic: true,
      restitution: 0.2,
      friction: 0.8,
    }
  );

  const floor = Bodies.rectangle(
    centerX,
    floorY + wallThickness / 2,
    width + wallThickness * 2,
    wallThickness,
    {
      isStatic: true,
      restitution: 0.2,
    }
  );

  Composite.add(engine.world, [leftWall, rightWall, floor]);

  Events.on(engine, "collisionStart", onCollisionStart);
  Events.on(engine, "afterUpdate", onAfterUpdate);

  Runner.run(state.runner, engine);
}

function worldHasBody(body) {
  return !!Composite.get(state.engine.world, body.id, "body");
}

function onCollisionStart(event) {
  if (state.isGameOver) return;
  for (const pair of event.pairs) {
    const { bodyA, bodyB } = pair;
    if (!bodyA.gameData || !bodyB.gameData) continue;
    const tierA = bodyA.gameData.tier;
    const tierB = bodyB.gameData.tier;
    if (tierA !== tierB) continue;
    if (tierA >= EMOJI_TIERS.length - 1) continue; // already max tier
    if (state.mergingBodies.has(bodyA.id) || state.mergingBodies.has(bodyB.id)) continue;

    state.mergingBodies.add(bodyA.id);
    state.mergingBodies.add(bodyB.id);
    state.mergeQueue.push({ bodyA, bodyB, tier: tierA });
  }
}

function onAfterUpdate() {
  if (state.isGameOver) return;
  processMergeQueue();
  handleActiveDropState();
  checkOverflow();
}

function processMergeQueue() {
  if (state.mergeQueue.length === 0) return;

  const queue = [...state.mergeQueue];
  state.mergeQueue.length = 0;

  for (const entry of queue) {
    const { bodyA, bodyB, tier } = entry;

    if (!worldHasBody(bodyA) || !worldHasBody(bodyB)) {
      state.mergingBodies.delete(bodyA.id);
      state.mergingBodies.delete(bodyB.id);
      continue;
    }

    const position = Vector.mult(Vector.add(bodyA.position, bodyB.position), 0.5);

    Composite.remove(state.engine.world, bodyA);
    Composite.remove(state.engine.world, bodyB);
    state.mergingBodies.delete(bodyA.id);
    state.mergingBodies.delete(bodyB.id);

    const nextTier = tier + 1;
    const nextData = TIER_DATA[nextTier];

    const merged = Bodies.circle(position.x, position.y, nextData.radius, {
      restitution: 0.35,
      friction: 0.15,
      frictionAir: 0.0007,
    });
    merged.gameData = { tier: nextTier };
    Body.setVelocity(merged, { x: 0, y: -2.5 });
    Composite.add(state.engine.world, merged);

    state.highestTierReached = Math.max(state.highestTierReached, nextTier);
    state.score += nextData.score;
    updateScoreUI();
    refreshLadderUI();

    if (nextTier === EMOJI_TIERS.length - 1) {
      triggerVictory();
    }
  }
}

function handleActiveDropState() {
  if (!state.activeBody) return;
  if (!worldHasBody(state.activeBody)) {
    state.activeBody = null;
    state.isDroppingLocked = false;
    return;
  }
  if (state.activeBody.isSleeping || state.activeBody.speed < 0.08) {
    state.activeBody = null;
    state.isDroppingLocked = false;
  }
}

function checkOverflow() {
  const bodies = Composite.allBodies(state.engine.world);
  for (const body of bodies) {
    if (body.isStatic || !body.gameData) continue;
    const top = body.position.y - body.circleRadius;
    if (top <= PLAYFIELD_TOP && (body.isSleeping || body.speed < 0.05)) {
      triggerGameOver();
      return;
    }
  }
}

function triggerGameOver() {
  if (state.isGameOver) return;
  state.isGameOver = true;
  state.isDroppingLocked = true;
  refreshLadderUI();
  showModal("Game Over", "Emojis overflowed the basket.");
}

function triggerVictory() {
  if (state.isVictory) return;
  state.isVictory = true;
  state.isGameOver = true;
  state.isDroppingLocked = true;
  refreshLadderUI();
  showModal("You Win!", "You unlocked the final emoji!");
}

function dropEmoji() {
  if (state.isGameOver || state.isDroppingLocked) return;

  const currentTier = state.currentTier;
  const data = TIER_DATA[currentTier];
  const spawnX = clamp(
    state.dropX,
    CANVAS_SIZE.width / 2 - CONTAINER.width / 2 + data.radius,
    CANVAS_SIZE.width / 2 + CONTAINER.width / 2 - data.radius
  );

  const body = Bodies.circle(spawnX, SPAWN_Y, data.radius, {
    restitution: 0.35,
    friction: 0.02,
    frictionAir: 0.0008,
  });
  body.gameData = { tier: currentTier };

  Composite.add(state.engine.world, body);

  state.activeBody = body;
  state.isDroppingLocked = true;
  state.highestTierReached = Math.max(state.highestTierReached, currentTier);

  state.currentTier = state.nextTier;
  state.nextTier = randomTier();
  updateQueueUI();
}

function handlePointerMove(event) {
  const rect = ui.canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  state.dropX = clamp(
    x,
    CANVAS_SIZE.width / 2 - CONTAINER.width / 2,
    CANVAS_SIZE.width / 2 + CONTAINER.width / 2
  );
}

function attachInputHandlers() {
  let pointerDown = false;

  ui.canvas.addEventListener("pointerdown", (event) => {
    pointerDown = true;
    ui.canvas.setPointerCapture(event.pointerId);
    handlePointerMove(event);
  });

  ui.canvas.addEventListener("pointermove", (event) => {
    if (!pointerDown) return;
    handlePointerMove(event);
  });

  ui.canvas.addEventListener("pointerup", (event) => {
    pointerDown = false;
    ui.canvas.releasePointerCapture(event.pointerId);
    handlePointerMove(event);
    dropEmoji();
  });

  ui.canvas.addEventListener("pointerleave", () => {
    pointerDown = false;
  });

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      dropEmoji();
    }
    if (event.code === "ArrowLeft") {
      state.dropX -= 16;
    }
    if (event.code === "ArrowRight") {
      state.dropX += 16;
    }
  });
}

function attachUIHandlers() {
  ui.restartButton.addEventListener("click", () => {
    restartGame();
  });

  ui.modal.addEventListener("click", (event) => {
    if (event.target === ui.modal) {
      restartGame();
    }
  });
}

function restartGame() {
  const bodies = Composite.allBodies(state.engine.world);
  for (const body of bodies) {
    if (!body.isStatic) {
      Composite.remove(state.engine.world, body);
    }
  }

  resetState();
}

function drawBackground() {
  ctx.save();
  ctx.fillStyle = "rgba(18, 26, 45, 0.9)";
  const rectWidth = CONTAINER.width + 12;
  const rectHeight = CONTAINER.height + 28;
  const x = (CANVAS_SIZE.width - rectWidth) / 2;
  const y = CANVAS_SIZE.height - CONTAINER.floorOffset - rectHeight + 20;
  ctx.roundRect(x, y, rectWidth, rectHeight, 24);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  const topY = PLAYFIELD_TOP;
  ctx.beginPath();
  ctx.moveTo((CANVAS_SIZE.width - CONTAINER.width) / 2, topY);
  ctx.lineTo((CANVAS_SIZE.width + CONTAINER.width) / 2, topY);
  ctx.stroke();
  ctx.restore();
}

function drawEmojis() {
  const bodies = Composite.allBodies(state.engine.world);
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const body of bodies) {
    if (body.isStatic || !body.gameData) continue;
    const { tier } = body.gameData;
    const data = TIER_DATA[tier];
    ctx.font = `${data.fontSize}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.fillText(data.emoji, body.position.x, body.position.y + 2);
  }

  ctx.restore();
}

function clearCanvas() {
  ctx.clearRect(0, 0, CANVAS_SIZE.width, CANVAS_SIZE.height);
}

function renderLoop() {
  clearCanvas();
  drawBackground();
  drawEmojis();
  requestAnimationFrame(renderLoop);
}

function init() {
  configureCanvas();
  buildLadderUI();
  window.addEventListener("resize", () => {
    ctx.resetTransform();
    configureCanvas();
  });
  resetState();
  setupPhysics();
  attachInputHandlers();
  attachUIHandlers();
  renderLoop();
}

if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function roundRect(x, y, width, height, radius) {
    const radii = Array.isArray(radius) ? radius : [radius, radius, radius, radius];
    this.beginPath();
    this.moveTo(x + radii[0], y);
    this.lineTo(x + width - radii[1], y);
    this.quadraticCurveTo(x + width, y, x + width, y + radii[1]);
    this.lineTo(x + width, y + height - radii[2]);
    this.quadraticCurveTo(x + width, y + height, x + width - radii[2], y + height);
    this.lineTo(x + radii[3], y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radii[3]);
    this.lineTo(x, y + radii[0]);
    this.quadraticCurveTo(x, y, x + radii[0], y);
    this.closePath();
    return this;
  };
}

init();
