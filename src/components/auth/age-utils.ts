const ensureValidNumber = (value: string, label: string) => {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new RangeError(`${label} must be a valid number`);
  }

  const parsed = parseInt(trimmed, 10);
  if (Number.isNaN(parsed)) {
    throw new RangeError(`${label} must be a valid number`);
  }

  return parsed;
};

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month, 0).getDate();
};

export const calculateAge = (day: string, month: string, year: string): number => {
  const numericYear = ensureValidNumber(year, "Year");
  const numericMonth = ensureValidNumber(month, "Month");
  const numericDay = ensureValidNumber(day, "Day");

  if (numericMonth < 1 || numericMonth > 12) {
    throw new RangeError("Month must be between 1 and 12");
  }

  const maxDay = getDaysInMonth(numericYear, numericMonth);
  if (numericDay < 1 || numericDay > maxDay) {
    throw new RangeError(`Day must be between 1 and ${maxDay} for the selected month`);
  }

  const birthDate = new Date(numericYear, numericMonth - 1, numericDay);

  // Ensure JS date didn't roll over (e.g., Feb 30)
  if (
    birthDate.getFullYear() !== numericYear ||
    birthDate.getMonth() !== numericMonth - 1 ||
    birthDate.getDate() !== numericDay
  ) {
    throw new RangeError("Invalid date provided");
  }

  const today = new Date();
  if (birthDate.getTime() > today.getTime()) {
    throw new RangeError("Birth date cannot be in the future");
  }

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};
