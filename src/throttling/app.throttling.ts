export const ThrottlingLevels = {
  SHORT: { name: 'short', ttl: 1000, limit: 3 },
  MEDIUM: { name: 'medium', ttl: 10_000, limit: 20 },
  LONG: { name: 'long', ttl: 60_000, limit: 100 },
};
