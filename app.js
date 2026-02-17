const optionsGrid = document.getElementById("options-grid");
const optionsError = document.getElementById("options-error");
const homeView = document.getElementById("home-view");
const qaView = document.getElementById("qa-view");
const qaTitle = document.getElementById("qa-title");
const qaList = document.getElementById("qa-list");
const qaLoading = document.getElementById("qa-loading");
const qaError = document.getElementById("qa-error");
const qaEmpty = document.getElementById("qa-empty");
const backButton = document.getElementById("back-button");

const state = {
  options: [],
  dataCache: new Map(),
};

const showElement = (el, show) => {
  el.hidden = !show;
};

const showHome = () => {
  homeView.hidden = false;
  qaView.hidden = true;
};

const showQa = () => {
  homeView.hidden = true;
  qaView.hidden = false;
};

const getAvatarUrl = (option) => {
  if (option.image) {
    return option.image;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(option.label)}&size=128&background=4b5563&color=fff`;
};

const renderOptions = () => {
  optionsGrid.innerHTML = "";
  state.options.forEach((option) => {
    const card = document.createElement("a");
    card.className = "option-card";
    card.href = `#/option/${option.id}`;
    const imgUrl = getAvatarUrl(option);
    card.innerHTML = `
      <img class="option-card__image" src="${imgUrl}" alt="${option.label}" onerror="this.onerror=null; this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(option.label)}&size=128&background=4b5563&color=fff';" />
      <div class="option-card__content">
        <h3>${option.label}</h3>
        <p>View questions and answers</p>
      </div>
    `;
    optionsGrid.appendChild(card);
  });
};

const formatAnswer = (item) => {
  if (item.english !== undefined && item.hinglish !== undefined) {
    const parts = [];
    if (item.english) parts.push(`English: ${item.english}`);
    if (item.hinglish) parts.push(`Hinglish: ${item.hinglish}`);
    return parts.join("\n\n");
  }
  return item.answer || "";
};

const groupByCategory = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    const cat = item.category || "General";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(item);
  });
  return groups;
};

const renderQaList = (items) => {
  qaList.innerHTML = "";
  const groups = groupByCategory(items);
  let questionNum = 1;

  groups.forEach((groupItems, category) => {
    const section = document.createElement("section");
    section.className = "qa-category";

    const heading = document.createElement("h3");
    heading.className = "qa-category__title";
    heading.textContent = category;
    section.appendChild(heading);

    groupItems.forEach((item) => {
      const block = document.createElement("div");
      block.className = "qa-item";

      const question = document.createElement("div");
      question.className = "qa-item__question";
      question.textContent = `${questionNum}) ${item.question}`;
      questionNum++;
      block.appendChild(question);

      const answer = document.createElement("div");
      answer.className = "qa-item__answer";
      answer.textContent = formatAnswer(item);
      block.appendChild(answer);

      section.appendChild(block);
    });

    qaList.appendChild(section);
  });
};

const loadOptions = async () => {
  try {
    const response = await fetch("./data/options.json");
    if (!response.ok) {
      throw new Error("Options request failed");
    }
    const data = await response.json();
    state.options = data;
    optionsError.hidden = true;
    renderOptions();
  } catch (error) {
    optionsError.hidden = false;
  }
};

const loadOptionData = async (option) => {
  if (state.dataCache.has(option.id)) {
    return state.dataCache.get(option.id);
  }
  const response = await fetch(option.dataFile);
  if (!response.ok) {
    throw new Error("Data request failed");
  }
  const data = await response.json();
  state.dataCache.set(option.id, data);
  return data;
};

const handleRoute = async () => {
  const hash = window.location.hash.replace(/^#/, "");
  const match = hash.match(/^\/option\/(.+)/);

  if (!match) {
    showHome();
    return;
  }

  const optionId = match[1];
  const option = state.options.find((item) => item.id === optionId);
  if (!option) {
    showHome();
    return;
  }

  showQa();
  qaTitle.textContent = option.label;
  showElement(qaError, false);
  showElement(qaEmpty, false);
  showElement(qaLoading, true);
  qaList.innerHTML = "";

  try {
    const items = await loadOptionData(option);
    showElement(qaLoading, false);
    showElement(qaEmpty, items.length === 0);
    renderQaList(items);
  } catch (error) {
    showElement(qaLoading, false);
    showElement(qaError, true);
  }
};

backButton.addEventListener("click", () => {
  window.location.hash = "";
});

window.addEventListener("hashchange", handleRoute);

loadOptions().then(handleRoute);
