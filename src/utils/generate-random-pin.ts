/**
 * Generates a random numeric pin of a specified length.
 * This is useful for things like a "forgot password" reset pin.
 *
 * @param length - The desired length of the random pin.
 * @returns A string containing the random numeric pin.
 */
export const generateRandomPin = (length: number): string => {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return pin;
};
