import { animateTextContent, typeWriteContent } from "./textEffect.js";
import { fetchData } from "./fetchData.js";

const wordsContainer = document.querySelector(".words");
const submitButton = document.querySelector("#submit");
const title = document.querySelector("#title");
const prevButton = document.querySelector("#prevDay");
const nextButton = document.querySelector("#nextDay");

let wordsCounter = 0; // 선택된 단어 개수
let answerCount = 0; // 정답 블록 개수 (최대 4)
let allData = {}; // 오늘까지의 전체 데이터
let wordsData = []; // 오늘의 단어 데이터
let titleData = ""; // 오늘의 제목 데이터
let categoriesData = []; // 오늘의 카테고리 데이터
let currentKey = ""; // 날짜 키

// 데이터 불러오기
const loadAllData = async () => {
  const data = await fetchData();
  const today = new Date().setHours(0, 0, 0, 0);
  allData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => {
      const entryDate = new Date(value.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() <= today;
    })
  );

  // 오늘의 데이터 처리
  const todayString = new Date().toISOString().split("T")[0].replace(/-/g, ""); // ex. 20250418

  currentKey = allData[todayString]
    ? todayString
    : Object.keys(allData)[Object.keys(allData).length - 1];
  const todayData = allData[todayString]
    ? allData[todayString]
    : Object.values(allData)[Object.values(allData).length - 1];
  renderWords(todayData);

  // 어제, 내일 UI 처리
  const keys = Object.keys(allData).sort();
  const currentIndex = keys.indexOf(currentKey);
  if (currentIndex === 0) {
    prevButton.disabled = true;
  } else {
    prevButton.disabled = false;
  }

  if (currentIndex === keys.length - 1) {
    nextButton.disabled = true;
  } else {
    nextButton.disabled = false;
  }
};

// UI에 제목, 단어 렌더링 (날짜 변경 시에도 작용)
const renderWords = (dateData) => {
  [wordsData, categoriesData, titleData] = [
    dateData.words,
    dateData.categories,
    dateData.title,
  ];

  wordsContainer.innerHTML = "";
  answerCount = 0;
  wordsCounter = 0;
  wordsData.forEach((word) => {
    const li = document.createElement("li");
    li.textContent = word.content;
    li.addEventListener("click", onWordClick);
    wordsContainer.appendChild(li);
  });
  title.textContent = titleData;
  animateTextContent(submitButton, "관계 맺기");
  submitButton.style.backgroundColor = "";
};

// 날짜 이동
const moveDay = (direction) => {
  const keys = Object.keys(allData).sort();
  const currentIndex = keys.indexOf(currentKey);
  const newIndex = currentIndex + direction;
  const newKey = keys[newIndex];
  currentKey = newKey;
  const newDateData = allData[newKey];

  if (newIndex >= 0 && newIndex < keys.length) {
    renderWords(newDateData);
  }

  if (newIndex === 0) {
    prevButton.disabled = true;
  } else {
    prevButton.disabled = false;
  }

  if (newIndex === keys.length - 1) {
    nextButton.disabled = true;
  } else {
    nextButton.disabled = false;
  }
  submitButton.disabled = false;
  submitButton.style.backgroundColor = "";
};

// 정답 시 실행되는 함수
const handleCorrect = (selectedWords) => {
  wordsContainer.classList.add("disabled");
  submitButton.disabled = true;
  answerCount++;
  // 현재 정답 set 이전의 정답 (insertBefore를 위함)
  const insertionIndex = answerCount - 1;

  // 현재 정답 단어 + 남은 단어 (애니메이션을 위함)
  const remainingWords = document.querySelectorAll(
    ".words li:not(.correct), .answer-block"
  );

  // 단어별 boundingRect Map
  const positions = new Map();

  remainingWords.forEach((word) => {
    const rect = word.getBoundingClientRect();
    positions.set(word, rect);
  });

  // 정답 처리
  selectedWords.forEach((word, i) => {
    word.classList.add("correct");

    const children = Array.from(wordsContainer.children);

    if (insertionIndex + i < children.length) {
      wordsContainer.insertBefore(word, children[insertionIndex + i]);
    } else {
      wordsContainer.appendChild(word);
    }
  });

  // remainingWords에 대한 애니메이션 처리
  remainingWords.forEach((word) => {
    const oldRect = positions.get(word);
    const newRect = word.getBoundingClientRect();

    const deltaX = oldRect.left - newRect.left;
    const deltaY = oldRect.top - newRect.top;

    // 초기 위치로 트랜스폼
    word.style.transition = "none";
    word.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

    setTimeout(() => {
      word.classList.remove("active");
      // 강제로 리플로우
      word.getBoundingClientRect();

      // 트랜지션 부여 + 원래 위치로 이동
      requestAnimationFrame(() => {
        word.style.transition = "transform 0.8s ease";
        word.style.transform = "translate(0, 0)";
      });
    }, 1000);
  });

  setTimeout(() => {
    createAnswerBlock(selectedWords);
    wordsContainer.classList.remove("disabled");
    if (answerCount === 4) {
      submitButton.disabled = true;
      animateTextContent(submitButton, "모든 관계를 맺었습니다!");

      // 정답 정렬
      const answerBlocks = document.querySelectorAll(".answer-block");
      const sortedBlocks = Array.from(answerBlocks).sort(
        (a, b) => a.dataset.categoryId - b.dataset.categoryId
      );
      console.log(sortedBlocks);

      const oldPositions = new Map();
      sortedBlocks.forEach((block) => {
        const rect = block.getBoundingClientRect();
        oldPositions.set(block, rect);
      });

      sortedBlocks.forEach((block) => wordsContainer.appendChild(block));
      sortedBlocks.forEach((block) => {
        const oldRect = oldPositions.get(block);
        const newRect = block.getBoundingClientRect();

        const deltaX = oldRect.left - newRect.left;
        const deltaY = oldRect.top - newRect.top;

        block.style.transition = "none";
        block.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        block.getBoundingClientRect();

        requestAnimationFrame(() => {
          block.style.transition = "transform 0.8s ease";
          block.style.transform = "translate(0, 0)";
        });
      });
    } else {
      submitButton.disabled = false;
      animateTextContent(submitButton, "관계를 맺었습니다.");
    }

    // submitButton.style.backgroundColor = "mediumseagreen";
  }, 1800);

  wordsCounter = 0;
};

// one away 시 실행되는 함수
const handleOneAway = () => {
  submitButton.disabled = true;
  setTimeout(() => {
    submitButton.disabled = false;
    animateTextContent(submitButton, "관계를 거의 다 맺었습니다.");
    // submitButton.style.backgroundColor = "darkorange";
  }, 1800);
};

// 오답 시 실행되는 함수
const handleWrong = () => {
  submitButton.disabled = true;
  setTimeout(() => {
    submitButton.disabled = false;
    animateTextContent(
      submitButton,
      "관계를 맺지 못했습니다. 새로운 관계를 발견하셨나요?"
    );
    // submitButton.style.backgroundColor = "tomato";
  }, 1800);
};

// 정답 블록 만들기
const createAnswerBlock = (selectedWords) => {
  const answerBlock = document.createElement("div");
  answerBlock.classList.add("answer-block");

  const categoryId = wordsData.find(
    (word) => word.content === selectedWords[0].textContent
  ).category;

  answerBlock.classList.add(`category-${categoryId}`);
  answerBlock.dataset.categoryId = categoryId;

  const categoryName = categoriesData[categoryId];

  const wordTexts = Array.from(selectedWords)
    .map((w) => w.textContent)
    .join(", ");

  answerBlock.innerHTML = `
    <div class="category-name">${categoryName}</div>
    <div class="category-words">${wordTexts}</div>
  `;

  // 위치 유지하며 DOM에 삽입
  const insertionIndex = Array.from(wordsContainer.children).indexOf(
    selectedWords[0]
  );
  selectedWords.forEach((word) => word.remove()); // 기존 단어들 제거
  wordsContainer.insertBefore(
    answerBlock,
    wordsContainer.children[insertionIndex]
  );
};

// 단어 클릭 시 로직
const onWordClick = (event) => {
  const target = event.target;

  if (target.classList.contains("active")) {
    if (wordsCounter > 0) wordsCounter--;
    target.classList.remove("active");
  } else {
    if (wordsCounter < 4) {
      wordsCounter++;
      target.classList.add("active");
    }
  }
};

// 정답 확인 시 로직
const onSubmit = (e) => {
  e.preventDefault();

  // 선택된 단어 DOM element
  const selectedWords = document.querySelectorAll(".words li.active");
  // 4개 선택되지 않았을 경우 return
  if (selectedWords.length !== 4) {
    submitButton.style.backgroundColor = "";
    typeWriteContent(submitButton, "4개의 단어를 선택해 주세요.");
    return;
  }

  submitButton.style.backgroundColor = "";
  typeWriteContent(submitButton, "관계를 맺고 있습니다...");

  // category(정답) 숫자 array
  const selectedCategories = Array.from(selectedWords).map((word) => {
    const wordContent = word.textContent;
    const wordData = wordsData.find((data) => data.content === wordContent);
    return wordData ? wordData.category : null;
  });

  // 선택된 단어에 대해 category가 몇 개씩 있는지 확인하는 object
  const categoryCounts = {};
  selectedCategories.forEach((category) => {
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const uniqueCategories = Object.keys(categoryCounts).map(Number);

  if (uniqueCategories.length === 1) {
    // TODO: 정답 로직 구현
    handleCorrect(selectedWords);
    return;
  } else if (uniqueCategories.length === 2) {
    const values = Object.values(categoryCounts);
    if (values.includes(3) && values.includes(1)) {
      // TODO: one away 로직 구현
      handleOneAway(selectedWords);
      return;
    } else {
      // TODO: 오답 로직 구현
      handleWrong(selectedWords);
      return;
    }
  } else {
    // TODO: 오답 로직 구현
    handleWrong(selectedWords);
    return;
  }
};

document.addEventListener("DOMContentLoaded", () => {
  loadAllData();

  submitButton.textContent = "관계 맺기";
  submitButton.addEventListener("mousedown", (e) => {
    e.preventDefault();
  });
  submitButton.addEventListener("click", onSubmit);

  prevButton.addEventListener("click", () => {
    moveDay(-1);
  });
  nextButton.addEventListener("click", () => {
    moveDay(1);
  });
});
