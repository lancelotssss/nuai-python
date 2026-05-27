function getAccount() {
  try {
    return JSON.parse(localStorage.getItem("nuai_account") || "null") || {};
  } catch {
    return {};
  }
}

export function useAuth() {
  const account = getAccount();
  return {
    user: {
      uid: account.id || account.email || "local-officer",
      email: account.email || "",
      displayName: account.name || account.email || "Alumni Affairs Officer",
      photoURL: account.photoURL || account.photoUrl || "",
    },
    role: account.role || "alumni-officer",
    account,
  };
}
