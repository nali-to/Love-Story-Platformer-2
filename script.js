const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const W = canvas.width;
const H = canvas.height;

let scene = "menu";
let selectedStage = 0;
let keys = {};
let frame = 0;
let currentStage = 0;
let musicOn = true;
let gameWon = false;

const player = {
  x: 80,
  y: 360,
  w: 34,
  h: 48,
  vx: 0,
  vy: 0,
  speed: 4,
  jump: -13,
  grounded: false,
  hearts: 5,
  maxHearts: 5,
  energy: 100,
  facing: 1,
  flying: false,
  flyTime: 0
};

const stages = [
  {
    name: "1-1 First Meet",
    subtitle: "The beginning of us",
    bg: ["#f7b3b6", "#f6d0b9"],
    music: "Our Song",
    message: "Our first hello changed everything.",
    platforms: [
      [0, 470, 960, 70],
      [230, 385, 140, 24],
      [500, 335, 150, 24],
      [760, 280, 130, 24]
    ],
    hearts: [[285, 345], [555, 295], [815, 240]],
    birds: [[650, 220, 2]],
    obstacles: [[420, 438, 40, 32, "spike"]],
    goal: [900, 420]
  },
  {
    name: "1-2 Get To Know You",
    subtitle: "Every message mattered",
    bg: ["#ffc1c7", "#ffe0c1"],
    music: "Daydream",
    message: "I loved getting to know your heart.",
    platforms: [
      [0, 470, 960, 70],
      [150, 390, 120, 24],
      [340, 325, 130, 24],
      [540, 265, 130, 24],
      [740, 350, 140, 24]
    ],
    hearts: [[190, 350], [385, 285], [590, 225], [790, 310]],
    birds: [[350, 200, 2], [720, 210, -2]],
    obstacles: [[485, 438, 45, 32, "distance"]],
    goal: [900, 420]
  },
  {
    name: "2-1 First Date",
    subtitle: "A memory unlocked",
    bg: ["#d98f9f", "#4c325f"],
    music: "Sunset Love",
    message: "Every date with you feels special.",
    platforms: [
      [0, 470, 960, 70],
      [230, 390, 130, 24],
      [450, 330, 150, 24],
      [720, 300, 150, 24]
    ],
    hearts: [[280, 350], [515, 290], [775, 260]],
    birds: [[570, 210, 3]],
    obstacles: [[380, 438, 40, 32, "spike"], [650, 438, 45, 32, "stress"]],
    goal: [900, 420]
  },
  {
    name: "3-1 Long Distance",
    subtitle: "Still choosing each other",
    bg: ["#26344f", "#101624"],
    music: "Starlight",
    message: "Distance tried, but love stayed.",
    rain: true,
    platforms: [
      [0, 470, 960, 70],
      [160, 400, 130, 24],
      [370, 345, 140, 24],
      [600, 390, 130, 24],
      [780, 310, 130, 24]
    ],
    hearts: [[205, 360], [420, 305], [645, 350], [825, 270]],
    birds: [[300, 230, 2], [700, 240, -2]],
    obstacles: [[520, 438, 50, 32, "waiting"]],
    goal: [900, 420]
  },
  {
    name: "5-2 Adventures",
    subtitle: "Flying through memories",
    bg: ["#4a2a64", "#1d1433"],
    music: "Adventure",
    message: "Every adventure is better with you.",
    allowFly: true,
    platforms: [
      [0, 470, 960, 70],
      [130, 380, 130, 24],
      [340, 300, 130, 24],
      [560, 355, 140, 24],
      [760, 260, 130, 24]
    ],
    hearts: [[180, 340], [390, 260], [615, 315], [805, 220]],
    birds: [[500, 210, 3], [720, 170, -3]],
    obstacles: [[285, 438, 40, 32, "spike"], [690, 438, 45, 32, "fear"]],
    goal: [900, 420]
  },
  {
    name: "6-3 Final Challenge",
    subtitle: "The last obstacle",
    bg: ["#422847", "#160f22"],
    music: "Forever With You",
    message: "You made it through everything.",
    boss: true,
    platforms: [
      [0, 470, 960, 70],
      [220, 390, 130, 24],
      [520, 330, 150, 24],
      [750, 390, 130, 24]
    ],
    hearts: [[270, 350], [575, 290], [800, 350]],
    birds: [[500, 230, 2]],
    obstacles: [[400, 438, 50, 32, "distance"], [680, 438, 50, 32, "stress"]],
    fireballs: [[770, 360, -3]],
    goal: [900, 420]
  }
];

let stageState = {};

function resetStage() {
  const s = stages[currentStage];
  player.x = 70;
  player.y = 390;
  player.vx = 0;
  player.vy = 0;
  player.hearts = player.maxHearts;
  player.energy = 100;
  player.flying = false;
  player.flyTime = 0;
  gameWon = false;

  stageState = {
    hearts: s.hearts.map(h => ({ x: h[0], y: h[1], got: false })),
    birds: s.birds.map(b => ({ x: b[0], y: b[1], vx: b[2], startX: b[0] })),
    fireballs: (s.fireballs || []).map(f => ({ x: f[0], y: f[1], vx: f[2] })),
    messageTimer: 0
  };
}

function drawText(text, x, y, size = 22, color = "white", align = "left") {
  ctx.fillStyle = color;
  ctx.font = `${size}px Courier New`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.textAlign = "left";
}

function rect(x, y, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function collision(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function drawPixelHeart(x, y, scale = 4, color = "#e91e63") {
  const pattern = [
    "01100110",
    "11111111",
    "11111111",
    "11111111",
    "01111110",
    "00111100",
    "00011000"
  ];
  pattern.forEach((row, yy) => {
    [...row].forEach((p, xx) => {
      if (p === "1") rect(x + xx * scale, y + yy * scale, scale, scale, color);
    });
  });
}

function drawBackground(stage) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, stage.bg[0]);
  g.addColorStop(1, stage.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  rect(80, 95, 210, 210, "rgba(255,190,170,0.35)");
  rect(600, 120, 170, 110, "rgba(80,90,85,0.5)");
  rect(715, 95, 130, 160, "rgba(60,70,65,0.5)");

  for (let i = 0; i < 8; i++) {
    rect(i * 140 - (frame % 140), 430, 90, 18, "rgba(112,151,105,0.45)");
  }

  if (stage.rain) {
    for (let i = 0; i < 80; i++) {
      const x = (i * 47 + frame * 4) % W;
      const y = (i * 71 + frame * 8) % H;
      rect(x, y, 2, 12, "rgba(180,210,255,0.45)");
    }
  }
}

function drawHUD(stage) {
  rect(20, 18, 280, 58, "rgba(45,30,55,0.65)");
  drawText("☻", 34, 55, 28, "#ffd0a6");

  rect(75, 33, 150, 22, "#17111f");
  rect(80, 38, Math.max(0, player.energy) * 1.4, 12, "#7431a8");

  for (let i = 0; i < player.maxHearts; i++) {
    drawPixelHeart(30 + i * 38, 85, 3, i < player.hearts ? "#d9002b" : "#281722");
  }

  drawText(stage.name, W / 2, 42, 23, "white", "center");
  drawText(`♪ ${stage.music}`, W - 30, 42, 18, "#ffd1e1", "right");

  if (stage.allowFly) drawText("K = fly", W - 30, 74, 16, "#ffd1e1", "right");
}

function drawPlatforms(stage) {
  stage.platforms.forEach(p => {
    rect(p[0], p[1], p[2], p[3], "#4d231f");
    rect(p[0], p[1], p[2], 7, "#7baa74");
    rect(p[0], p[1] + p[3], p[2], 8, "#2b1517");
  });
}

function drawPlayer() {
  const x = player.x;
  const y = player.y;

  rect(x + 8, y, 20, 10, "#5b2b20");
  rect(x + 4, y + 10, 28, 10, "#70402d");
  rect(x + 8, y + 18, 20, 16, "#ffd0a6");
  rect(x + 11, y + 23, 5, 5, "#24151b");
  rect(x + 24, y + 23, 5, 5, "#24151b");

  rect(x + 6, y + 34, 26, 22, "#1f7a56");
  rect(x + 2, y + 38, 8, 18, "#ffd0a6");
  rect(x + 32, y + 38, 8, 18, "#ffd0a6");
  rect(x + 9, y + 56, 8, 14, "#3b243d");
  rect(x + 23, y + 56, 8, 14, "#3b243d");

  if (player.flying) {
    rect(x - 14, y + 24, 12, 20, "#ff9cc7");
    rect(x + 36, y + 24, 12, 20, "#ff9cc7");
  }
}

function drawBird(b) {
  rect(b.x, b.y, 28, 20, "#ff7ba8");
  rect(b.x + 5, b.y - 8, 18, 10, "#ff9cc7");
  rect(b.x + 22, b.y + 6, 8, 5, "#ffd166");
  rect(b.x + 8, b.y + 6, 4, 4, "#2b1b2d");
}

function drawObstacle(o) {
  const [x, y, w, h, type] = o;
  if (type === "spike") {
    ctx.fillStyle = "#25202d";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w / 2, y);
    ctx.lineTo(x + w, y + h);
    ctx.fill();
  } else {
    rect(x, y, w, h, "#28202d");
    drawText(type, x - 8, y - 8, 12, "#ffd1e1");
  }
}

function drawGoal(stage) {
  const [x, y] = stage.goal;
  rect(x, y, 38, 50, "#ff8fb3");
  rect(x + 8, y - 18, 22, 22, "#8c4f2b");
  rect(x + 5, y + 12, 28, 28, "#e86a9b");
  drawPixelHeart(x - 38, y + 5, 4, "#ff004c");
}

function drawStage(stage) {
  drawBackground(stage);
  drawPlatforms(stage);

  stage.obstacles.forEach(drawObstacle);

  stageState.hearts.forEach(h => {
    if (!h.got) drawPixelHeart(h.x, h.y, 4, "#ff004c");
  });

  stageState.birds.forEach(drawBird);

  stageState.fireballs.forEach(f => {
    rect(f.x, f.y, 24, 18, "#ff7429");
    rect(f.x + 5, f.y + 4, 12, 8, "#ffd166");
  });

  if (stage.boss) {
    rect(720, 270, 80, 58, "#2b2433");
    rect(685, 300, 40, 15, "#2b2433");
    rect(800, 300, 40, 15, "#2b2433");
    drawText("FINAL", 707, 260, 15, "#ffd1e1");
  }

  drawGoal(stage);
  drawPlayer();
  drawHUD(stage);

  if (stageState.messageTimer > 0) {
    rect(150, 455, 660, 45, "rgba(45,30,55,0.85)");
    drawText(stage.message, W / 2, 485, 18, "white", "center");
  }
}

function updateGame() {
  const stage = stages[currentStage];

  player.vx = 0;
  if (keys["ArrowLeft"] || keys["a"]) {
    player.vx = -player.speed;
    player.facing = -1;
  }
  if (keys["ArrowRight"] || keys["d"]) {
    player.vx = player.speed;
    player.facing = 1;
  }

  if ((keys["l"] || keys["Shift"]) && player.energy > 2) {
    player.vx += player.facing * 4;
    player.energy -= 2;
  } else {
    player.energy = Math.min(100, player.energy + 0.4);
  }

  if (stage.allowFly && (keys["k"] || keys["ArrowUp"]) && player.energy > 1) {
    player.vy -= 0.65;
    player.energy -= 1.3;
    player.flying = true;
  } else {
    player.flying = false;
  }

  player.vy += 0.65;
  player.x += player.vx;
  player.y += player.vy;
  player.grounded = false;

  stage.platforms.forEach(p => {
    const plat = { x: p[0], y: p[1], w: p[2], h: p[3] };
    if (collision(player, plat) && player.vy >= 0 && player.y + player.h - player.vy <= plat.y + 8) {
      player.y = plat.y - player.h;
      player.vy = 0;
      player.grounded = true;
    }
  });

  if ((keys[" "] || keys["w"]) && player.grounded) {
    player.vy = player.jump;
    player.grounded = false;
  }

  player.x = Math.max(0, Math.min(W - player.w, player.x));

  if (player.y > H + 80) loseHeart();

  stageState.hearts.forEach(h => {
    if (!h.got && collision(player, { x: h.x, y: h.y, w: 35, h: 32 })) {
      h.got = true;
      player.energy = Math.min(100, player.energy + 25);
      stageState.messageTimer = 140;
    }
  });

  stageState.birds.forEach(b => {
    b.x += b.vx;
    if (Math.abs(b.x - b.startX) > 130) b.vx *= -1;
    if (collision(player, { x: b.x, y: b.y, w: 28, h: 20 })) loseHeart();
  });

  stage.obstacles.forEach(o => {
    if (collision(player, { x: o[0], y: o[1], w: o[2], h: o[3] })) loseHeart();
  });

  stageState.fireballs.forEach(f => {
    f.x += f.vx;
    if (f.x < 200 || f.x > 860) f.vx *= -1;
    if (collision(player, { x: f.x, y: f.y, w: 24, h: 18 })) loseHeart();
  });

  if (collision(player, { x: stage.goal[0], y: stage.goal[1], w: 45, h: 55 })) {
    if (currentStage === stages.length - 1) {
      scene = "ending";
    } else {
      currentStage++;
      resetStage();
    }
  }

  if (stageState.messageTimer > 0) stageState.messageTimer--;
}

function loseHeart() {
  player.hearts--;
  player.x = 70;
  player.y = 390;
  player.vx = 0;
  player.vy = 0;

  if (player.hearts <= 0) {
    resetStage();
  }
}

function drawMenu() {
  drawBackground(stages[0]);
  drawText("LOVE STORY", W / 2, 120, 56, "#ffd1e1", "center");
  drawText("PLATFORMER", W / 2, 170, 34, "white", "center");

  rect(270, 225, 420, 190, "rgba(55,35,58,0.85)");

  const options = ["START GAME", "STAGE SELECT", "MUSIC ROOM"];
  options.forEach((o, i) => {
    drawText(`${i === selectedStage ? "▶" : " "} ${o}`, 350, 275 + i * 50, 24, "white");
  });

  drawText("You and me, forever.", W / 2, 455, 20, "#ffd1e1", "center");
  drawText("Enter = select", W / 2, 500, 16, "white", "center");

  drawPixelHeart(455, 190, 5, "#ff004c");
}

function drawStageSelect() {
  ctx.fillStyle = "#17111f";
  ctx.fillRect(0, 0, W, H);

  drawText("♥ STAGE SELECT ♥", W / 2, 65, 34, "#ff9cc7", "center");

  stages.forEach((s, i) => {
    const x = 120 + (i % 3) * 250;
    const y = 120 + Math.floor(i / 3) * 160;

    rect(x, y, 190, 100, i === selectedStage ? "#ff8fb3" : "#3b243d");
    rect(x + 8, y + 8, 174, 60, s.bg[0]);
    drawText(`${i + 1}. ${s.name}`, x + 8, y + 128, 16, "white");
  });

  drawText("Arrow keys = choose | Enter = play | Esc = menu", W / 2, 500, 18, "white", "center");
}

function drawMusicRoom() {
  ctx.fillStyle = "#17111f";
  ctx.fillRect(0, 0, W, H);

  drawText("♪ MUSIC ROOM ♪", W / 2, 80, 38, "#ff9cc7", "center");

  rect(250, 140, 460, 270, "#2a1c37");
  const songs = ["Our Song", "Daydream", "Sunset Love", "Starlight", "Adventure", "Forever With You"];

  songs.forEach((song, i) => {
    drawText(`${i + 1}. ${song}`, 330, 200 + i * 35, 22, i === selectedStage ? "#ffd1e1" : "white");
  });

  drawText("This uses soft browser beeps. Add MP3 later if you want real songs.", W / 2, 455, 16, "white", "center");
  drawText("Esc = menu", W / 2, 490, 18, "white", "center");
}

function drawEnding() {
  drawBackground(stages[0]);
  rect(0, 0, W, H, "rgba(255,120,170,0.25)");
  drawText("♥ YOU MADE IT ♥", W / 2, 190, 48, "white", "center");
  drawText("You made it through everything.", W / 2, 255, 26, "white", "center");
  drawText("I love you.", W / 2, 300, 32, "#ffd1e1", "center");

  drawPlayer();
  drawPixelHeart(460, 330, 7, "#ff004c");
  drawGoal({ goal: [560, 330] });

  drawText("Press Enter to play again", W / 2, 485, 18, "white", "center");
}

function beep() {
  if (!musicOn) return;
  try {
    const audio = new AudioContext();
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.frequency.value = 440 + currentStage * 60;
    gain.gain.value = 0.03;
    osc.start();
    osc.stop(audio.currentTime + 0.08);
  } catch {}
}

document.addEventListener("keydown", e => {
  keys[e.key] = true;

  if (scene === "menu") {
    if (e.key === "ArrowDown") selectedStage = (selectedStage + 1) % 3;
    if (e.key === "ArrowUp") selectedStage = (selectedStage + 2) % 3;
    if (e.key === "Enter") {
      if (selectedStage === 0) {
        currentStage = 0;
        scene = "game";
        resetStage();
      } else if (selectedStage === 1) {
        selectedStage = 0;
        scene = "stageSelect";
      } else {
        selectedStage = 0;
        scene = "music";
      }
    }
  } else if (scene === "stageSelect") {
    if (e.key === "ArrowRight") selectedStage = (selectedStage + 1) % stages.length;
    if (e.key === "ArrowLeft") selectedStage = (selectedStage + stages.length - 1) % stages.length;
    if (e.key === "ArrowDown") selectedStage = (selectedStage + 3) % stages.length;
    if (e.key === "ArrowUp") selectedStage = (selectedStage + stages.length - 3) % stages.length;
    if (e.key === "Enter") {
      currentStage = selectedStage;
      scene = "game";
      resetStage();
    }
    if (e.key === "Escape") {
      selectedStage = 0;
      scene = "menu";
    }
  } else if (scene === "music") {
    if (e.key === "ArrowDown") selectedStage = (selectedStage + 1) % 6;
    if (e.key === "ArrowUp") selectedStage = (selectedStage + 5) % 6;
    if (e.key === "Enter") beep();
    if (e.key === "Escape") {
      selectedStage = 0;
      scene = "menu";
    }
  } else if (scene === "ending") {
    if (e.key === "Enter") {
      selectedStage = 0;
      scene = "menu";
    }
  }
});

document.addEventListener("keyup", e => {
  keys[e.key] = false;
});

function bindButton(id, key) {
  const btn = document.getElementById(id);
  btn.addEventListener("touchstart", e => {
    e.preventDefault();
    keys[key] = true;
  });
  btn.addEventListener("touchend", e => {
    e.preventDefault();
    keys[key] = false;
  });
  btn.addEventListener("mousedown", () => keys[key] = true);
  btn.addEventListener("mouseup", () => keys[key] = false);
}

bindButton("leftBtn", "ArrowLeft");
bindButton("rightBtn", "ArrowRight");
bindButton("jumpBtn", " ");
bindButton("dashBtn", "l");

function loop() {
  frame++;
  ctx.clearRect(0, 0, W, H);

  if (scene === "menu") drawMenu();
  if (scene === "stageSelect") drawStageSelect();
  if (scene === "music") drawMusicRoom();
  if (scene === "game") {
    updateGame();
    drawStage(stages[currentStage]);
  }
  if (scene === "ending") drawEnding();

  requestAnimationFrame(loop);
}

resetStage();
loop();
