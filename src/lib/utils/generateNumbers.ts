
export function generateUniqueRandomNumbers(
  quantity: number,
  maxNumber: number,
  existingNumbers: Set<number>
): number[] {
  const numbers: number[] = [];
  
  while (numbers.length < quantity) {
    const randomNumber = Math.floor(Math.random() * maxNumber);
    if (!existingNumbers.has(randomNumber) && !numbers.includes(randomNumber)) {
      numbers.push(randomNumber);
    }
  }
  
  return numbers.sort((a, b) => a - b);
}
