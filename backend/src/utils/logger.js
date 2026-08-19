const write = (method, message, error) => {
  if (error) {
    console[method](message, error);
    return;
  }

  console[method](message);
};

export const logger = Object.freeze({
  info(message) {
    write("log", message);
  },
  warn(message, error) {
    write("warn", message, error);
  },
  error(message, error) {
    write("error", message, error);
  },
});
