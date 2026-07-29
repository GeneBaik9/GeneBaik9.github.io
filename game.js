(() => {
  const shell = document.querySelector("#game-shell");
  if (!shell) return;

  const canvas = document.querySelector("#game-board");
  const context = canvas.getContext("2d");
  const scoreElement = document.querySelector("#score");
  const highScoreElement = document.querySelector("#high-score");
  const statusElement = document.querySelector("#game-status");
  const startButton = document.querySelector("#start-game");
  const pauseButton = document.querySelector("#pause-game");
  const restartButton = document.querySelector("#restart-game");
  const gridSize = 20;
  const cellSize = canvas.width / gridSize;
  const tickRate = 140;
  const directions = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 }
  };

  let snake;
  let direction;
  let queuedDirection;
  let food;
  let enemy;
  let score;
  let highScore = readHighScore();
  let timerId = null;
  let running = false;
  let paused = false;
  let gameOver = false;

  function readHighScore() {
    try { return Number.parseInt(localStorage.getItem("gene-snake-high-score"), 10) || 0; }
    catch { return 0; }
  }

  function saveHighScore() {
    try { localStorage.setItem("gene-snake-high-score", String(highScore)); }
    catch { /* Storage may be unavailable in private browsing. */ }
  }

  function resetGame() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    direction = directions.right;
    queuedDirection = direction;
    score = 0;
    food = spawnFreeCell();
    enemy = spawnFreeCell();
    running = false;
    paused = false;
    gameOver = false;
    stopTimer();
    updateScore();
    setStatus("시작을 눌러 플레이하세요.");
    draw();
  }

  function startGame() {
    if (running && !paused) return;
    if (gameOver) resetGame();
    running = true;
    paused = false;
    setStatus("플레이 중");
    ensureTimer();
  }

  function ensureTimer() {
    if (timerId === null) timerId = window.setInterval(tick, tickRate);
  }

  function stopTimer() {
    if (timerId !== null) window.clearInterval(timerId);
    timerId = null;
  }

  function togglePause() {
    if (!running || gameOver) return;
    paused = !paused;
    setStatus(paused ? "일시정지" : "플레이 중");
  }

  function restartGame() {
    resetGame();
    startGame();
  }

  function setDirection(next) {
    const nextDirection = directions[next];
    if (!nextDirection || isOpposite(nextDirection, direction)) return;
    queuedDirection = nextDirection;
  }

  function isOpposite(first, second) {
    return first.x + second.x === 0 && first.y + second.y === 0;
  }

  function tick() {
    if (!running || paused) return;
    direction = queuedDirection;
    const head = snake[0];
    const nextHead = { x: head.x + direction.x, y: head.y + direction.y };
    if (hitsWall(nextHead) || hitsSnake(nextHead) || sameCell(nextHead, enemy)) {
      endGame();
      return;
    }
    snake.unshift(nextHead);
    if (sameCell(nextHead, food)) {
      score += 1;
      if (score > highScore) { highScore = score; saveHighScore(); }
      food = spawnFreeCell();
      updateScore();
    } else {
      snake.pop();
    }
    moveEnemy();
    draw();
  }

  function endGame() {
    running = false;
    gameOver = true;
    stopTimer();
    setStatus("게임 오버 — 재시작을 눌러 다시 도전하세요.");
    draw();
  }

  function hitsWall(cell) { return cell.x < 0 || cell.y < 0 || cell.x >= gridSize || cell.y >= gridSize; }
  function hitsSnake(cell) { return snake.some((part) => sameCell(part, cell)); }
  function sameCell(first, second) { return first && second && first.x === second.x && first.y === second.y; }

  function spawnFreeCell() {
    const free = [];
    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        const cell = { x, y };
        if (!hitsSnake(cell) && !sameCell(cell, food)) free.push(cell);
      }
    }
    return free[Math.floor(Math.random() * free.length)] || { x: 1, y: 1 };
  }

  function moveEnemy() {
    const options = Object.values(directions)
      .map((step) => ({ x: enemy.x + step.x, y: enemy.y + step.y }))
      .filter((cell) => !hitsWall(cell) && !hitsSnake(cell) && !sameCell(cell, food));
    if (options.length) enemy = options[Math.floor(Math.random() * options.length)];
  }

  function draw() {
    context.fillStyle = "#06100a";
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawCell(food, "#ffe66d");
    drawCell(enemy, "#ff5c70");
    snake.forEach((part, index) => drawCell(part, index === 0 ? "#a9ffd0" : "#52ff9a"));
  }

  function drawCell(cell, color) {
    context.fillStyle = color;
    context.fillRect(cell.x * cellSize + 1, cell.y * cellSize + 1, cellSize - 2, cellSize - 2);
  }

  function updateScore() {
    scoreElement.textContent = String(score);
    highScoreElement.textContent = String(highScore);
  }

  function setStatus(message) { statusElement.textContent = message; }

  document.addEventListener("keydown", (event) => {
    const keyMap = { ArrowUp: "up", w: "up", ArrowDown: "down", s: "down", ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right" };
    const next = keyMap[event.key] || keyMap[event.key.toLowerCase()];
    if (next) { event.preventDefault(); setDirection(next); if (!running) startGame(); }
    if (event.key === " " || event.key === "p") { event.preventDefault(); togglePause(); }
  });
  document.querySelectorAll("[data-direction]").forEach((button) => {
    button.addEventListener("pointerdown", () => { setDirection(button.dataset.direction); if (!running) startGame(); });
  });
  startButton.addEventListener("click", startGame);
  pauseButton.addEventListener("click", togglePause);
  restartButton.addEventListener("click", restartGame);
  highScoreElement.textContent = String(highScore);
  resetGame();
})();
