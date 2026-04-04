const STORAGE_KEY = "spellingCentralWords";
const COUNTDOWN_START = 3;

const lettersRow = document.getElementById("lettersRow");
const hintBubble = document.getElementById("hintBubble");
const progressPill = document.getElementById("progressPill");
const completionModal = document.getElementById("completionModal");
const playAgainButton = document.getElementById("playAgainButton");

const correctSound = new Audio("../sfx/correct.wav");
correctSound.preload = "auto";

const gameState = {
  words: [],
  currentIndex: 0,
  currentWord: null,
  missingIndex: 0,
  typedValue: "",
  interactionLocked: false,
};

function normalizeWord(value) {
  return String(value || "").trim().toLowerCase();
}

function shuffleArray(items) {
  const copy = [...items];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }

  return copy;
}

function playSound(sound) {
  if (!sound) return;

  sound.currentTime = 0;
  sound.play().catch(() => {
    // Ignore autoplay timing issues
  });
}

function getStoredWords() {
  const raw = sessionStorage.getItem(STORAGE_KEY);

  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((entry) => {
        const value = typeof entry?.value === "string" ? entry.value.trim() : "";
        return {
          slot: Number(entry?.slot) || 0,
          value,
          normalized: normalizeWord(value),
        };
      })
      .filter((entry) => entry.normalized.length > 0);
  } catch (error) {
    console.error("Could not read stored words:", error);
    return [];
  }
}

function buildDefinitionMap() {
  if (!Array.isArray(WORD_BANK)) {
    return new Map();
  }

  return new Map(
    WORD_BANK
      .filter((entry) => entry && typeof entry.word === "string")
      .map((entry) => [normalizeWord(entry.word), entry.definition || "A fun word to solve."])
  );
}

function buildGameWords() {
  const storedWords = getStoredWords();
  const definitionMap = buildDefinitionMap();

  if (storedWords.length === 0) {
    return [];
  }

  const preparedWords = storedWords.map((entry) => ({
    word: entry.normalized,
    displayWord: entry.value.toUpperCase(),
    definition: definitionMap.get(entry.normalized) || "A fun word to solve.",
  }));

  return shuffleArray(preparedWords);
}

function pickMissingIndex(word) {
  return Math.floor(Math.random() * word.length);
}

function setHintText(value) {
  hintBubble.textContent = value;
}

function updateProgress() {
  progressPill.textContent = `${Math.min(gameState.currentIndex + 1, gameState.words.length)}/${gameState.words.length}`;
}

function setResponsiveLayout() {
  const root = document.documentElement;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const allLengths = gameState.words.length
    ? gameState.words.map((entry) => entry.word.length)
    : [3];

  const currentLength = Math.max(gameState.currentWord?.word.length || 3, 3);
  const maxLength = Math.max(...allLengths, currentLength, 3);
  const isCompact = viewportWidth <= 900;

  const headerHeight = isCompact ? 76 : 90;

  let titlePx = isCompact ? 52 : maxLength >= 10 ? 70 : 76;
  let titleGapPx = isCompact ? 10 : 14;
  let instructionPx = isCompact ? 15 : 18;
  let instructionMarginPx = isCompact ? 14 : 20;

  let tileGapPx = isCompact ? 10 : 12;
  let hardMaxTile = isCompact ? 64 : 72;
  let hardMinTile = isCompact ? 42 : 48;

  const availableWidth = viewportWidth - (isCompact ? 32 : 96);
  const tileSizeByWidth = Math.floor(
    (Math.min(availableWidth, 900) - (currentLength - 1) * tileGapPx) / currentLength
  );

  const availableHeight =
    viewportHeight -
    headerHeight -
    titlePx -
    titleGapPx -
    instructionPx -
    instructionMarginPx -
    180;

  const tileSizeByHeight = Math.floor(Math.max(availableHeight, hardMinTile));
  let tileSizePx = Math.min(tileSizeByWidth, tileSizeByHeight, hardMaxTile);
  tileSizePx = Math.max(hardMinTile, tileSizePx);

  if (tileSizePx < 54) {
    titlePx = isCompact ? 44 : 60;
    titleGapPx = 8;
    instructionPx = isCompact ? 14 : 16;
    instructionMarginPx = 12;
  }

  if (tileSizePx < 48) {
    tileGapPx = isCompact ? 8 : 10;
  }

  const lettersWidthPx = currentLength * tileSizePx + (currentLength - 1) * tileGapPx;
  const shellWidthPx = Math.min(
    Math.max(lettersWidthPx + (isCompact ? 40 : 120), isCompact ? 320 : 620),
    isCompact ? viewportWidth - 24 : 940
  );

  const shellMinHeightPx = Math.min(
    Math.max(tileSizePx + 260, isCompact ? 360 : 410),
    viewportHeight - headerHeight - 18
  );

  const hintMinWidthPx = Math.min(Math.max(Math.round(lettersWidthPx * 0.7), isCompact ? 260 : 360), viewportWidth - 40);
  const hintMaxWidthPx = Math.min(Math.max(Math.round(lettersWidthPx * 1.08), isCompact ? 320 : 440), viewportWidth - 30);

  const hintFontPx = tileSizePx < 50 ? (isCompact ? 14 : 16) : (isCompact ? 15 : 18);
  const progressWidthPx = tileSizePx < 50 ? (isCompact ? 108 : 120) : (isCompact ? 120 : 136);
  const progressFontPx = tileSizePx < 50 ? (isCompact ? 26 : 30) : (isCompact ? 30 : 34);
  const letterFontPx = Math.round(tileSizePx * 0.5);

  root.style.setProperty("--mw-shell-width", `${shellWidthPx}px`);
  root.style.setProperty("--mw-shell-min-height", `${shellMinHeightPx}px`);
  root.style.setProperty("--mw-title-size", `${titlePx}px`);
  root.style.setProperty("--mw-title-gap", `${titleGapPx}px`);
  root.style.setProperty("--mw-instruction-size", `${instructionPx}px`);
  root.style.setProperty("--mw-instruction-margin", `${instructionMarginPx}px`);
  root.style.setProperty("--mw-tile-size", `${tileSizePx}px`);
  root.style.setProperty("--mw-tile-gap", `${tileGapPx}px`);
  root.style.setProperty("--mw-letter-font-size", `${letterFontPx}px`);
  root.style.setProperty("--mw-hint-min-width", `${hintMinWidthPx}px`);
  root.style.setProperty("--mw-hint-max-width", `${hintMaxWidthPx}px`);
  root.style.setProperty("--mw-hint-font-size", `${hintFontPx}px`);
  root.style.setProperty("--mw-progress-min-width", `${progressWidthPx}px`);
  root.style.setProperty("--mw-progress-font-size", `${progressFontPx}px`);
  root.style.setProperty(
    "--mw-shell-before-inset",
    isCompact ? "18% 8% 22% 8%" : "22% 20% 26% 20%"
  );
}

function getInputStateClass() {
  const expected = gameState.currentWord.word[gameState.missingIndex];

  if (!gameState.typedValue) return "neutral";
  return gameState.typedValue === expected ? "correct" : "incorrect";
}

function renderWord() {
  lettersRow.innerHTML = "";

  const word = gameState.currentWord.word;

  word.split("").forEach((letter, index) => {
    if (index === gameState.missingIndex) {
      const input = document.createElement("input");
      input.type = "text";
      input.maxLength = 1;
      input.className = `letter-tile missing-input ${getInputStateClass()}`;
      input.value = gameState.typedValue ? gameState.typedValue.toUpperCase() : "";
      input.placeholder = "_";
      input.autocomplete = "off";
      input.autocapitalize = "characters";
      input.spellcheck = false;
      input.disabled = gameState.interactionLocked;
      input.setAttribute("aria-label", "Type the missing letter");

      input.addEventListener("keydown", handleMissingInputKeydown);
      input.addEventListener("click", () => input.select());

      lettersRow.appendChild(input);

      if (!gameState.interactionLocked) {
        requestAnimationFrame(() => {
          input.focus();
          input.select();
        });
      }
    } else {
      const tile = document.createElement("div");
      tile.className = "letter-tile neutral";
      tile.textContent = letter.toUpperCase();
      tile.setAttribute("aria-hidden", "true");
      lettersRow.appendChild(tile);
    }
  });
}

function evaluateGuess() {
  renderWord();

  const expected = gameState.currentWord.word[gameState.missingIndex];

  if (gameState.typedValue === expected) {
    gameState.interactionLocked = true;
    renderWord();
    playSound(correctSound);

    if (gameState.currentIndex >= gameState.words.length - 1) {
      setHintText("You did it!");
      showModal(completionModal);
      return;
    }

    startCountdown();
  }
}

function handleMissingInputKeydown(event) {
  if (gameState.interactionLocked) {
    event.preventDefault();
    return;
  }

  const key = event.key;

  if (key === "Tab") return;

  if (key === "Backspace" || key === "Delete") {
    event.preventDefault();
    gameState.typedValue = "";
    renderWord();
    return;
  }

  if (!/^[a-zA-Z]$/.test(key)) {
    if (key.length === 1) {
      event.preventDefault();
    }
    return;
  }

  event.preventDefault();
  gameState.typedValue = key.toLowerCase();
  evaluateGuess();
}

const MODAL_CLOSE_DURATION = 380;

function showModal(modalElement) {
  if (modalElement.hideTimer) {
    window.clearTimeout(modalElement.hideTimer);
    modalElement.hideTimer = null;
  }

  modalElement.classList.remove("hidden");
  modalElement.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  window.requestAnimationFrame(() => {
    modalElement.classList.add("is-visible");
  });
}

function hideModal(modalElement) {
  if (modalElement.classList.contains("hidden")) {
    modalElement.classList.remove("is-visible");
    modalElement.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    return;
  }

  modalElement.classList.remove("is-visible");
  modalElement.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (modalElement.hideTimer) {
    window.clearTimeout(modalElement.hideTimer);
  }

  modalElement.hideTimer = window.setTimeout(() => {
    if (!modalElement.classList.contains("is-visible")) {
      modalElement.classList.add("hidden");
    }
    modalElement.hideTimer = null;
  }, MODAL_CLOSE_DURATION);
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function startCountdown() {
  for (let count = COUNTDOWN_START; count >= 1; count -= 1) {
    setHintText(`Next word in ${count}...`);
    await wait(1000);
  }

  gameState.currentIndex += 1;

  if (gameState.currentIndex >= gameState.words.length) {
    setHintText("You did it!");
    showModal(completionModal);
    return;
  }

  loadCurrentWord();
}

function loadCurrentWord() {
  gameState.currentWord = gameState.words[gameState.currentIndex];
  gameState.missingIndex = pickMissingIndex(gameState.currentWord.word);
  gameState.typedValue = "";
  gameState.interactionLocked = false;

  setResponsiveLayout();
  updateProgress();
  setHintText(gameState.currentWord.definition);
  renderWord();
}

function startGame() {
  hideModal(completionModal);
  gameState.words = buildGameWords();
  gameState.currentIndex = 0;

  if (gameState.words.length === 0) {
    window.location.href = "input-words.html";
    return;
  }

  loadCurrentWord();
}

function handleEscapeKey(event) {
  if (event.key !== "Escape") return;

  if (!completionModal.classList.contains("hidden")) {
    hideModal(completionModal);
  }
}

playAgainButton.addEventListener("click", startGame);
document.addEventListener("keydown", handleEscapeKey);
window.addEventListener("resize", setResponsiveLayout);
document.addEventListener("DOMContentLoaded", startGame);