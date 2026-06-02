import { triggerConfetti } from "@/lib/confetti";

/** Fires a celebratory confetti burst. The certificate modal is opened by the
 *  caller (Layout) so it can manage React state. Kept separate so completion
 *  celebration can be triggered from multiple places. */
export function celebrateCompletion() {
  triggerConfetti();
  // A second, delayed burst for extra flair.
  setTimeout(() => triggerConfetti(), 700);
}

/** localStorage key tracking whether the user has already seen the completion
 *  celebration this device, to avoid re-firing on every page load. */
export const CELEBRATED_KEY = "internpal_completion_celebrated";

export function hasCelebrated(userId: string): boolean {
  try {
    return localStorage.getItem(`${CELEBRATED_KEY}_${userId}`) === "1";
  } catch {
    return false;
  }
}

export function markCelebrated(userId: string) {
  try {
    localStorage.setItem(`${CELEBRATED_KEY}_${userId}`, "1");
  } catch {
    /* ignore */
  }
}
