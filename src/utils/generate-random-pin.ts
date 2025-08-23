/**
 * @description Generates a random numeric pin of a specified length.
 * @param length - The desired length of the random pin.
 * @returns A string containing the random numeric pin.
 */
export const generateRandomPin = (length: number): number => {
  let pin = "";
  for (let i = 0; i < length; i++) {
    pin += Math.floor(Math.random() * 10);
  }
  return +pin;
};
