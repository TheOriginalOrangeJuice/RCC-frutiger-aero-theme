// Only allowlisted library classes reach the template; labels stay escaped text.
const groups = [
  ["globe", ["web", "web exploitation", "web security", "web hacking"]],
  ["key", ["crypto", "cryptography", "cryptanalysis"]],
  ["magnifying-glass", ["forensics", "forensic", "digital forensics", "dfir"]],
  ["gears", ["rev", "re", "reverse", "reversing", "reverse engineering"]],
  [
    "microchip",
    [
      "pwn",
      "pwnable",
      "binary",
      "binary exploitation",
      "exploitation",
      "pwn binary exploitation",
    ],
  ],
  ["binoculars", ["osint", "open source intelligence"]],
  ["network-wired", ["network", "networks", "networking", "network security"]],
  ["image", ["stego", "steg", "steganography"]],
  ["code", ["programming", "coding", "code", "scripting", "algorithms"]],
  ["location-dot", ["geo", "geography", "geolocation", "geography geo"]],
  [
    "seedling",
    [
      "welcome",
      "beginner",
      "beginners",
      "intro",
      "introductory",
      "getting started",
      "sanity",
      "sanity check",
      "welcome beginner",
    ],
  ],
  ["puzzle-piece", ["misc", "miscellaneous"]],
];

const normalize = name =>
  String(name ?? "")
    .trim()
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ");
const icons = new Map(
  groups.flatMap(([icon, aliases]) => aliases.map(alias => [alias, `fas fa-${icon}`])),
);

export function getCategoryIcon(category) {
  return icons.get(normalize(category)) || "fas fa-folder";
}
