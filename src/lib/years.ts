/** Whole years that have passed since `start` (YYYY-MM-DD), counting from the anniversary month. */
export const yearsSince = (start: string, now = new Date()) => {
  const [year, month = 1, day = 1] = start.split('-').map(Number);
  let years = now.getFullYear() - year;
  if (now.getMonth() + 1 < month || (now.getMonth() + 1 === month && now.getDate() < day)) years -= 1;
  return Math.max(0, years);
};
