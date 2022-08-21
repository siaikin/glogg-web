import {
  utf8FindLineSeparatorIndex,
  utf8FindLastLineSeparatorIndex,
  utf8FindLineSeparatorIndexGlobal,
} from "../../../lib/utils";

describe("[utf8FindLineSeparatorIndex] test cases", () => {
  const LFSting = "hello, world\n",
    CRString = "\rhello, world\r",
    CRLFString = "\r\nhello, world\r\nthis is next separator\r\n",
    noLineSeparatorString = "hello, world.this is next separator.";
  /**
   * 从字符串创建字节数组
   */
  const utf8bytesLF = Buffer.from(LFSting, "utf-8"),
    utf8bytesCR = Buffer.from(CRString, "utf-8"),
    utf8bytesCRLF = Buffer.from(CRLFString, "utf-8"),
    utf8bytesNoLineSeparator = Buffer.from(noLineSeparatorString, "utf-8");

  it("find first line separator", function () {
    expect(utf8FindLineSeparatorIndex(utf8bytesLF)).toBe(12);
    expect(utf8FindLineSeparatorIndex(utf8bytesCR)).toBe(0);
    expect(utf8FindLineSeparatorIndex(utf8bytesCRLF)).toBe(1);
    expect(utf8FindLineSeparatorIndex(utf8bytesNoLineSeparator)).toBe(-1);
  });

  it("find last line separator", function () {
    expect(utf8FindLastLineSeparatorIndex(utf8bytesLF)).toBe(12);
    expect(utf8FindLastLineSeparatorIndex(utf8bytesCR)).toBe(13);
    expect(utf8FindLastLineSeparatorIndex(utf8bytesCRLF)).toBe(39);
    expect(utf8FindLastLineSeparatorIndex(utf8bytesNoLineSeparator)).toBe(-1);
  });

  it("find all line separator", function () {
    const resultLF = [12],
      resultCR = [0, 13],
      resultCRLF = [1, 15, 39];

    utf8FindLineSeparatorIndexGlobal(utf8bytesLF).forEach((i, index) =>
      expect(i).toEqual(resultLF[index])
    );
    utf8FindLineSeparatorIndexGlobal(utf8bytesCR).forEach((i, index) =>
      expect(i).toEqual(resultCR[index])
    );
    utf8FindLineSeparatorIndexGlobal(utf8bytesCRLF).forEach((i, index) =>
      expect(i).toEqual(resultCRLF[index])
    );
  });
});
