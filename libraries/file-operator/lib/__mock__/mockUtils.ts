import { LineSeparatorType } from "../utils";
import { Buffer } from "buffer";

export function generateStringBytes(
  length = 1024,
  ls: LineSeparatorType = LineSeparatorType.LF
): {
  bytes: Uint8Array;
  indexes: Array<number>;
  texts: Array<string>;
} {
  const charArr: Array<number> = [];
  const lsArr: Array<number> = [];
  const texts: Array<string> = [];

  for (let i = 0; i < length; i++) {
    charArr.push(i === length - 1 ? ls : i % 128);
    if (charArr[i] === ls) {
      lsArr.push(i);
      texts.push(
        String.fromCharCode(
          ...charArr.slice(
            lsArr.length > 1 ? lsArr[lsArr.length - 2] + 1 : 0,
            lsArr[lsArr.length - 1] + 1
          )
        )
      );
    }
  }

  if (charArr[charArr.length - 1] !== ls) {
    charArr.push(ls);
    lsArr.push(charArr.length - 1);
    texts.push(
      String.fromCharCode(...charArr.slice(lsArr[lsArr.length - 1] + 1))
    );
  }

  return {
    bytes: Buffer.from(charArr),
    indexes: lsArr,
    texts,
  };
}

export function generateRandomStringBytes(
  length = 1024,
  ls: LineSeparatorType = LineSeparatorType.LF
): {
  bytes: Uint8Array;
  indexes: Array<number>;
  texts: Array<string>;
} {
  const charArr: Array<number> = [];
  const lsArr: Array<number> = [];
  const texts: Array<string> = [];

  for (let i = 0; i < length; i++) {
    const char =
      i === length - 1
        ? ls
        : Number.parseInt((Math.random() * 128).toString(10) + 1);

    charArr.push(char);
    if (char === ls) {
      lsArr.push(i);
      texts.push(
        String.fromCharCode(
          ...charArr.slice(
            lsArr.length > 1 ? lsArr[lsArr.length - 2] + 1 : 0,
            lsArr[lsArr.length - 1] + 1
          )
        )
      );
    }
  }

  return {
    bytes: Buffer.from(charArr),
    indexes: lsArr,
    texts,
  };
}
