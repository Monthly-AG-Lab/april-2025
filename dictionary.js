import { fetchData } from "./fetchData.js";

const dictionarySection = document.querySelector(".section.dictionary");
const dictionaryContainer = document.querySelector(".dictionary-container");
const statsContainer = document.querySelector(".stats-container");

const wordList = {}; // 사전 데이터
let allData = {}; // 오늘까지의 전체 데이터
let multipleWordsCount = 0;
let mostFrequentNum = 0;
let mostFrequentWord = "";

const createDictionary = async() => {
    const data = await fetchData();
    const today = new Date().setHours(0, 0, 0, 0);
    allData = Object.fromEntries(
        Object.entries(data).filter(([key, value]) => {
            const entryDate = new Date(value.date);
            entryDate.setHours(0, 0, 0, 0);
            return entryDate.getTime() <= today;
        })
    );

    const days = Object.keys(allData).length;

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

            if (wordList[word.content].length == 2) {
                multipleWordsCount++;
            }

            if (wordList[word.content].length > mostFrequentNum) {
                mostFrequentNum = wordList[word.content].length;
                mostFrequentWord = word.content;
            }
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

    // 통계 컨테이너에 렌더링
    const dayStats = document.createElement("p");
    dayStats.textContent = `오늘까지 ${days}일 동안 ${
    Object.keys(wordList).length
  }개의 단어들이 ${days * 4}개의 관계들을 맺었습니다.`;
    const multipleStats = document.createElement("p");
    multipleStats.textContent = `그 중 ${multipleWordsCount}개의 단어들은 관계들의 무대에 두 번 이상 올랐습니다.`;
    const mostFrequentStats = document.createElement("p");
    mostFrequentStats.textContent = ` 게다가 "${mostFrequentWord}"${
      hasBatchim(mostFrequentWord) ? "은" : "는"
    } 무려 ${mostFrequentNum}번이나 관계들을 맺었군요!`;
    statsContainer.appendChild(dayStats);
    statsContainer.appendChild(multipleStats);
    statsContainer.appendChild(mostFrequentStats);
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
        wordInfo.forEach((info, idx) => {
                    target.textContent += `${
      idx === 0 ? `${hasBatchim(targetWord) ? "은" : "는"}` : ` 그리고`
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