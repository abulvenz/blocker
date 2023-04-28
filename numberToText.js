const { round, trunc } = Math;

const use = (v, fn) => fn(v);

const numberToText_DE_rec = (number) => {
  const single = {
    0: "null",
    1: "ein",
    2: "zwei",
    3: "drei",
    4: "vier",
    5: "fünf",
    6: "sechs",
    7: "sieben",
    8: "acht",
    9: "neun",
    10: "zehn",
    11: "elf",
    12: "zwölf",
    13: "dreizehn",
    14: "vierzehn",
    15: "fünfzehn",
    16: "sechzehn",
    17: "siebzehn",
    18: "achtzehn",
    19: "neunzehn",
  };
  const tens = {
    20: "zwanzig",
    30: "dreißig",
    40: "vierzig",
    50: "fünfzig",
    60: "sechzig",
    70: "siebzig",
    80: "achtzig",
    90: "neunzig",
  };
  return number < 20
    ? single[number]
    : number < 100
    ? (number - trunc(number / 10) * 10 > 0
        ? numberToText_DE_rec(number - trunc(number / 10) * 10) + "und"
        : "") + tens[trunc(number / 10) * 10]
    : number < 1000
    ? single[trunc(number / 100)] +
      "hundert" +
      numberToText_DE_rec(number - trunc(number / 100) * 100)
    : number < 1000000
    ? numberToText_DE_rec(trunc(number / 1000)) +
      "tausend" +
      numberToText_DE_rec(number - trunc(number / 1000) * 1000)
    : number < 1000000000
    ? numberToText_DE_rec(trunc(number / 1000000)) +
      "millionen" +
      numberToText_DE_rec(number - trunc(number / 1000000) * 1000000)
    : number < 1000000000000
    ? numberToText_DE_rec(trunc(number / 1000000000)) +
      "milliarden" +
      numberToText_DE_rec(number - trunc(number / 1000000000) * 1000000000)
    : number < 1000000000000000
    ? numberToText_DE_rec(trunc(number / 1000000000000)) +
      "billionen" +
      numberToText_DE_rec(number - trunc(number / 1000000000) * 1000000000)
    : "no";
};

const numberToText_EN = (number) => {
  const single = {
    0: "zero",
    1: "one",
    2: "two",
    3: "three",
    4: "four",
    5: "five",
    6: "six",
    7: "seven",
    8: "eight",
    9: "nine",
    10: "ten",
    11: "eleven",
    12: "twelf",
    13: "thirteen",
    14: "fourteen",
    15: "fifteen",
    16: "sixteen",
    17: "seventeen",
    18: "eighteen",
    19: "nineteen",
  };
  const tens = {
    20: "twenty",
    30: "thirty",
    40: "fourty",
    50: "fifty",
    60: "sixty",
    70: "seventy",
    80: "eighty",
    90: "ninety",
  };
  return number < 20
    ? single[number]
    : number < 100
    ? tens[trunc(number / 10) * 10] +
      (number - trunc(number / 10) * 10 > 0
        ? " " + numberToText_EN(number - trunc(number / 10) * 10)
        : "")
    : number < 1000
    ? single[trunc(number / 100)] +
      " hundred " +
      numberToText_EN(number - trunc(number / 100) * 100)
    : number < 1000000
    ? numberToText_EN(trunc(number / 1000)) +
      " thousand " +
      numberToText_EN(number - trunc(number / 1000) * 1000)
    : number < 1000000000
    ? numberToText_EN(trunc(number / 1000000)) +
      " million " +
      numberToText_EN(number - trunc(number / 1000000) * 1000000)
    : number < 1000000000000
    ? numberToText_EN(trunc(number / 1000000000)) +
      " billion " +
      numberToText_EN(number - trunc(number / 1000000000) * 1000000000)
    : "no";
};

const numberToText_DE = (number) =>
  use(numberToText_DE_rec(number), (n) => (n.endsWith("ein") ? n + "s" : n));

const numberToText = (number, language) =>
  console.log(number, language) || language === "en"
    ? numberToText_EN(number)
    : language === "de"
    ? numberToText_DE(number)
    : null;

export default {
  numberToText,
};
