import { BriefcaseBusiness, LockKeyhole, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const SESSION_KEY = "koersen_business_portal_auth";

export default function BusinessPortal({ rates, onOwnerUpdateRate }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [ownerName, setOwnerName] = useState("Cambio Owner");
  const [selectedId, setSelectedId] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [buy, setBuy] = useState("");
  const [sell, setSell] = useState("");
  const [status, setStatus] = useState("");

  const allowedUser = useMemo(() => import.meta.env.VITE_PORTAL_USER || "owner", []);
  const allowedPassword = useMemo(() => import.meta.env.VITE_PORTAL_PASS || "owner123", []);

  useEffect(() => {
    const hasSession = sessionStorage.getItem(SESSION_KEY) === "1";
    setIsAuthenticated(hasSession);
  }, []);

  useEffect(() => {
    const exists = rates.some((rate) => rate.id === selectedId);
    if ((!selectedId || !exists) && rates.length) {
      setSelectedId(rates[0].id);
    }
    if (!rates.length) {
      setSelectedId("");
    }
  }, [rates, selectedId]);

  const handleLogin = (event) => {
    event.preventDefault();
    if (loginName === allowedUser && loginPassword === allowedPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem(SESSION_KEY, "1");
      setLoginError("");
      setLoginPassword("");
      return;
    }
    setLoginError("Onjuiste login. Probeer opnieuw.");
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(SESSION_KEY);
    setLoginName("");
    setLoginPassword("");
    setStatus("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedId || !buy || !sell) {
      setStatus("Vul alle velden in.");
      return;
    }
    onOwnerUpdateRate({
      ownerName,
      cambioId: selectedId,
      currency,
      buy: Number(buy),
      sell: Number(sell),
    });
    setStatus("Portal update verzonden.");
    setBuy("");
    setSell("");
  };

  return (
    <section className="glass-panel rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness size={17} className="text-emeraldRate-500" />
          <h2 className="text-lg font-semibold">Cambio Owner Portal</h2>
        </div>
        {isAuthenticated && (
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200/20 bg-black/10 px-2 py-1 text-xs text-slate-100"
          >
            <LogOut size={12} />
            Logout
          </button>
        )}
      </div>

      {!isAuthenticated ? (
        <>
          <form onSubmit={handleLogin} className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                value={loginName}
                onChange={(event) => setLoginName(event.target.value)}
                placeholder="Gebruikersnaam"
                className="h-10 rounded-lg border border-slate-200/20 bg-black/10 px-3 text-sm text-slate-100 outline-none"
              />
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="Wachtwoord"
                className="h-10 rounded-lg border border-slate-200/20 bg-black/10 px-3 text-sm text-slate-100 outline-none"
              />
            </div>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emeraldRate-600 py-2 text-sm font-medium text-white"
            >
              <LockKeyhole size={14} />
              Login Cambio Owner Portal
            </button>
            {loginError && (
              <p className="rounded-lg border border-rose-500/40 bg-rose-500/15 px-3 py-2 text-xs text-rose-100">
                {loginError}
              </p>
            )}
          </form>
        </>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-200/90">
            Ingelogd als cambio owner. Hier kunnen cambio eigenaars eigen koersen publiceren.
          </p>
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              value={ownerName}
              onChange={(event) => setOwnerName(event.target.value)}
              placeholder="Owner naam"
              className="h-10 w-full rounded-lg border border-slate-200/20 bg-black/10 px-3 text-sm text-slate-100 outline-none"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value)}
                className="h-10 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-sm text-slate-100 outline-none"
              >
                {rates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.name}
                  </option>
                ))}
              </select>
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value)}
                className="h-10 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-sm text-slate-100 outline-none"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                placeholder="Buy"
                value={buy}
                onChange={(event) => setBuy(event.target.value)}
                className="h-10 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-sm text-slate-100 outline-none"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Sell"
                value={sell}
                onChange={(event) => setSell(event.target.value)}
                className="h-10 rounded-lg border border-slate-200/20 bg-black/10 px-2 text-sm text-slate-100 outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-emeraldRate-600 py-2 text-sm font-medium text-white"
            >
              Update via portal
            </button>
          </form>
          {status && <p className="mt-2 text-xs text-slate-300">{status}</p>}
        </>
      )}
    </section>
  );
}
