// Обидві сторінки працюють без бібліотек; усі страви вже є в HTML.
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
const qr = document.body.classList.contains("qr-page");
const categoryLinks = [...document.querySelectorAll("[data-category-link]")];
const categories = [...document.querySelectorAll("[data-menu-category]")];
const categoryNav = document.querySelector(".category-sticky");
let spyFrame = 0;
function updateCategory() {
  spyFrame = 0;
  const visible = categories.filter((category) => !category.hidden);
  const threshold = (categoryNav?.offsetHeight || 65) + 36;
  let active = visible[0];
  for (const category of visible) {
    if (category.getBoundingClientRect().top <= threshold) active = category;
  }
  categoryLinks.forEach((link) => {
    if (link.dataset.categoryLink === active?.id)
      link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  });
}
function scheduleSpy() {
  if (!spyFrame) spyFrame = requestAnimationFrame(updateCategory);
}
addEventListener("scroll", scheduleSpy, { passive: true });
addEventListener("resize", scheduleSpy);
categoryLinks.forEach((link) =>
  link.addEventListener("click", (event) => {
    const category = document.getElementById(link.dataset.categoryLink);
    if (!category || category.hidden) return;
    event.preventDefault();
    history.replaceState(null, "", link.hash);
    category.scrollIntoView({
      behavior: reduced.matches ? "instant" : "smooth",
    });
  }),
);
addEventListener("load", scheduleSpy, { once: true });

// Фільтри не приховують склад або ціни й залишають доступними всі категорії.
const filterButtons = [...document.querySelectorAll("[data-filter]")];
filterButtons.forEach((button) =>
  button.addEventListener("click", () => {
    const tag = button.dataset.filter;
    filterButtons.forEach((candidate) =>
      candidate.setAttribute("aria-pressed", String(candidate === button)),
    );
    let matches = 0;
    document.querySelectorAll(".dish").forEach((dish) => {
      dish.hidden =
        tag !== "all" && !dish.dataset.tags.split("|").includes(tag);
      if (!dish.hidden) matches++;
    });
    categories.forEach((category) => {
      category.hidden = ![...category.querySelectorAll(".dish")].some(
        (dish) => !dish.hidden,
      );
      const link = categoryLinks.find(
        (link) => link.dataset.categoryLink === category.id,
      );
      link.hidden = category.hidden;
    });
    document.querySelector(".filter-status").textContent =
      `Показано позицій: ${matches}. Фільтр: ${button.textContent}.`;
    updateCategory();
  }),
);

// Native dialog забезпечує фокус усередині та закриття клавішею Esc.
const dialog = document.querySelector("#dish-dialog");
const modalImage = document.querySelector("#dialog-image");
let opener;
function closeDish() {
  if (dialog.open) dialog.close();
}
document.querySelectorAll(".dish-open").forEach((button) =>
  button.addEventListener("click", () => {
    opener = button;
    const image = button.closest(".dish").querySelector("img");
    modalImage.src = image.getAttribute("src");
    modalImage.alt = image.alt;
    document.querySelector("#dialog-title").textContent = button.dataset.title;
    document.querySelector("#dialog-description").textContent =
      button.dataset.description;
    document.querySelector("#dialog-ingredients").textContent =
      button.dataset.ingredients;
    document.querySelector("#dialog-weight").textContent =
      button.dataset.weight;
    document.querySelector("#dialog-price").textContent = button.dataset.price;
    document.querySelector("#dialog-kind").textContent =
      button.dataset.illustration === "true"
        ? "Lume / Векторна ілюстрація страви"
        : "Lume / З нашого демо-меню";
    document.body.classList.add("modal-open");
    dialog.showModal();
    dialog.scrollTop = 0;
    document.querySelector(".dialog-copy").scrollTop = 0;
    updateDock();
  }),
);
document.querySelector(".dialog-close").addEventListener("click", closeDish);
document.querySelector(".dialog-back").addEventListener("click", closeDish);
dialog.addEventListener("close", () => {
  document.body.classList.remove("modal-open");
  opener?.focus({ preventScroll: true });
  updateDock();
});
dialog.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (
    event.clientX < bounds.left ||
    event.clientX > bounds.right ||
    event.clientY < bounds.top ||
    event.clientY > bounds.bottom
  )
    closeDish();
});
let swipeStart;
const media = document.querySelector(".dialog-media");
media.addEventListener(
  "touchstart",
  (event) => {
    const touch = event.changedTouches[0];
    swipeStart = {
      x: touch.clientX,
      y: touch.clientY,
      time: performance.now(),
    };
  },
  { passive: true },
);
media.addEventListener(
  "touchend",
  (event) => {
    if (!swipeStart) return;
    const touch = event.changedTouches[0],
      dx = touch.clientX - swipeStart.x,
      dy = touch.clientY - swipeStart.y;
    if (
      performance.now() - swipeStart.time < 800 &&
      (dy > 80 || Math.abs(dx) > 100)
    )
      closeDish();
    swipeStart = null;
  },
  { passive: true },
);

// Панель броні зʼявляється лише між hero та контактами, не поверх модального вікна.
const dock = document.querySelector(".mobile-dock");
const heroButton = document.querySelector(".hero-cta");
const visit = document.querySelector("#visit");
let heroPassed = false;
let visitReached = false;
function updateDock() {
  if (dock) dock.hidden = dialog.open || !heroPassed || visitReached;
}
if (dock) {
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target === heroButton)
        heroPassed = entry.boundingClientRect.bottom < 0;
      if (entry.target === visit)
        visitReached = entry.boundingClientRect.top < innerHeight;
    }
    updateDock();
  });
  observer.observe(heroButton);
  observer.observe(visit);
  let dockFrame = 0;
  const scheduleDock = () => {
    if (dockFrame) return;
    dockFrame = requestAnimationFrame(() => {
      dockFrame = 0;
      heroPassed = heroButton.getBoundingClientRect().bottom < 0;
      visitReached = visit.getBoundingClientRect().top < innerHeight;
      updateDock();
    });
  };
  addEventListener("scroll", scheduleDock, { passive: true });
  addEventListener("resize", scheduleDock);
}

// Зображення зʼявляються після декодування, розмір рядка при цьому не змінюється.
document.querySelectorAll('img[loading="lazy"]').forEach((image) => {
  if (image.complete) return;
  image.classList.add("image-pending");
  const finish = () =>
    image
      .decode()
      .catch(() => {})
      .finally(() => image.classList.remove("image-pending"));
  image.addEventListener("load", finish, { once: true });
  image.addEventListener(
    "error",
    () => image.classList.remove("image-pending"),
    { once: true },
  );
});
if (!qr && !reduced.matches) {
  // Анімуємо лише видимий елемент: довге меню не створює зайвих шарів на старті.
  const reveal = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const element = entry.target;
        const index = element.classList.contains("dish")
          ? [...element.parentElement.children].indexOf(element) % 4
          : 0;
        element.animate(
          [
            { opacity: 0, transform: "translateY(16px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 500,
            delay: index * 45,
            easing: "cubic-bezier(.22,1,.36,1)",
            fill: "backwards",
          },
        );
        reveal.unobserve(element);
      }),
    { threshold: 0.05 },
  );
  document
    .querySelectorAll(
      ".story-heading,.story-body,.category-heading,.dish,.moments-heading,.moments-grid figure,.review-list figure,.booking-copy",
    )
    .forEach((element) => reveal.observe(element));
  reduced.addEventListener("change", () => {
    if (reduced.matches) {
      reveal.disconnect();
      document.getAnimations().forEach((animation) => animation.finish());
    }
  });
}

const mapButton = document.querySelector(".map-load");
mapButton?.addEventListener("click", () => {
  const frame = document.createElement("iframe");
  frame.title = "OpenStreetMap: центр Черкас, демонстраційна локація Lume";
  frame.src =
    "https://www.openstreetmap.org/export/embed.html?bbox=32.045%2C49.436%2C32.078%2C49.453&layer=mapnik&marker=49.444%2C32.061";
  frame.referrerPolicy = "no-referrer";
  document.querySelector("#map-canvas").append(frame);
  mapButton.hidden = true;
});
const bookingForm = document.querySelector(".booking-form");
const dateField = document.querySelector("#booking-date");
if (dateField) {
  const today = new Date();
  const localDate = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000,
  )
    .toISOString()
    .slice(0, 10);
  dateField.min = localDate;
}
bookingForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!bookingForm.reportValidity()) return;
  const data = new FormData(bookingForm);
  const text = `Демо-заявка Lume\nІмʼя: ${data.get("name")}\nТелефон: ${data.get("phone")}\nДата: ${data.get("date")}\nЧас: ${data.get("time")}\nГостей: ${data.get("guests")}`;
  window.open(
    `https://t.me/lume_demo?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
});
