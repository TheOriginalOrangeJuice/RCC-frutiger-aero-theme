import bubbleArtwork from "../../img/aero-nav-scenes-primary.webp";

export function initializeArtwork() {
  const navigation = document.querySelector(".aero-primary-nav");
  if (navigation) {
    const image = new Image();
    image.onload = () => navigation.classList.add("aero-art-ready");
    image.onerror = () => navigation.classList.remove("aero-art-ready");
    image.src = bubbleArtwork;
  }

  document.querySelectorAll("[data-aero-logo]").forEach(image => {
    const update = () => {
      image.parentElement.classList.toggle(
        "is-logo-ready",
        image.complete && image.naturalWidth > 0,
      );
    };
    image.addEventListener("load", update);
    image.addEventListener("error", update);
    update();
  });
}
