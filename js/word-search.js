class WordSearchGame {
  constructor() {
    this.words = [];
    this.grid = [];
    this.gridSize = 10;
    this.foundWords = new Set();
    this.selectedCells = [];
    this.isSelecting = false;
    this.wordColorClasses = new Map();

    this.foundColorClasses = [
      "found-color-1",
      "found-color-2",
      "found-color-3",
      "found-color-4",
      "found-color-5",
      "found-color-6",
      "found-color-7",
      "found-color-8",
      "found-color-9",
      "found-color-10",
      "found-color-11",
      "found-color-12",
      "found-color-13",
      "found-color-14",
      "found-color-15",
      "found-color-16",
      "found-color-17",
      "found-color-18",
      "found-color-19",
      "found-color-20"
    ];

    this.availableFoundColors = [];

    this.gridElement = document.getElementById("wordSearchGrid");
    this.wordListElement = document.getElementById("wordList");
    this.completionModal = document.getElementById("completionModal");
    this.completionMessage = document.getElementById("completionMessage");
    this.playAgainButton = document.getElementById("playAgainButton");

    this.init();
  }

  init() {
    this.words = this.getStoredWords();

    if (this.words.length === 0) {
      alert("No words found. Please go back and input words first.");
      window.location.href = "input-words.html";
      return;
    }

    this.gridSize = Math.max(10, ...this.words.map((word) => word.length));

    this.attachGlobalEventListeners();
    this.startGame();
  }

  getStoredWords() {
    let savedData = sessionStorage.getItem("spellingCentralWords");

    if (!savedData) {
      savedData = localStorage.getItem("spellingCentralWords");
    }

    if (!savedData) {
      return [];
    }

    try {
      const parsed = JSON.parse(savedData);

      if (!Array.isArray(parsed)) {
        return [];
      }

      let words = [];

      if (parsed[0]?.word) {
        words = parsed.map((item) => String(item.word || "").trim().toLowerCase());
      } else if (parsed[0]?.value) {
        words = parsed.map((item) => String(item.value || "").trim().toLowerCase());
      } else if (typeof parsed[0] === "string") {
        words = parsed.map((item) => String(item || "").trim().toLowerCase());
      }

      return [...new Set(words.filter((word) => word.length > 0))];
    } catch (error) {
      console.error("Error parsing words:", error);
      return [];
    }
  }

  shuffleArray(items) {
    const copy = [...items];

    for (let index = copy.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
    }

    return copy;
  }

  startGame() {
    this.hideModal(this.completionModal);
    this.foundWords.clear();
    this.wordColorClasses.clear();
    this.selectedCells = [];
    this.isSelecting = false;
    this.availableFoundColors = this.shuffleArray(this.foundColorClasses);

    const totalLetters = this.words.reduce((sum, word) => sum + word.length, 0);
    const longestWord = Math.max(...this.words.map((word) => word.length));

    this.words = [...this.words].sort((a, b) => b.length - a.length);

    this.gridSize = Math.max(
      longestWord + 1,
      Math.ceil(Math.sqrt(totalLetters * 1.35)),
      10
    );

    this.generateGrid();
    this.renderGrid();
    this.renderWordList();
    this.setResponsiveLayout();
  }

  setResponsiveLayout() {
    const root = document.documentElement;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const isCompact = viewportWidth <= 900;
    const wordsPerColumn = 5;
    const wordColumns = Math.max(1, Math.ceil(this.words.length / wordsPerColumn));

    const headerHeight = isCompact ? 76 : 90;
    const pagePaddingX = isCompact ? 10 : 16;
    const contentPaddingTop = isCompact ? 10 : 12;
    const contentPaddingBottom = isCompact ? 12 : 16;

    let titlePx = isCompact ? 48 : wordColumns >= 3 ? 62 : 70;
    let titleMarginBottomPx = isCompact ? 12 : 22;

    let layoutGapPx = isCompact ? 16 : wordColumns >= 3 ? 28 : 36;

    let bankPaddingXPx = isCompact ? 14 : 24;
    let bankPaddingYPx = isCompact ? 14 : 22;
    let bankTitlePx = isCompact ? 28 : 36;
    let wordFontPx = isCompact ? 15 : wordColumns >= 3 ? 17 : 19;
    let wordColGapPx = isCompact ? 10 : wordColumns >= 3 ? 18 : 28;
    let wordRowGapPx = isCompact ? 8 : 12;
    let wordColMinPx = isCompact ? 88 : wordColumns >= 3 ? 106 : 130;

    let cellGapPx = isCompact ? 4 : 8;
    const hardMaxCell = isCompact ? 38 : 48;
    const hardMinCell = isCompact ? 22 : 24;

    const computeCellSize = () => {
      const estimatedWordBankWidth =
        bankPaddingXPx * 2 +
        wordColumns * wordColMinPx +
        Math.max(0, wordColumns - 1) * wordColGapPx +
        12;

      const availableWidth =
        viewportWidth -
        pagePaddingX * 2 -
        layoutGapPx -
        estimatedWordBankWidth -
        24;

      const availableHeight =
        viewportHeight -
        headerHeight -
        contentPaddingTop -
        contentPaddingBottom -
        titlePx -
        titleMarginBottomPx -
        24;

      const widthLimitedSize = Math.floor(
        (availableWidth - (this.gridSize - 1) * cellGapPx) / this.gridSize
      );

      const heightLimitedSize = Math.floor(
        (availableHeight - (this.gridSize - 1) * cellGapPx) / this.gridSize
      );

      return Math.min(widthLimitedSize, heightLimitedSize, hardMaxCell);
    };

    let cellSizePx = computeCellSize();

    if (cellSizePx < 38) {
      layoutGapPx = isCompact ? 12 : 20;
      bankPaddingXPx = isCompact ? 12 : 18;
      bankPaddingYPx = isCompact ? 12 : 16;
      bankTitlePx = isCompact ? 24 : 30;
      wordFontPx = isCompact ? 14 : 16;
      wordColGapPx = isCompact ? 8 : 14;
      wordRowGapPx = isCompact ? 6 : 10;
      wordColMinPx = isCompact ? 80 : 96;
      titlePx = isCompact ? 40 : 54;
      titleMarginBottomPx = isCompact ? 10 : 14;
      cellGapPx = isCompact ? 3 : 6;

      cellSizePx = computeCellSize();
    }

    if (cellSizePx < 30) {
      layoutGapPx = isCompact ? 10 : 16;
      bankPaddingXPx = isCompact ? 10 : 14;
      bankPaddingYPx = isCompact ? 10 : 12;
      bankTitlePx = isCompact ? 21 : 25;
      wordFontPx = isCompact ? 12 : 14;
      wordColGapPx = isCompact ? 6 : 10;
      wordRowGapPx = isCompact ? 5 : 8;
      wordColMinPx = isCompact ? 72 : 86;
      titlePx = isCompact ? 34 : 46;
      titleMarginBottomPx = isCompact ? 8 : 10;
      cellGapPx = isCompact ? 2 : 4;

      cellSizePx = computeCellSize();
    }

    cellSizePx = Math.max(hardMinCell, Math.min(hardMaxCell, cellSizePx));

    root.style.setProperty("--cell-size", `${cellSizePx}px`);
    root.style.setProperty("--cell-gap", `${cellGapPx}px`);
    root.style.setProperty("--layout-gap", `${layoutGapPx}px`);
    root.style.setProperty("--title-size", `${titlePx}px`);
    root.style.setProperty("--title-margin-bottom", `${titleMarginBottomPx}px`);
    root.style.setProperty("--bank-padding-x", `${bankPaddingXPx}px`);
    root.style.setProperty("--bank-padding-y", `${bankPaddingYPx}px`);
    root.style.setProperty("--bank-title-size", `${bankTitlePx}px`);
    root.style.setProperty("--word-font-size", `${wordFontPx}px`);
    root.style.setProperty("--word-col-gap", `${wordColGapPx}px`);
    root.style.setProperty("--word-row-gap", `${wordRowGapPx}px`);
    root.style.setProperty("--word-col-min", `${wordColMinPx}px`);
  }

  generateGrid() {
    let success = false;
    let attempts = 0;

    while (!success && attempts < 40) {
      this.grid = Array.from({ length: this.gridSize }, () =>
        Array(this.gridSize).fill("")
      );

      success = true;

      for (const word of this.words) {
        const placed = this.placeWord(word);
        if (!placed) {
          success = false;
          break;
        }
      }

      if (!success) {
        attempts += 1;
      }
    }

    if (!success) {
      this.gridSize += 2;
      this.generateGrid();
      return;
    }

    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        if (this.grid[row][col] === "") {
          this.grid[row][col] =
            alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }
  }

  placeWord(word) {
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1]
    ];

    for (let attempts = 0; attempts < 300; attempts += 1) {
      const startRow = Math.floor(Math.random() * this.gridSize);
      const startCol = Math.floor(Math.random() * this.gridSize);
      const [dRow, dCol] =
        directions[Math.floor(Math.random() * directions.length)];

      if (this.canPlaceWord(word, startRow, startCol, dRow, dCol)) {
        this.placeWordAt(word, startRow, startCol, dRow, dCol);
        return true;
      }
    }

    return this.placeWordSimple(word);
  }

  canPlaceWord(word, row, col, dRow, dCol) {
    for (let index = 0; index < word.length; index += 1) {
      const nextRow = row + index * dRow;
      const nextCol = col + index * dCol;

      if (
        nextRow < 0 ||
        nextRow >= this.gridSize ||
        nextCol < 0 ||
        nextCol >= this.gridSize
      ) {
        return false;
      }

      const cellValue = this.grid[nextRow][nextCol];
      if (cellValue !== "" && cellValue !== word[index]) {
        return false;
      }
    }

    return true;
  }

  placeWordAt(word, row, col, dRow, dCol) {
    for (let index = 0; index < word.length; index += 1) {
      const nextRow = row + index * dRow;
      const nextCol = col + index * dCol;
      this.grid[nextRow][nextCol] = word[index];
    }
  }

  placeWordSimple(word) {
    const directions = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0],
      [1, 1],
      [-1, -1],
      [1, -1],
      [-1, 1]
    ];

    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        for (const [dRow, dCol] of directions) {
          if (this.canPlaceWord(word, row, col, dRow, dCol)) {
            this.placeWordAt(word, row, col, dRow, dCol);
            return true;
          }
        }
      }
    }

    return false;
  }

  renderGrid() {
    this.gridElement.innerHTML = "";
    this.gridElement.style.gridTemplateColumns = `repeat(${this.gridSize}, var(--cell-size))`;
    this.gridElement.style.gridTemplateRows = `repeat(${this.gridSize}, var(--cell-size))`;

    for (let row = 0; row < this.gridSize; row += 1) {
      for (let col = 0; col < this.gridSize; col += 1) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.textContent = this.grid[row][col].toUpperCase();
        cell.dataset.row = String(row);
        cell.dataset.col = String(col);
        cell.id = `cell-${row}-${col}`;

        cell.addEventListener("mousedown", (event) => this.handleCellMouseDown(event, row, col));
        cell.addEventListener("mouseenter", () => this.handleCellMouseEnter(row, col));
        cell.addEventListener("click", () => this.handleCellClick(row, col));

        this.gridElement.appendChild(cell);
      }
    }
  }

  renderWordList() {
    this.wordListElement.innerHTML = "";

    for (const word of this.words) {
      const item = document.createElement("div");
      item.className = "word-item";
      item.dataset.word = word;
      item.textContent = word.charAt(0).toUpperCase() + word.slice(1);

      if (this.foundWords.has(word)) {
        item.classList.add("found");
      }

      this.wordListElement.appendChild(item);
    }
  }

  updateWordList() {
    const items = this.wordListElement.querySelectorAll(".word-item");
    items.forEach((item) => {
      const word = item.dataset.word || "";
      item.classList.toggle("found", this.foundWords.has(word));
    });
  }

  handleCellMouseDown(event, row, col) {
    event.preventDefault();
    this.isSelecting = true;
    this.selectedCells = [[row, col]];
    this.updateGridHighlight();
  }

  handleCellMouseEnter(row, col) {
    if (!this.isSelecting) {
      return;
    }

    const lastCell = this.selectedCells[this.selectedCells.length - 1];
    if (!lastCell) {
      return;
    }

    if (lastCell[0] === row && lastCell[1] === col) {
      return;
    }

    const rowDiff = Math.abs(row - lastCell[0]);
    const colDiff = Math.abs(col - lastCell[1]);

    if ((rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0)) {
      if (this.selectedCells.length === 1 || this.isValidContinuation(row, col)) {
        this.selectedCells.push([row, col]);
        this.updateGridHighlight();
      }
    }
  }

  handleCellClick(row, col) {
    if (this.isSelecting) {
      return;
    }

    if (this.selectedCells.length === 0) {
      this.selectedCells = [[row, col]];
      this.updateGridHighlight();
      return;
    }

    const lastCell = this.selectedCells[this.selectedCells.length - 1];
    const rowDiff = Math.abs(row - lastCell[0]);
    const colDiff = Math.abs(col - lastCell[1]);

    if ((rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0)) {
      if (this.selectedCells.length === 1 || this.isValidContinuation(row, col)) {
        this.selectedCells.push([row, col]);
      } else {
        this.selectedCells = [[row, col]];
      }
    } else {
      this.selectedCells = [[row, col]];
    }

    this.updateGridHighlight();
  }

  handleGlobalMouseUp() {
    if (!this.isSelecting) {
      return;
    }

    if (this.selectedCells.length > 1) {
      this.validateSelection();
    }

    this.isSelecting = false;
  }

  isValidContinuation(newRow, newCol) {
    if (this.selectedCells.length < 2) {
      return true;
    }

    const previous = this.selectedCells[this.selectedCells.length - 2];
    const current = this.selectedCells[this.selectedCells.length - 1];

    const previousRowDelta = current[0] - previous[0];
    const previousColDelta = current[1] - previous[1];
    const nextRowDelta = newRow - current[0];
    const nextColDelta = newCol - current[1];

    return previousRowDelta === nextRowDelta && previousColDelta === nextColDelta;
  }

  updateGridHighlight() {
    document.querySelectorAll(".grid-cell").forEach((cell) => {
      cell.classList.remove("selected", "invalid");
    });

    for (const [row, col] of this.selectedCells) {
      const cell = document.getElementById(`cell-${row}-${col}`);
      if (cell) {
        cell.classList.add("selected");
      }
    }
  }

  validateSelection() {
    const selectedWord = this.selectedCells
      .map(([row, col]) => this.grid[row][col])
      .join("")
      .toLowerCase();

    const reversedWord = selectedWord.split("").reverse().join("");
    const matchedWord = this.words.includes(selectedWord)
      ? selectedWord
      : this.words.includes(reversedWord)
        ? reversedWord
        : null;

    if (matchedWord && !this.foundWords.has(matchedWord)) {
      this.completeWord(matchedWord);
      return;
    }

    if (matchedWord && this.foundWords.has(matchedWord)) {
      window.setTimeout(() => this.clearSelection(), 160);
      return;
    }

    this.highlightSelection("invalid");
    window.setTimeout(() => this.clearSelection(), 280);
  }

  getNextFoundColorClass() {
    if (this.availableFoundColors.length === 0) {
      this.availableFoundColors = this.shuffleArray(this.foundColorClasses);
    }

    return this.availableFoundColors.shift();
  }

  removeFoundColorClasses(cell) {
    this.foundColorClasses.forEach((className) => {
      cell.classList.remove(className);
    });
  }

  completeWord(word) {
    this.foundWords.add(word);

    const colorClass = this.wordColorClasses.get(word) || this.getNextFoundColorClass();
    this.wordColorClasses.set(word, colorClass);

    this.highlightSelection(colorClass);
    this.updateWordList();

    window.setTimeout(() => {
      this.clearSelection();

      if (this.foundWords.size === this.words.length) {
        this.showCompletionModal();
      }
    }, 220);
  }

  highlightSelection(className) {
    for (const [row, col] of this.selectedCells) {
      const cell = document.getElementById(`cell-${row}-${col}`);
      if (!cell) {
        continue;
      }

      cell.classList.remove("selected", "invalid");

      if (className.startsWith("found-color-")) {
        this.removeFoundColorClasses(cell);
      }

      cell.classList.add(className);
    }
  }

  clearSelection() {
    this.selectedCells = [];
    this.updateGridHighlight();
  }

  showModal(modalElement) {
    modalElement.classList.remove("hidden");
    modalElement.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  hideModal(modalElement) {
    modalElement.classList.add("hidden");
    modalElement.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  showCompletionModal() {
    this.completionMessage.textContent = "Awesome job! You finished the word search!";
    this.showModal(this.completionModal);
  }

  attachGlobalEventListeners() {
    document.addEventListener("mouseup", () => this.handleGlobalMouseUp());

    document.addEventListener("click", (event) => {
      if (!event.target.closest(".crossword-grid")) {
        this.clearSelection();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !this.completionModal.classList.contains("hidden")) {
        this.hideModal(this.completionModal);
      }
    });

    window.addEventListener("resize", () => {
      this.setResponsiveLayout();
    });

    this.playAgainButton.addEventListener("click", () => this.startGame());
  }
}

window.addEventListener("load", () => {
  new WordSearchGame();
});