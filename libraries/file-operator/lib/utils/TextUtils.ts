/**
 * find from index {@link from} first line separator index in given {@link bytes}. otherwise return `-1`.
 * @param bytes
 * @param from specify start index in {@link bytes}. when {@link form} less then 0, search will reverse(from tail to head).
 * @param lp
 */
export function utf8FindLineSeparatorIndex(
  bytes: Uint8Array,
  from = 0,
  lp?: LineSeparatorType
): number {
  const len = bytes.byteLength,
    step = from >= 0 ? 1 : -1,
    start = (from + len) % len,
    end = from >= 0 ? len : -1;
  let _lp: Uint8Array | undefined,
    i = start;

  if (lp) {
    _lp = __convertLineSeparatorTypeToUint8Array(lp);

    if (_lp.length === 1) {
      const _lpCode = _lp[0];
      for (; i !== end; i += step) {
        if (_lpCode === bytes[i]) return i;
      }
    } else if (_lp.length === 2) {
      const _lpCode1 = _lp[0],
        _lpCode2 = _lp[1];
      for (; i !== end; i += step) {
        if (_lpCode1 === bytes[i] && _lpCode2 === bytes[i + 1]) return i + 1;
      }
    } else {
      throw new Error(`unknown line separator(${_lp})`);
    }
  } else {
    for (; i !== end; i += step) {
      const code = bytes[i];

      if (code === 0x0d) {
        if (bytes[i + 1] === 0x0a) return i + 1;
        else return i;
      } else if (code === 0x0a) return i;
    }
  }

  return -1;
}

/**
 * @param buffer
 * @param from
 */
export function utf8FindLastLineSeparatorIndex(
  buffer: Uint8Array,
  from = 1
): number {
  return utf8FindLineSeparatorIndex(buffer, -from);
}

/**
 * todo
 * @param bytes
 * @param from
 * @param length
 * @param result
 * @param lpType
 */
export function utf8FindLineSeparatorIndexGlobal(
  bytes: Uint8Array,
  from = 0,
  length: number = bytes.byteLength,
  result: Array<number> = [],
  lpType?: LineSeparatorType
): Array<number> {
  const end = Math.min(from + length, bytes.byteLength);
  let code: number,
    i = from;

  lpType = lpType || __getLineSeparatorType();
  i++;

  if (!lpType) return [];

  const _lp = __convertLineSeparatorTypeToUint8Array(lpType);

  if (!_lp) return result;

  if (_lp.length === 1) {
    const _lpCode = _lp[0];
    for (; i < end; i++) {
      if (_lpCode === bytes[i]) result.push(i);
    }
  } else if (_lp.length === 2) {
    const _lpCode1 = _lp[0],
      _lpCode2 = _lp[1];
    for (; i < end; i++) {
      if (_lpCode1 === bytes[i] && _lpCode2 === bytes[i + 1]) result.push(++i);
    }
  } else {
    throw new Error(`unknown line separator(${_lp})`);
  }

  return result;

  /**
   * 判断分隔符类型
   */
  function __getLineSeparatorType(): LineSeparatorType | undefined {
    for (; i < end; i++) {
      code = bytes[i];

      if (code === 0x0d) {
        if (bytes[i + 1] === 0x0a) {
          result.push(++i);
          return LineSeparatorType.CRLF;
        } else {
          result.push(i);
          return LineSeparatorType.CR;
        }
      } else if (code === 0x0a) {
        result.push(i);
        return LineSeparatorType.LF;
      }
    }
  }
}

/**
 * find number of line separator in {@link bytes}
 * @param bytes
 * @param from
 * @param length
 * @param lpType
 */
export function utf8FindLineSeparatorIndexGlobalNumber(
  bytes: Uint8Array,
  from = 0,
  length: number = bytes.byteLength,
  lpType?: LineSeparatorType
): number {
  const end = Math.min(from + length, bytes.byteLength);
  let code: number;
  let i = from;
  let result = 0;

  lpType = lpType || __getLineSeparatorType();
  i++;

  if (!lpType) return -1;

  const _lp = __convertLineSeparatorTypeToUint8Array(lpType);

  if (!_lp) return -1;

  if (_lp.length === 1) {
    const _lpCode = _lp[0];
    for (; i < end; i++) {
      if (_lpCode === bytes[i]) result++;
    }
  } else if (_lp.length === 2) {
    const _lpCode1 = _lp[0],
      _lpCode2 = _lp[1];
    for (; i < end; i++) {
      if (_lpCode1 === bytes[i] && _lpCode2 === bytes[i + 1]) result++;
    }
  } else {
    throw new Error(`unknown line separator(${_lp})`);
  }

  return result;

  /**
   * 判断分隔符类型
   */
  function __getLineSeparatorType(): LineSeparatorType | undefined {
    for (; i < end; i++) {
      code = bytes[i];

      if (code === 0x0d) {
        if (bytes[i + 1] === 0x0a) {
          result++;
          return LineSeparatorType.CRLF;
        } else {
          result++;
          return LineSeparatorType.CR;
        }
      } else if (code === 0x0a) {
        result++;
        return LineSeparatorType.LF;
      }
    }
  }
}

/**
 * line separator in different Operating System
 *
 * @see https://en.wikipedia.org/wiki/Newline
 */
export enum LineSeparatorType {
  LF = 0x0a,
  CR = 0x0d,
  CRLF = 0x0d0a,
}

function __convertLineSeparatorTypeToUint8Array(
  type: LineSeparatorType
): Uint8Array {
  switch (type) {
    case LineSeparatorType.LF:
      return new Uint8Array([0x0a]);
      break;
    case LineSeparatorType.CR:
      return new Uint8Array([0x0d]);
      break;
    case LineSeparatorType.CRLF:
      return new Uint8Array([0x0d, 0x0a]);
      break;
    default:
      throw new Error(`unknown line separator(${type})`);
  }
}
