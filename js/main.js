let cols = 1;

/// Control navigation
let currentFocusIndex = 0;
let focusableElements = [];

// Initialize function
const init = function () {
  console.log("init() called");

  focusableElements = Array.from(document.querySelectorAll(".focusable"));

  calculateGrid();

  document.body.setAttribute("tabindex", "0");
  document.body.focus();

  updateFocus();
  registerTizenKeys();

  document.addEventListener("visibilitychange", handleVisibilityChange);
  document.addEventListener("keydown", handleKeyDown);

  startTime();
};

// ---------------------------
// CALCULA GRID
// ---------------------------

function calculateGrid() {
  if (focusableElements.length === 0) return;

  const firstRowTop = focusableElements[0].getBoundingClientRect().top;

  cols = 0;

  for (let i = 0; i < focusableElements.length; i++) {
    const top = focusableElements[i].getBoundingClientRect().top;

    if (Math.abs(top - firstRowTop) < 5) {
      cols++;
    } else {
      break;
    }
  }

  console.log("COLS detectado corretamente:", cols);
}

window.onload = init;

// ---------------------------
// FOCUS SYSTEM
// ---------------------------

function updateFocus() {
  focusableElements.forEach((el, index) => {
    if (index === currentFocusIndex) {
      el.classList.add("focused");

      el.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "center",
      });
    } else {
      el.classList.remove("focused");
    }
  });

  handleEdgeScroll();
}

// ---------------------------
// EDGE SCROLL
// ---------------------------

function handleEdgeScroll() {
  const active = focusableElements[currentFocusIndex];
  if (!active) return;

  const rect = active.getBoundingClientRect();
  const windowHeight = window.innerHeight;

  const elementCenter = rect.top + rect.height / 2;
  const screenCenter = windowHeight / 2;

  const offset = elementCenter - screenCenter;

  window.scrollBy({
    top: offset,
    behavior: "smooth",
  });
}

// ---------------------------
// KEY HANDLER
// ---------------------------

function handleKeyDown(e) {
  const key = e.keyCode || e.which;

  switch (key) {
    case 37: // LEFT
      if (currentFocusIndex % cols !== 0) {
        currentFocusIndex--;
        updateFocus();
      }
      break;

    case 39: // RIGHT
      if (
        currentFocusIndex % cols !== cols - 1 &&
        currentFocusIndex < focusableElements.length - 1
      ) {
        currentFocusIndex++;
        updateFocus();
      }
      break;

    case 38: // UP
      if (currentFocusIndex - cols >= 0) {
        currentFocusIndex -= cols;
        updateFocus();
      }
      break;

    case 40: // DOWN
      if (currentFocusIndex + cols < focusableElements.length) {
        currentFocusIndex += cols;
        updateFocus();
      }
      break;

    case 13: // ENTER (browser + TV)
      handleSelect();
      break;

    case 10009: // BACK (Tizen)
      e.preventDefault();
      exitApp();
      break;
  }
}

// ---------------------------
// SELECT ACTION
// ---------------------------

function handleSelect() {
  const activeItem = focusableElements[currentFocusIndex];

  if (!activeItem) return;

  const titleEl = activeItem.querySelector(".card-title");

  const title = titleEl ? titleEl.innerText : "Item";

  console.log("Selecionado:", title);
  alert(`Você selecionou: ${title}`);
}

// ---------------------------
// TIZEN KEYS
// ---------------------------

function registerTizenKeys() {
  if (window.tizen && tizen.tvinputdevice) {
    try {
      tizen.tvinputdevice.registerKey("Back");
    } catch (err) {
      console.warn("Tizen key registration failed:", err);
    }
  }
}

// ---------------------------
// EXIT APP
// ---------------------------

function exitApp() {
  if (window.tizen) {
    try {
      tizen.application.getCurrentApplication().exit();
    } catch (err) {
      console.error("Exit error:", err);
    }
  } else {
    console.log("Exit fallback");
    if (confirm("Deseja fechar o app?")) {
      window.close();
    }
  }
}

// ---------------------------
// VISIBILITY
// ---------------------------

function handleVisibilityChange() {
  if (document.hidden) {
    console.log("App oculto");
  } else {
    console.log("App ativo novamente");
  }
}

// ---------------------------
// CLOCK (corrigido)
// ---------------------------

function startTime() {
  const today = new Date();

  let h = today.getHours();
  let m = today.getMinutes();
  let s = today.getSeconds();

  m = checkTime(m);
  s = checkTime(s);

  setTimeout(startTime, 1000); // corrigido (10ms era absurdo)
}

function checkTime(i) {
  return i < 10 ? "0" + i : i;
}
