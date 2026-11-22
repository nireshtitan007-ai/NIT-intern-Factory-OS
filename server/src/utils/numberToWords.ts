/**
 * Indian Currency Number-to-Words Converter
 * Converts numeric amounts (in paise or rupees) into words following the Indian numbering system
 * (Lakhs, Crores, Thousands, Hundreds).
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertThreeDigits(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ONES[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts integer paise or rupee amount into formal Indian Currency Words:
 * e.g. 787500 paise (or 7875 rupees) -> "Rupees Seven Thousand Eight Hundred Seventy-Five Only"
 */
export function numberToWordsINR(amountPaiseOrRupees: number, isPaise: boolean = true): string {
  const totalPaise = isPaise ? Math.round(amountPaiseOrRupees) : Math.round(amountPaiseOrRupees * 100);
  if (totalPaise === 0) return 'Rupees Zero Only';

  const rupees = Math.floor(Math.abs(totalPaise) / 100);
  const paise = Math.abs(totalPaise) % 100;

  let words = '';

  const crores = Math.floor(rupees / 10000000);
  let remainder = rupees % 10000000;

  const lakhs = Math.floor(remainder / 100000);
  remainder = remainder % 100000;

  const thousands = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  const hundredsAndBelow = remainder;

  if (crores > 0) {
    words += convertThreeDigits(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertThreeDigits(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertThreeDigits(thousands) + ' Thousand ';
  }
  if (hundredsAndBelow > 0) {
    words += convertThreeDigits(hundredsAndBelow) + ' ';
  }

  words = words.trim();
  let result = `Rupees ${words}`;

  if (paise > 0) {
    result += ` and ${convertThreeDigits(paise)} Paise`;
  }

  result += ' Only';
  return result;
}
