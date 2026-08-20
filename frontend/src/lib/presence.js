const timeFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    hour: "numeric",
    minute: "2-digit",
  }
);

const dateFormatter = new Intl.DateTimeFormat(
  "en-US",
  {
    month: "short",
    day: "numeric",
    year: "numeric",
  }
);

const getCalendarDayValue = (date) =>
  Date.UTC(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

export function formatChatDate(dateValue) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();

  const differenceInDays =
    (getCalendarDayValue(now) -
      getCalendarDayValue(date)) /
    86_400_000;

  if (differenceInDays === 0) {
    return "Today";
  }

  if (differenceInDays === 1) {
    return "Yesterday";
  }

  return dateFormatter.format(date);
}

export function formatLastActive(
  dateValue,
  nowValue = new Date()
) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);
  const now = new Date(nowValue);

  if (
    Number.isNaN(date.getTime()) ||
    Number.isNaN(now.getTime())
  ) {
    return "";
  }

  const elapsedMilliseconds =
    Math.max(0, now.getTime() - date.getTime());

  const elapsedMinutes = Math.floor(
    elapsedMilliseconds / 60_000
  );

  const elapsedHours = Math.floor(
    elapsedMilliseconds / 3_600_000
  );

  const differenceInDays =
    (getCalendarDayValue(now) -
      getCalendarDayValue(date)) /
    86_400_000;

  if (differenceInDays === 0) {
    if (elapsedMinutes < 1) {
      return "Last active just now";
    }

    if (elapsedMinutes < 60) {
      return `Last active ${elapsedMinutes} ${
        elapsedMinutes === 1
          ? "minute"
          : "minutes"
      } ago`;
    }

    if (elapsedHours < 24) {
      return `Last active ${elapsedHours} ${
        elapsedHours === 1
          ? "hour"
          : "hours"
      } ago`;
    }
  }

  if (differenceInDays === 1) {
    return `Last active yesterday at ${timeFormatter.format(
      date
    )}`;
  }

  return `Last active ${dateFormatter.format(
    date
  )} at ${timeFormatter.format(date)}`;
}

export function formatUserPresence(user) {
  if (user?.online) {
    return "Active now";
  }

  const lastActive =
    user?.last_active ||
    user?.lastActive;

  if (!lastActive) {
    return "";
  }

  return formatLastActive(lastActive);
}

export function isUserOnline(user) {
  return Boolean(user?.online);
}