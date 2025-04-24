import { fetchData } from "./fetchData.js";

const dictionarySection = document.querySelector(".section.dictionary");
const dictionaryContainer = document.querySelector(".dictionary-container");

const wordList = {}; // 사전 데이터
let allData = {}; // 오늘까지의 전체 데이터

const createDictionary = async () => {
  const data = await fetchData();
  const today = new Date().setHours(0, 0, 0, 0);
  allData = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => {
      const entryDate = new Date(value.date);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() <= today;
    })
  );

  // 단어 리스트 생성
  for (const [key, value] of Object.entries(allData)) {
    value.words.forEach((word) => {
      if (!wordList[word.content]) wordList[word.content] = [];

      wordList[word.content].push({
        date: value.date,
        category: value.categories[word.category],
        connectedWords: value.words
          .filter(
            (w) => w.category === word.category && w.content !== word.content
          )
          .map((w) => w.content),
      });
    });
  }

  // 가나다순 정렬
  const keys = Object.keys(wordList);
  keys.sort((a, b) => a.localeCompare(b, "ko"));

  // 단어들 사전에 렌더링
  keys.forEach((key) => {
    const span = document.createElement("span");
    span.classList.add("word");
    span.dataset.word = key;
    span.textContent = key;
    dictionaryContainer.appendChild(span);
    span.addEventListener("click", onWordClick);
  });
};

const onWordClick = (event) => {
  const target = event.target;

  if (!target || !target.classList.contains("word")) return;

  const targetWord = target.dataset.word;

  if (target && target.classList.contains("active")) {
    target.textContent = targetWord;
    target.classList.remove("active");
    return;
  }
  const wordInfo = wordList[targetWord];

  target.classList.add("active");
  wordInfo.forEach((info) => {
    target.textContent += `${
      hasBatchim(targetWord) ? "은" : "는"
    } ${info.connectedWords.join(", ")}${
      hasBatchim(info.connectedWords[2]) ? "과" : "와"
    } 〈${info.category}〉${
      hasBatchimForRo(info.category) ? "으로" : "로"
    } 하나가 됩니다(${info.date.substring(0, 10).replace(/-/g, ".")})`;
  });
};

document.addEventListener("DOMContentLoaded", () => {
  createDictionary();
});

const hasBatchim = (koreanWord) => {
  if (!koreanWord) {
    return false; // Empty string has no batchim
  }

  const lastChar = koreanWord.charCodeAt(koreanWord.length - 1);

  // Check if the last character is a Hangul syllable (AC00-D7AF in Unicode)
  if (lastChar < 0xac00 || lastChar > 0xd7af) {
    return false; // Not a Hangul syllable, so no batchim to detect
  }

  // Extract the final consonant (받침) part of the Hangul syllable
  const finalConsonantCode = (lastChar - 0xac00) % 28;

  // If finalConsonantCode is not 0, it means there is a batchim
  return finalConsonantCode !== 0;
};

const hasBatchimForRo = (koreanWord) => {
  if (!koreanWord) {
    return false; // Empty string has no batchim
  }

  const lastChar = koreanWord.charCodeAt(koreanWord.length - 1);

  // Check if the last character is a Hangul syllable (AC00-D7AF in Unicode)
  if (lastChar < 0xac00 || lastChar > 0xd7af) {
    return false; // Not a Hangul syllable, so no batchim to detect
  }

  // Extract the final consonant (받침) part of the Hangul syllable
  const finalConsonantCode = (lastChar - 0xac00) % 28;

  if (finalConsonantCode === 8) {
    return false;
  }

  // If finalConsonantCode is not 0, it means there is a batchim
  return finalConsonantCode !== 0;
};
