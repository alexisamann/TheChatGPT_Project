const hero = document.querySelector("[data-parallax]");
const orbs = document.querySelectorAll(".orb");
const yearLabel = document.getElementById("year");
const forms = document.querySelectorAll("form.signup");

/**
 * Updates the footer year dynamically to keep the landing page evergreen.
 */
function setCurrentYear() {
  if (!yearLabel) return;
  yearLabel.textContent = new Date().getFullYear();
}

/**
 * Applies a subtle parallax effect to the hero background based on pointer position.
 * @param {MouseEvent | TouchEvent} event
 */
function handleParallax(event) {
  if (!hero) return;
  const rect = hero.getBoundingClientRect();
  const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
  const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;
  const x = (clientX - rect.left) / rect.width - 0.5;
  const y = (clientY - rect.top) / rect.height - 0.5;

  hero.style.setProperty("--tiltX", `${y * 6}deg`);
  hero.style.setProperty("--tiltY", `${x * -6}deg`);

  orbs.forEach((orb, index) => {
    const depth = (index + 1) * 10;
    orb.style.transform = `translate(${x * depth}px, ${y * depth}px)`;
  });
}

/**
 * Shows a confirmation toast-like message when a signup form is submitted.
 * @param {SubmitEvent} event
 */
function handleSignup(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.querySelector("input[type='email']");
  if (!input) return;
  input.value = "";
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = "Danke! Wir melden uns mit der nächsten Ausgabe.";
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("visible"));
  setTimeout(() => toast.remove(), 3000);
}

/**
 * Attaches all interactive behaviors.
 */
function init() {
  setCurrentYear();
  hero?.addEventListener("pointermove", handleParallax);
  hero?.addEventListener("pointerleave", () => {
    hero.style.removeProperty("--tiltX");
    hero.style.removeProperty("--tiltY");
    orbs.forEach((orb) => (orb.style.transform = "translate(0, 0)"));
  });
  forms.forEach((form) => form.addEventListener("submit", handleSignup));
}

init();
