// 텍스트 효과: POP
const animateTextContent = (element, newText) => {
  element.textContent = newText;
  element.classList.remove("pop-animation");

  // Trigger reflow to restart animation
  void element.offsetWidth;

  element.classList.add("pop-animation");
};

// 텍스트 효과: Typewriter
const typeWriteContent = (element, newText, speed = 50) => {
  element.textContent = "";
  // element.classList.add("typewriter-text");

  let index = 0;

  const interval = setInterval(() => {
    element.textContent += newText.charAt(index);
    index++;
    if (index === newText.length) {
      clearInterval(interval);
    }
  }, speed);
};

export { animateTextContent, typeWriteContent };
