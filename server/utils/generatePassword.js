// utils/passwordGenerator.js

/**
 * Generate a random password with specified complexity
 * @param {number} length - Length of the password (default: 10)
 * @returns {string} - Random password
 */
export const generatePassword = (length = 10) => {
  console.log("🔐 [DEBUG] ===== PASSWORD GENERATION DEBUG =====");
  console.log("🔐 [DEBUG] Generating password with length:", length);

  // Define character sets - using safer special characters
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  // Use only safe symbols that work well in emails and forms
  const symbols = "!@#$%^&*";

  // Combine all character sets
  const allChars = lowercase + uppercase + numbers + symbols;

  let password = "";

  // Ensure at least one character from each set
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));

  // Fill the rest of the password
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }

  // Shuffle the password
  password = password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");

  console.log("🔐 [DEBUG] Generated password:", password);
  console.log("🔐 [DEBUG] Password length:", password.length);
  console.log("🔐 [DEBUG] Contains lowercase:", /[a-z]/.test(password));
  console.log("🔐 [DEBUG] Contains uppercase:", /[A-Z]/.test(password));
  console.log("🔐 [DEBUG] Contains number:", /\d/.test(password));
  console.log("🔐 [DEBUG] Contains special char:", /[!@#$%^&*]/.test(password));
  console.log("🔐 [DEBUG] ===== END PASSWORD GENERATION DEBUG =====");

  return password;
};

/**
 * Generate a memorable password
 * @returns {string} - Memorable password
 */
export const generateMemorablePassword = () => {
  const adjectives = [
    "happy",
    "brave",
    "bright",
    "calm",
    "clever",
    "eager",
    "fair",
    "gentle",
    "kind",
    "lively",
    "merry",
    "nice",
    "proud",
    "quick",
    "smart",
  ];

  const nouns = [
    "apple",
    "bird",
    "book",
    "car",
    "cloud",
    "dog",
    "fish",
    "flower",
    "house",
    "moon",
    "river",
    "sky",
    "star",
    "tree",
    "water",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNumber = Math.floor(Math.random() * 1000);
  const randomSymbol = "!@#$%^&*".charAt(Math.floor(Math.random() * 8));

  return `${randomAdjective}${randomNoun}${randomNumber}${randomSymbol}`;
};
