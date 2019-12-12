import * as fetch from 'node-fetch';

const apiUrl = 'https://wordfinderapi.azurewebsites.net/api/wordfinder';

const print = (matrix: string[][]): void => {
  const stringBuffer: string[] = [];
  matrix.map((line) => {
    line.map((cell) => stringBuffer.push(cell));
    stringBuffer.push('\n');
  });
  console.log(stringBuffer.join(''));
};

const verifyWord = (word: string): Promise<string> => {
  return new Promise((resolve) => {
    fetch
      .default(apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ name: word })
      })
      .then((res) => {
        res.json().then((body) => {
          if (body.exists) {
            resolve(word);
          }
          resolve();
        });
      });
  });
};

const reverseWord = (word: string): string =>
  word
    .split('')
    .reverse()
    .join('');

const findWordsInArray = (letters: string[]): string[] => {
  const words: string[] = [];
  for (let start = 0; start < letters.length - 1; start++) {
    for (let end = start + 1; end < letters.length; end++) {
      const word = letters.slice(start, end + 1).join('');
      Array.prototype.push.apply(words, [word, reverseWord(word)]);
    }
  }
  return words;
};

const diagonals = (matrix: string[][]) => {
  const numberOfDiagonals = matrix.length + matrix[0].length - 1;
  const maxLengthDiagonal = Math.min(matrix.length, matrix[0].length);
  const transposed: string[][] = [];
  for (let diagonal = 1; diagonal < numberOfDiagonals - 1; diagonal++) {
    transposed.push([]);
    for (let i = 0; i < Math.min(numberOfDiagonals - diagonal, Math.min(diagonal + 1, maxLengthDiagonal)); i++) {
      const x = Math.max(0, diagonal - matrix.length + 1);
      transposed[diagonal - 1].push(matrix[x + i][diagonal - (x + i)]);
    }
  }
  return transposed;
};

const transpose = (matrix: string[][]): string[][] => matrix[0].map((_, i) => matrix.map((row) => row[i]));

const solve = async (): Promise<string[]> => {
  const wordMatrix: string[][] = await fetch.default(apiUrl).then((res) => res.json().then((body) => body.wordfinder));
  print(wordMatrix);

  const uniqueWords: Set<string> = new Set([
    ...wordMatrix.flatMap(findWordsInArray),
    ...transpose(wordMatrix).flatMap(findWordsInArray),
    ...diagonals(wordMatrix).flatMap(findWordsInArray),
    ...diagonals(wordMatrix.reverse()).flatMap(findWordsInArray)
  ]);

  return (await Promise.all([...Array.from(uniqueWords).map(verifyWord)])).filter(Boolean);
};

const startedAt = new Date().getTime();
solve().then((foundWords) =>
  console.log(
    `Found ${Object.keys(foundWords).length} words in ${((new Date().getTime() - startedAt) / 1000).toFixed(2)}s:\n${foundWords
      .sort((l, r) => l.length - r.length)
      .reverse()
      .map((word) => `${word}`)
      .join('\n')}`
  )
);
