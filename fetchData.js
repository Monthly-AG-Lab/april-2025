export const fetchData = async () => {
  const response = await fetch("assets/words.json");
  const data = await response.json();
  return data;
};
