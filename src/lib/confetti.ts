export function triggerConfetti() {
  import("canvas-confetti").then((confetti) => {
    const count = 200;
    const defaults = { origin: { y: 0.7 } };
    confetti.default({
      ...defaults,
      particleCount: count,
      spread: 100,
    });
    confetti.default({
      ...defaults,
      particleCount: count * 0.6,
      angle: 60,
      spread: 55,
    });
    confetti.default({
      ...defaults,
      particleCount: count * 0.6,
      angle: 120,
      spread: 55,
    });
  });
}
