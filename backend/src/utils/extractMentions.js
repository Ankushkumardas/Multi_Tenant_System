export const extractMentions = (content) => {
  const regex = /@(\w+)/g;
  const matches = [...content.matchAll(regex)];
  return matches.map((m) => m[1]);
};
