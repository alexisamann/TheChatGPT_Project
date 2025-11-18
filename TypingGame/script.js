const GAME_DURATION = 60;
const MAX_LIVES = 3;
const SPAWN_INTERVAL = 1800;
const playfield = document.querySelector("#playfield");
const startButton = document.querySelector("#startButton");
const guessForm = document.querySelector("#guessForm");
const guessInput = document.querySelector("#guessInput");
const statusMessage = document.querySelector("#statusMessage");
const timeDisplay = document.querySelector("#timeDisplay");
const scoreDisplay = document.querySelector("#scoreDisplay");
const wpmDisplay = document.querySelector("#wpmDisplay");
const accuracyDisplay = document.querySelector("#accuracyDisplay");
const livesDisplay = document.querySelector("#livesDisplay");

const wordBank = [
  "Akrobat",
  "Strandkorb",
  "Glühwürmchen",
  "Hafenlicht",
  "Treibholz",
  "Panorama",
  "Dschungel",
  "Sternbild",
  "Sandsturm",
  "Flaschenpost",
  "Kompass",
  "Pirouette",
  "Polarstern",
  "Muschelsucher",
  "Wellenritt",
  "Luftschloss",
  "Wildblume",
  "Kieselstein",
  "Felsensprung",
  "Bergpfad",
  "Donnerwolke",
  "Schwalbenschwanz",
  "Sonnenaufgang",
  "Windmühle",
  "Sehnsucht",
  "Buchseiten",
  "Laternenlauf",
  "Herbstlaub",
  "Kräutergarten",
  "Feuerfunken",
  "Mondlicht",
  "Sternschnuppe",
  "Wanderlust",
  "Seerosenteich",
  "Regenbogen",
  "Nachtzug",
  "Fernweh",
  "Waldpfad",
  "Sturmhut",
  "Kastanienherz"
];

let activeWords = [];
let spawnTimer = null;
let isRunning = false;
let lastTimestamp = null;
let gameLoopId = null;
let timerInterval = null;
let timeLeft = GAME_DURATION;
let score = 0;
let lives = MAX_LIVES;
let streak = 0;
let correctWords = 0;
let totalGuesses = 0;
let elapsedSeconds = 0;

function initLivesDisplay() {
  livesDisplay.innerHTML = "";
  for (let i = 0; i < MAX_LIVES; i++) {
    const life = document.createElement("span");
    life.className = "life-indicator";
    if (i < lives) {
      life.classList.add("active");
    }
    livesDisplay.appendChild(life);
  }
}

function updateLivesDisplay() {
  [...livesDisplay.children].forEach((child, idx) => {
    child.classList.toggle("active", idx < lives);
  });
}

function shuffleWord() {
  return wordBank[Math.floor(Math.random() * wordBank.length)];
}

function spawnWord() {
  if (!isRunning) return;
  const word = shuffleWord();
  const wrapper = document.createElement("div");
  wrapper.className = "drop-word";
  wrapper.setAttribute("data-word", word);

  const canopy = document.createElement("div");
  canopy.className = "parachute";

  const body = document.createElement("div");
  body.className = "word-body";
  body.textContent = word;

  wrapper.appendChild(canopy);
  wrapper.appendChild(body);
  playfield.appendChild(wrapper);

  const leftPercent = 15 + Math.random() * 70;
  wrapper.style.left = `${leftPercent}%`;

  activeWords.push({
    element: wrapper,
    word,
    y: -110,
    speed: 60 + Math.random() * 70
  });
}

function resetGameState() {
  activeWords.forEach(({ element }) => element.remove());
  activeWords = [];
  lastTimestamp = null;
  elapsedSeconds = 0;
  streak = 0;
  correctWords = 0;
  totalGuesses = 0;
  score = 0;
  timeLeft = GAME_DURATION;
  lives = MAX_LIVES;
  updateScoreboard();
  initLivesDisplay();
  setStatus("Bereit? Die nächste Welle startet gleich!");
}

function updateScoreboard() {
  timeDisplay.textContent = `${timeLeft}s`;
  scoreDisplay.textContent = score;
  const wpm =
    elapsedSeconds > 0 ? Math.round((correctWords / elapsedSeconds) * 60) : 0;
  wpmDisplay.textContent = Number.isFinite(wpm) ? wpm : 0;
  const accuracy =
    totalGuesses === 0 ? 100 : Math.round((correctWords / totalGuesses) * 100);
  accuracyDisplay.textContent = `${accuracy}%`;
}

function setStatus(message) {
  statusMessage.textContent = message;
}

function startGame() {
  if (isRunning) return;
  resetGameState();
  isRunning = true;
  startButton.disabled = true;
  startButton.textContent = "Runde läuft …";
  spawnWord();
  spawnTimer = setInterval(spawnWord, SPAWN_INTERVAL);
  timerInterval = setInterval(() => {
    if (!isRunning) return;
    timeLeft -= 1;
    elapsedSeconds = GAME_DURATION - timeLeft;
    if (timeLeft <= 0) {
      timeLeft = 0;
      endGame("Zeit ist abgelaufen!");
    }
    updateScoreboard();
  }, 1000);
  gameLoopId = requestAnimationFrame(gameLoop);
  guessInput.focus();
  setStatus("Tippe die Wörter ein und drück Enter!");
}

function endGame(reason) {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(spawnTimer);
  clearInterval(timerInterval);
  cancelAnimationFrame(gameLoopId);
  startButton.disabled = false;
  startButton.textContent = "Noch eine Runde";
  setStatus(
    `${reason} Punkte: ${score}. Treffergenauigkeit ${accuracyDisplay.textContent}, WPM ${wpmDisplay.textContent}.`
  );
}

function removeWord(wordObject, className) {
  wordObject.element.classList.add(className);
  setTimeout(() => {
    wordObject.element.remove();
  }, 200);
}

function handleGuess(value) {
  if (!value || !isRunning) return;
  totalGuesses += 1;
  const matchIndex = activeWords.findIndex(
    (item) => item.word.toLowerCase() === value.toLowerCase()
  );
  if (matchIndex !== -1) {
    const target = activeWords[matchIndex];
    activeWords.splice(matchIndex, 1);
    correctWords += 1;
    streak += 1;
    const comboBonus = Math.max(0, streak - 1) * 2;
    score += 12 + comboBonus;
    removeWord(target, "correct");
    setStatus(
      streak > 1 ? `Combo x${streak}! Weiter so.` : "Treffer! Du bist on point."
    );
  } else {
    streak = 0;
    setStatus("Knapp daneben – versuch das nächste Wort.");
  }
  updateScoreboard();
}

function dropLife() {
  lives -= 1;
  if (lives < 0) lives = 0;
  updateLivesDisplay();
  if (lives === 0) {
    endGame("Keine Fallschirme mehr!");
  } else {
    setStatus(`Autsch! Noch ${lives} Schirme.`);
  }
}

function gameLoop(timestamp) {
  if (!isRunning) return;
  if (lastTimestamp === null) lastTimestamp = timestamp;
  const delta = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;
  const groundLimit = playfield.getBoundingClientRect().height - 100;

  for (let i = activeWords.length - 1; i >= 0; i--) {
    const falling = activeWords[i];
    falling.y += falling.speed * delta;
    falling.element.style.transform = `translate(-50%, ${falling.y}px)`;

    if (falling.y >= groundLimit) {
      removeWord(falling, "missed");
      activeWords.splice(i, 1);
      streak = 0;
      dropLife();
    }
  }
  gameLoopId = requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startGame);

guessForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = guessInput.value.trim();
  handleGuess(value);
  guessInput.value = "";
});

window.addEventListener("blur", () => {
  if (isRunning) {
    setStatus("Du bist kurz rausgetabt – die Wörter fallen weiter!");
  }
});

initLivesDisplay();
setStatus("Drück auf „Neue Runde starten“, um loszulegen.");
