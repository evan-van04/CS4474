class WordSearchGame {
  constructor() {
    this.words = [];
    this.grid = [];
    this.gridSize = 10;
    this.foundWords = new Set();
    this.selectedCells = [];
    this.isSelecting = false;
    this.wordPositions = new Map();
    
    this.init();
  }

  init() {
    // Load words from sessionStorage (set by input-words.js)
    let savedData = sessionStorage.getItem("spellingCentralWords");
    
    // Fallback to localStorage if sessionStorage is empty
    if (!savedData) {
      savedData = localStorage.getItem("spellingCentralWords");
    }

    if (!savedData) {
      alert("No words found. Please go back and input words first.");
      window.location.href = "input-words.html";
      return;
    }

    try {
      const wordData = JSON.parse(savedData);
      
      // Handle both data formats
      if (Array.isArray(wordData)) {
        // If it has 'word' property (from API), use it
        if (wordData[0]?.word) {
          this.words = wordData.map(item => item.word.toLowerCase());
        } 
        // If it has 'value' property (from input form), use it
        else if (wordData[0]?.value) {
          this.words = wordData.map(item => item.value.toLowerCase());
        }
        // Direct word strings
        else if (typeof wordData[0] === "string") {
          this.words = wordData.map(w => w.toLowerCase());
        }
      }

      if (!this.words || this.words.length === 0) {
        throw new Error("No valid words found");
      }
    } catch (error) {
      console.error("Error parsing words:", error);
      alert("Error loading words. Please try again.");
      window.location.href = "input-words.html";
      return;
    }

    // Generate word search grid
    this.generateGrid();
    this.renderGrid();
    this.renderWordList();
    this.attachEventListeners();
  }

  /**
   * Generate word search grid with words placed in random directions
   */
  generateGrid() {
    // Initialize empty grid
    this.grid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(""));

    // Place each word in the grid
    for (const word of this.words) {
      this.placeWord(word);
    }

    // Fill empty cells with random letters
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        if (this.grid[i][j] === "") {
          this.grid[i][j] = alphabet[Math.floor(Math.random() * alphabet.length)];
        }
      }
    }
  }

  /**
   * Place a single word in the grid
   */
  placeWord(word) {
    const directions = [
      [0, 1],   // Right
      [0, -1],  // Left
      [1, 0],   // Down
      [-1, 0],  // Up
      [1, 1],   // Down-Right
      [-1, -1], // Up-Left
      [1, -1],  // Down-Left
      [-1, 1]   // Up-Right
    ];

    let placed = false;
    let attempts = 0;

    while (!placed && attempts < 50) {
      const startRow = Math.floor(Math.random() * this.gridSize);
      const startCol = Math.floor(Math.random() * this.gridSize);
      const direction = directions[Math.floor(Math.random() * directions.length)];

      if (this.canPlaceWord(word, startRow, startCol, direction[0], direction[1])) {
        this.placeWordAt(word, startRow, startCol, direction[0], direction[1]);
        placed = true;
      }

      attempts++;
    }

    // If placement failed, try a simpler approach
    if (!placed) {
      this.placeWordSimple(word);
    }
  }

  /**
   * Check if a word can be placed at a given position
   */
  canPlaceWord(word, row, col, dRow, dCol) {
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;

      // Check bounds
      if (newRow < 0 || newRow >= this.gridSize || newCol < 0 || newCol >= this.gridSize) {
        return false;
      }

      // Check if cell is empty or matches the letter
      const cell = this.grid[newRow][newCol];
      if (cell !== "" && cell !== word[i]) {
        return false;
      }
    }

    return true;
  }

  /**
   * Place a word at a given position
   */
  placeWordAt(word, row, col, dRow, dCol) {
    for (let i = 0; i < word.length; i++) {
      const newRow = row + i * dRow;
      const newCol = col + i * dCol;
      this.grid[newRow][newCol] = word[i];
    }
    
    // Determine direction and store position
    let direction = "horizontal";
    if (dRow === 0 && Math.abs(dCol) === 1) {
      direction = "horizontal";
    } else if (dCol === 0 && Math.abs(dRow) === 1) {
      direction = "vertical";
    } else if (Math.abs(dRow) === 1 && Math.abs(dCol) === 1) {
      direction = "diagonal";
    }
    
    this.wordPositions.set(word, {
      row,
      col,
      dRow,
      dCol,
      direction
    });
  }

  /**
   * Simplified word placement (in case normal placement fails)
   */
  placeWordSimple(word) {
    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize - word.length; j++) {
        // Try horizontal
        let canPlace = true;
        for (let k = 0; k < word.length; k++) {
          if (this.grid[i][j + k] !== "" && this.grid[i][j + k] !== word[k]) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let k = 0; k < word.length; k++) {
            this.grid[i][j + k] = word[k];
          }
          return;
        }
      }
    }
  }

  /**
   * Render the word search grid
   */
  renderGrid() {
    const gridContainer = document.getElementById("wordSearchGrid");
    gridContainer.innerHTML = "";

    for (let i = 0; i < this.gridSize; i++) {
      for (let j = 0; j < this.gridSize; j++) {
        const cell = document.createElement("div");
        cell.className = "grid-cell";
        cell.textContent = this.grid[i][j].toUpperCase();
        cell.dataset.row = i;
        cell.dataset.col = j;
        cell.id = `cell-${i}-${j}`;

        cell.addEventListener("mousedown", (e) => this.handleCellMouseDown(e, i, j));
        cell.addEventListener("mouseenter", (e) => this.handleCellMouseEnter(e, i, j));
        cell.addEventListener("mouseup", () => this.handleCellMouseUp());
        cell.addEventListener("click", () => this.handleCellClick(i, j));

        gridContainer.appendChild(cell);
      }
    }
  }

  /**
   * Handle mouse down on grid cell
   */
  handleCellMouseDown(e, row, col) {
    this.isSelecting = true;
    this.selectedCells = [[row, col]];
    this.updateGridHighlight();
  }

  /**
   * Handle mouse enter on grid cell (for drag)
   */
  handleCellMouseEnter(e, row, col) {
    if (!this.isSelecting) return;

    // Check if this cell is adjacent to the last selected cell
    const lastCell = this.selectedCells[this.selectedCells.length - 1];
    const rowDiff = Math.abs(row - lastCell[0]);
    const colDiff = Math.abs(col - lastCell[1]);

    // Allow horizontal, vertical, or diagonal adjacent cells
    if ((rowDiff <= 1 && colDiff <= 1) && !(rowDiff === 0 && colDiff === 0)) {
      // Check if we're going in a consistent direction
      if (this.selectedCells.length === 1 || this.isValidContinuation(row, col)) {
        this.selectedCells.push([row, col]);
        this.updateGridHighlight();
      }
    }
  }

  /**
   * Handle mouse up on grid
   */
  handleCellMouseUp() {
    if (this.isSelecting && this.selectedCells.length > 1) {
      this.validateSelection();
    }
    this.isSelecting = false;
  }

  /**
   * Handle click on grid cell (alternative to drag)
   */
  handleCellClick(row, col) {
    if (this.selectedCells.length === 0) {
      this.selectedCells = [[row, col]];
    } else {
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
    }

    this.updateGridHighlight();
  }

  /**
   * Check if movement to new cell maintains direction
   */
  isValidContinuation(newRow, newCol) {
    if (this.selectedCells.length < 2) return true;

    const prev = this.selectedCells[this.selectedCells.length - 2];
    const current = this.selectedCells[this.selectedCells.length - 1];

    const dRow1 = current[0] - prev[0];
    const dCol1 = current[1] - prev[1];

    const dRow2 = newRow - current[0];
    const dCol2 = newCol - current[1];

    // Direction must remain consistent
    return dRow1 === dRow2 && dCol1 === dCol2;
  }

  /**
   * Update grid highlighting based on selected cells
   */
  updateGridHighlight() {
    // Clear all highlights
    document.querySelectorAll(".grid-cell").forEach(cell => {
      cell.classList.remove("selected", "found", "invalid");
    });

    // Highlight selected cells
    for (const [row, col] of this.selectedCells) {
      const cell = document.getElementById(`cell-${row}-${col}`);
      if (cell) {
        cell.classList.add("selected");
      }
    }
  }

  /**
   * Validate the selected word
   */
  validateSelection() {
    const selectedWord = this.selectedCells
      .map(([row, col]) => this.grid[row][col])
      .join("")
      .toLowerCase();

    // Get direction of selection
    const direction = this.getSelectionDirection();

    // Check forward
    if (this.words.includes(selectedWord) && !this.foundWords.has(selectedWord)) {
      this.markWordAsFound(selectedWord);
      this.highlightFoundCells(direction);
    } else if (this.words.includes(selectedWord) && this.foundWords.has(selectedWord)) {
      // Already found
      this.highlightFoundCells(direction);
    } else {
      // Check backward
      const reversedWord = selectedWord.split("").reverse().join("");
      if (this.words.includes(reversedWord) && !this.foundWords.has(reversedWord)) {
        this.markWordAsFound(reversedWord);
        this.highlightFoundCells(direction);
      } else if (this.words.includes(reversedWord) && this.foundWords.has(reversedWord)) {
        this.highlightFoundCells(direction);
      } else {
        // Invalid word
        this.highlightFoundCells("invalid");
        setTimeout(() => {
          this.clearSelection();
        }, 300);
      }
    }
  }

  /**
   * Get the direction of the current selection
   */
  getSelectionDirection() {
    if (this.selectedCells.length < 2) return "horizontal";
    
    const first = this.selectedCells[0];
    const last = this.selectedCells[this.selectedCells.length - 1];
    
    const rowDiff = last[0] - first[0];
    const colDiff = last[1] - first[1];
    
    if (rowDiff === 0) {
      return "horizontal";
    } else if (colDiff === 0) {
      return "vertical";
    } else {
      return "diagonal";
    }
  }

  /**
   * Mark a word as found
   */
  markWordAsFound(word) {
    this.foundWords.add(word);
    this.updateWordList();
  }

  /**
   * Highlight found cells in a specific way
   */
  highlightFoundCells(direction) {
    for (const [row, col] of this.selectedCells) {
      const cell = document.getElementById(`cell-${row}-${col}`);
      if (cell) {
        // Remove selected class but keep the color
        cell.classList.remove("selected", "invalid");
        cell.classList.add(direction); // Add horizontal, vertical, or diagonal class
      }
    }
  }

  /**
   * Clear selection
   */
  clearSelection() {
    this.selectedCells = [];
    this.updateGridHighlight();
  }

  /**
   * Render the word list
   */
  renderWordList() {
    const wordList = document.getElementById("wordList");
    wordList.innerHTML = "";

    for (const word of this.words) {
      const div = document.createElement("div");
      div.className = "word-item";
      div.textContent = word.charAt(0).toUpperCase() + word.slice(1);

      if (this.foundWords.has(word)) {
        div.classList.add("found");
      }

      wordList.appendChild(div);
    }
  }

  /**
   * Update word list (mark found words)
   */
  updateWordList() {
    for (const word of this.words) {
      const wordItems = document.querySelectorAll(".word-item");
      wordItems.forEach(item => {
        if (item.textContent.toLowerCase() === word) {
          if (this.foundWords.has(word)) {
            item.classList.add("found");
          } else {
            item.classList.remove("found");
          }
        }
      });
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    const submitButton = document.getElementById("submitButton");
    submitButton.addEventListener("click", () => this.handleSubmit());

    // Clear selection on document click outside grid
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".crossword-grid")) {
        this.clearSelection();
      }
    });
  }

  /**
   * Handle submit button click
   */
  handleSubmit() {
    if (this.foundWords.size === this.words.length) {
      alert("Congratulations! You found all the words!");
    } else {
      alert(`You found ${this.foundWords.size} out of ${this.words.length} words. Keep searching!`);
    }
  }
}

// Initialize game when page loads
window.addEventListener("load", () => {
  new WordSearchGame();
});
