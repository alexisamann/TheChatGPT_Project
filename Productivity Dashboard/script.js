const STORAGE_KEY = "productivity-dashboard";
const PROGRESS_STEP = 5;

const elements = {
  goalInput: document.getElementById("goalInput"),
  goalLabel: document.getElementById("goalLabel"),
  percentLabel: document.getElementById("progressPercent"),
  increment: document.getElementById("increment"),
  decrement: document.getElementById("decrement"),
  circle: document.querySelector(".progress-bar"),
};

const state = {
  goal: "",
  progress: 0,
};

const circleCircumference = (() => {
  const radius = elements.circle.r.baseVal.value;
  const circumference = 2 * Math.PI * radius;
  elements.circle.style.strokeDasharray = `${circumference} ${circumference}`;
  elements.circle.style.strokeDashoffset = `${circumference}`;
  return circumference;
})();

/**
 * Reads the stored dashboard state from localStorage and merges it into the
 * in-memory state object.
 */
function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return;
    if (typeof saved.goal === "string") state.goal = saved.goal;
    if (typeof saved.progress === "number") {
      state.progress = clamp(saved.progress, 0, 100);
    }
  } catch (error) {
    console.warn("Konnte gespeicherten Fortschritt nicht laden", error);
  }
}

/**
 * Persists the current state into localStorage so the dashboard survives reloads.
 */
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Restricts a number to stay within an allowed range.
 * @param {number} value - The value to clamp.
 * @param {number} min - Minimum permitted value.
 * @param {number} max - Maximum permitted value.
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/**
 * Updates the goal text in the UI and persists it.
 * @param {string} value
 */
function updateGoal(value) {
  state.goal = value.trim();
  elements.goalLabel.textContent = state.goal || "Kein Ziel";
  saveState();
}

/**
 * Updates the progress percentage, refreshes related UI pieces, and persists.
 * @param {number} nextValue
 */
function updateProgress(nextValue) {
  state.progress = clamp(nextValue, 0, 100);
  elements.percentLabel.textContent = `${state.progress}%`;
  const offset = circleCircumference * (1 - state.progress / 100);
  elements.circle.style.strokeDashoffset = `${offset}`;
  elements.circle.style.stroke = state.progress >= 100 ? "var(--success)" : "var(--accent)";
  elements.increment.disabled = state.progress >= 100;
  elements.decrement.disabled = state.progress <= 0;
  saveState();
}

/**
 * Sets up event listeners and hydrates the UI with the restored state.
 */
function init() {
  loadState();
  elements.goalInput.value = state.goal;
  updateGoal(state.goal);
  updateProgress(state.progress);

  elements.goalInput.addEventListener("input", (event) => {
    updateGoal(event.target.value);
  });

  elements.increment.addEventListener("click", () => {
    updateProgress(state.progress + PROGRESS_STEP);
  });

  elements.decrement.addEventListener("click", () => {
    updateProgress(state.progress - PROGRESS_STEP);
  });
}

init();
