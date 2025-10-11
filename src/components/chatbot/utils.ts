export function getUserIdFromLocalStorage(): string | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        return user.id || user._id || null;
      } catch {
        return null;
      }
    }
  }
  return null;
}
