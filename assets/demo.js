// Демо не надсилає дані: лише готує повідомлення в Telegram.
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const heroCTA = document.querySelector(".hero-cta"),
  contact = document.querySelector("#contact"),
  dock = document.querySelector(".mobile-dock");
if (heroCTA && contact && dock) {
  const update = () => {
    dock.hidden = !(
      heroCTA.getBoundingClientRect().bottom < 0 &&
      contact.getBoundingClientRect().top > innerHeight
    );
  };
  new IntersectionObserver(update, { threshold: [0, 1] }).observe(heroCTA);
  new IntersectionObserver(update).observe(contact);
  addEventListener("scroll", update, { passive: true });
  addEventListener("resize", update);
  update();
}
const tabs = [...document.querySelectorAll("[role=tab]")],
  panels = [...document.querySelectorAll("[role=tabpanel]")],
  search = document.querySelector("#menu-search");
function select(tab) {
  tabs.forEach((t) => {
    t.setAttribute("aria-selected", t === tab);
    t.tabIndex = t === tab ? 0 : -1;
  });
  panels.forEach(
    (p) => (p.hidden = p.id !== tab.getAttribute("aria-controls")),
  );
  if (search) {
    search.value = "";
    document.querySelectorAll(".dish").forEach((d) => (d.hidden = false));
    document.querySelector(".no-results").hidden = true;
  }
}
tabs.forEach((t, i) => {
  t.addEventListener("click", () => select(t));
  t.addEventListener("keydown", (e) => {
    if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) {
      e.preventDefault();
      const n =
        e.key === "Home"
          ? 0
          : e.key === "End"
            ? tabs.length - 1
            : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) %
              tabs.length;
      select(tabs[n]);
      tabs[n].focus();
    }
  });
});
search?.addEventListener("input", () => {
  const query = search.value.toLocaleLowerCase("uk").trim();
  let count = 0;
  panels.forEach((p) => {
    let found = 0;
    p.querySelectorAll(".dish").forEach((d) => {
      d.hidden = !d.dataset.search.includes(query);
      if (!d.hidden) found++;
    });
    p.hidden = query
      ? !found
      : p.id !==
        tabs
          .find((t) => t.getAttribute("aria-selected") === "true")
          .getAttribute("aria-controls");
    count += found;
  });
  document.querySelector(".no-results").hidden = count > 0;
});
document.querySelectorAll("form[data-telegram]").forEach((f) =>
  f.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!f.reportValidity()) return;
    const d = new FormData(f),
      text = `Демо-заявка\nІмʼя: ${d.get("name")}\nТелефон: ${d.get("phone")}\nДеталі: ${d.get("details")}`;
    window.open(
      `https://t.me/${f.dataset.telegram}?text=${encodeURIComponent(text)}`,
      "_blank",
      "noopener,noreferrer",
    );
  }),
);
document
  .querySelector(".comparison input")
  ?.addEventListener("input", (e) =>
    e.target
      .closest(".comparison")
      .style.setProperty("--split", `${e.target.value}%`),
  );
if (!reduced) {
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.remove("waiting");
          observer.unobserve(e.target);
        }
      }),
    { threshold: 0.08 },
  );
  document
    .querySelectorAll(
      ".section-heading,.story-copy,.reasons article,.reviews figure",
    )
    .forEach((el) => {
      el.classList.add("reveal", "waiting");
      observer.observe(el);
    });
  const counters = new IntersectionObserver((es) =>
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target,
        target = +el.dataset.count,
        start = performance.now();
      function frame(now) {
        const p = Math.min((now - start) / 600, 1);
        el.textContent = Math.round(target * (1 - (1 - p) ** 3)).toLocaleString(
          "uk",
        );
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
      counters.unobserve(el);
    }),
  );
  document
    .querySelectorAll("[data-count]")
    .forEach((el) => counters.observe(el));
  const heroImage = document.querySelector(
    ".hero>img,.hero-image img,.hero-photo img",
  );
  if (heroImage && matchMedia("(min-width:901px)").matches)
    addEventListener(
      "scroll",
      () => {
        if (scrollY < innerHeight)
          heroImage.style.transform = `translateY(${Math.min(scrollY * 0.05, 30)}px) scale(1.04)`;
      },
      { passive: true },
    );
}
