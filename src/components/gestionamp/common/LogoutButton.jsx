export default function LogoutButton() {
  const logout = () => {
    localStorage.removeItem("amp_token");
    window.location.href = "/gestionamp/login";
  };

  return (
    <button onClick={logout} style={{ float: "right" }}>
      Déconnexion
    </button>
  );
}
