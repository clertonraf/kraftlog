// Web-specific database implementation that doesn't use SQLite
export const initDatabase = async () => {
  console.log('SQLite is not available on web platform - using API only mode');
  return null;
};

export const getDatabase = async () => {
  return null;
};

export const closeDatabase = async () => {
  // No-op on web
};
