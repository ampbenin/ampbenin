import { useState } from "react";
import { apiFetch } from "@/services/gestionamp/api";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-3">Vérifiez votre boîte mail</h2>
        <p className="text-sm text-gray-600 mb-5">
          Si un compte existe avec cet email, un lien de réinitialisation vient de vous être envoyé
          (valable 1 heure).
        </p>
        <a href="/admin/login" className="text-violet-700 hover:underline text-sm font-medium">
          ← Retour à la connexion
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-2">Mot de passe oublié</h2>
      <p className="text-sm text-gray-500 mb-5">
        Indiquez votre email professionnel, nous vous enverrons un lien pour choisir un nouveau mot
        de passe.
      </p>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>
      )}

      <input
        type="email"
        placeholder="Email professionnel"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="w-full border border-gray-300 rounded-xl px-4 py-3 mb-5 outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-violet-700 hover:bg-violet-800 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
      >
        {loading ? "Envoi..." : "Envoyer le lien de réinitialisation"}
      </button>

      <p className="mt-4 text-center text-sm">
        <a href="/admin/login" className="text-violet-700 hover:underline">
          ← Retour à la connexion
        </a>
      </p>
    </form>
  );
}
