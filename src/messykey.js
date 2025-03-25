export function useMessyKey(inputElement) {
  let keyTimes = [];
  let lastTime = Date.now();

  inputElement.addEventListener('keydown', (e) => {
    const now = Date.now();
    const timeDiff = now - lastTime;
    keyTimes.push({ key: e.key, timeDiff });
    lastTime = now;
  });

  return {
    train: () => [...keyTimes],
    verify: (trainedPattern, tolerance = 200) => {
      if (keyTimes.length !== trainedPattern.length) return false;

      return keyTimes.every((entry, i) =>
        entry.key === trainedPattern[i].key &&
        Math.abs(entry.timeDiff - trainedPattern[i].timeDiff) < tolerance
      );
    },
    reset: () => {
      keyTimes = [];
      lastTime = Date.now();
    },
    getPattern: () => [...keyTimes],
  };
}
