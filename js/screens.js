/*Contains render functions for each screen.*/

function renderHomeScreen() {
  const app = getApp();
  app.innerHTML = `
    <section class="screen home-screen">
      <div class="logo-box">
        <h1 class="logo-title">Spelling Central</h1>
        <button id="start-btn" class="button secondary">Start</button>
      </div>
    </section>
  `;

  document.getElementById("start-btn").addEventListener("click", renderMenuScreen);
}

function renderMenuScreen() {
  const app = getApp();

  const cards = APP_DATA.activities.map(activity => `
    <div class="card" data-screen="${activity.id}">
      <h2>${activity.title}</h2>
      <p>Open the ${activity.title} activity.</p>
    </div>
  `).join("");

  app.innerHTML = `
    <section class="screen">
      <div class="top-bar">
        <h1 class="header">Select Game to Play</h1>
      </div>
      <div class="card-grid">${cards}</div>
    </section>
  `;

  document.querySelectorAll(".card").forEach(card => {
    card.addEventListener("click", () => {
      const screen = card.dataset.screen;
      navigateTo(screen);
    });
  });
}

function renderWordSearchScreen() {
  renderGameTemplate("Word Search");
}

function renderAlphabeticalScreen() {
  renderGameTemplate("Alphabetical");
}

function renderMixedWordsScreen() {
  renderGameTemplate("Mixed Words");
}

function renderMissingLetterScreen() {
  renderGameTemplate("Missing Letter");
}

function renderGameTemplate(title) {
  const app = getApp();
  app.innerHTML = `
    <section class="screen">
      <div class="top-bar">
        <h1 class="activity-title">${title}</h1>
        <button id="back-btn" class="button">Back</button>
      </div>
      <div class="game-screen-placeholder">
        <p>This is the ${title} page skeleton.</p>
        <p>Add game UI here.</p>
      </div>
    </section>
  `;

  document.getElementById("back-btn").addEventListener("click", renderMenuScreen);
}