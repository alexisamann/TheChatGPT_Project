const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const toTopBtn = document.querySelector(".to-top");
const yearSpan = document.querySelector("#year");
const inquiryForm = document.querySelector(".inquiry-form");

if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    navLinks.classList.toggle("open");
  });
}

if (toTopBtn) {
  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

if (inquiryForm) {
  inquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(inquiryForm);
    const project = data.get("project");
    alert(`Danke für deine Anfrage zu "${project}". Ich melde mich zeitnah zurück!`);
    inquiryForm.reset();
  });
}
