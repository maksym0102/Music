const shuffleArray = <T>(array: T[], cur: number) => {
  let currentIndex = array.length - 1;
  let randomIndex: number;

  if (cur >= 0) [array[0], array[cur]] = [array[cur], array[0]];
  // While there remain elements to shuffle...
  while (currentIndex > 0) {
    // Pick a remaining element...
    randomIndex = Math.ceil(Math.random() * currentIndex);
    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    currentIndex--;
  }

  return array;
};

export default shuffleArray;
