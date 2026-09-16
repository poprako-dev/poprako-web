export const AUTO_SAVE_INTERVAL_MS = 60_000;

export function startAutoSaveSchedule(run: () => void) {
  let nextDue = Date.now() + AUTO_SAVE_INTERVAL_MS;
  function check() {
    if (Date.now() < nextDue) {return;}
    nextDue = Date.now() + AUTO_SAVE_INTERVAL_MS;
    run();
  }
  const timer = setInterval(check, AUTO_SAVE_INTERVAL_MS);
  return {
    check,
    stop: () => {
      clearInterval(timer);
    },
  };
}
