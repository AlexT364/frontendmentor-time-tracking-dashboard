class Dashboard {
  constructor(container) {
    this.container = container;
    this.data = [];
    this.cards = [];
    this.periodManager = new PeriodManager();
  }

  async init() {
    this.data = await this.getData();
    this.createCards();

    this.render();
  }

  async getData() {
    const response = await fetch("/data/data.json");
    return await response.json();
  }

  createCards() {
    this.cards.push(new UserCard(this, this.periodManager));

    this.data.forEach((activityData) => {
      this.cards.push(new ActivityCard(this.periodManager, activityData));
    });
  }

  updateCards() {
    this.cards
      .filter((card) => card instanceof ActivityCard)
      .forEach((card, index) => {
        this.animateCard(card.element);
        card.updateCard();
      });
  }

  animateCard(cardToAnimate) {
    const timeElement = cardToAnimate.querySelector(".activity__time");
    timeElement.classList.add("animate");

    setTimeout(() => {
      timeElement.classList.remove("animate");
    }, 0);
  }

  render() {
    this.cards.forEach((card) => this.container.append(card.element));
  }
}

class ActivityCard {
  constructor(periodManager, activityData) {
    this.periodManager = periodManager;
    this.activityData = activityData;
    this.element = this.createElement();
  }

  createElement() {
    const { title, timeframes } = this.activityData;
    const { current, previous } =
      timeframes[this.periodManager.getCurrentPeriod()];
    const titleLowerCase = title.toLowerCase();

    const activityCard = document.createElement("article");
    activityCard.className = `activity-card ${titleLowerCase.replace(" ", "-")}`;

    activityCard.innerHTML = `
     <img src="/images/icon-${titleLowerCase.replace(" ", "-")}.svg" alt="${titleLowerCase} icon" />
       <section class="activity-card__content">
        <header class="activity__header">
          <p class="activity__name">${title}</p>
          <button class="activity__btn">
            <img src="/images/icon-ellipsis.svg" alt="" />
          </button>
        </header>
        <div class="activity__time">
          <p class="time__current">
            <time datetime="PT${current}H">${current}hrs</time>
          </p>
          <p class="time__previous">
            <time datetime="PT${previous}H">${this.periodManager.getLabel()} - ${previous}hrs</time>
          </p>
         </div>
    </section>`;

    return activityCard;
  }

  updateCard() {
    const currentPeriod = this.periodManager.getCurrentPeriod();
    const { current, previous } = this.activityData.timeframes[currentPeriod];

    const timeCurrent = this.element.querySelector(".time__current > time");
    timeCurrent.textContent = `${current}hrs`;
    timeCurrent.setAttribute("datetime", `PT${current}H`);

    const timePrevious = this.element.querySelector(".time__previous > time");
    timePrevious.textContent = `${this.periodManager.getLabel()} - ${previous}hrs`;
    timePrevious.setAttribute("datetime", `PT${previous}H`);
  }
}

class UserCard {
  constructor(dashboard, periodManager) {
    this.periodManager = periodManager;
    this.element = this.createUserCard();
    this.dashboard = dashboard;
  }

  createUserCard() {
    const userCard = document.createElement("article");
    userCard.className = "user-card";

    userCard.innerHTML = `
      <header class="user__header">
        <img src="/images/image-jeremy.png" alt="" />
        <div class="user__info">
          <p class="user__label">Report for</p>
          <h1 class="user__name">Jeremy Robson</h1>
        </div>
      </header>
     <div class="period-selector">
      </div>
    `;

    const periodSelector = new PeriodSelector(this.periodManager, () => {
      this.dashboard.updateCards();
    });

    userCard.querySelector(".period-selector").append(periodSelector.element);

    return userCard;
  }
}

class PeriodManager {
  #currentPeriod = "weekly";
  #periodLabels = {
    daily: "Yesterday",
    weekly: "Last week",
    monthly: "Last month",
  };
  #allowedPeriods = ["daily", "weekly", "monthly"];

  getLabel() {
    return this.#periodLabels[this.#currentPeriod];
  }

  getCurrentPeriod() {
    return this.#currentPeriod;
  }

  getAllowedPeriods() {
    return [...this.#allowedPeriods];
  }

  setCurrentPeriod(period) {
    period = period.trim().toLowerCase().replace(" ", "-");

    if (!this.#allowedPeriods.includes(period)) {
      throw new Error("Invalid period");
    }
    this.#currentPeriod = period;
  }
}

class PeriodSelector {
  constructor(periodManager, onPeriodChange) {
    this.periodManager = periodManager;
    this.onPeriodChange = onPeriodChange;
    this.element = this.createElement();
  }

  createElement() {
    const container = document.createElement("ul");
    this.periodManager.getAllowedPeriods().forEach((period) => {
      const li = document.createElement("li");
      li.append(this.createButton(period));
      container.append(li);
    });

    return container;
  }

  createButton(period) {
    const button = document.createElement("button");
    button.className = `btn ${period === this.periodManager.getCurrentPeriod() ? "active" : ""}`;
    button.textContent = period[0].toUpperCase() + period.slice(1);
    button.addEventListener("click", () => this.handleClick(button, period));
    return button;
  }

  handleClick(button, period) {
    this.periodManager.setCurrentPeriod(period);
    this.onPeriodChange(period);
    this.updateActiveButton(button);
  }

  updateActiveButton(clickedButton) {
    this.element.querySelectorAll(".btn").forEach((button) => {
      button.classList.remove("active");
    });
    clickedButton.classList.add("active");
  }
}

const dashboard = new Dashboard(document.getElementById("dashboard"));
dashboard.init();
