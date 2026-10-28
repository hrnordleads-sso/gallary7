(function () {
  const bubblesContainer = document.getElementById("bubbles-container");
  if (!bubblesContainer) return;

  function createBubble() {
    const bubble = document.createElement("img");
    bubble.src =
      "assets/bubble.png";
    bubble.className = "bubble-img";
    bubble.alt = "";
    const size = Math.random() * 20 + 10 + "px";
    bubble.style.width = size;
    bubble.style.height = "auto";
    bubble.style.left = Math.random() * 100 + "%";
    bubble.style.bottom = "-50px";
    bubble.style.opacity = String(Math.random() * 0.4 + 0.2);

    const duration = Math.random() * 6 + 4;
    bubble.style.animation = `floatUpImg ${duration}s linear forwards`;

    bubblesContainer.appendChild(bubble);
    setTimeout(() => bubble.remove(), duration * 1000);
  }

  setInterval(createBubble, 400);
})();
