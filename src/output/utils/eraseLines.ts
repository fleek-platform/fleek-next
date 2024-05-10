import ansiEscapes from 'ansi-escapes';

export const eraseLines = (numberOfLines: number) => {
  return ansiEscapes.eraseLines(numberOfLines);
};
