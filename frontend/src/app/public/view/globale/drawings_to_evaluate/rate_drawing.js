// Page dessins à évaluer - en construction
console.log("Page dessins à évaluer chargée");

  const list = extractBase64List(imagesBase64).map(normalizeBase64).filter(Boolean);

  if (!list.length) return;

  carouselInner.innerHTML = "";
  indicators.innerHTML = "";

  list.forEach((src, index) => {
    const item = document.createElement("div");
    item.className = `carousel-item${index === 0 ? " active" : ""}`;

    const img = document.createElement("img");
    img.src = src;
    img.alt = `Dessin ${index + 1}`;
    img.loading = "lazy";
    img.className = "d-block w-100";

    item.appendChild(img);
    carouselInner.appendChild(item);

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("data-bs-target", "#drawingsCarousel");
    button.setAttribute("data-bs-slide-to", String(index));
    button.setAttribute("aria-label", `Slide ${index + 1}`);
    if (index === 0) {
      button.className = "active";
      button.setAttribute("aria-current", "true");
    }
    indicators.appendChild(button);
  });
}
