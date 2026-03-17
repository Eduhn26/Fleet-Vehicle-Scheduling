import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/login.css';

// NOTE: Authentication page is now structured as a branded entry experience
// instead of a plain form card. This raises perceived product quality quickly.
const safeParseUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const extractErrorMessage = (err) => {
  const fromApi = err?.response?.data?.error?.message;
  if (fromApi) return String(fromApi);

  const generic = err?.message;
  if (generic) return String(generic);

  return 'Falha ao realizar login. Tente novamente.';
};

function getGreetingByTime() {
  const hour = new Date().getHours();

  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const greeting = useMemo(() => getGreetingByTime(), []);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);

      const user = safeParseUser();
      const role = String(user?.role || '').trim();

      if (role === 'admin') {
        navigate('/admin', { replace: true });
        return;
      }

      navigate('/user', { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-heroPanel">
          <div className="login-heroBadge">Fleet Manager</div>

          <h1 className="login-heroTitle">
            Gestão de frota com uma experiência mais clara, confiável e operacional.
          </h1>

          <p className="login-heroText">
            Centralize reservas, aprovações, devoluções e manutenção em um único
            fluxo com visão administrativa e jornada do usuário no mesmo sistema.
          </p>

          <div className="login-featureList">
            <div className="login-featureItem">
              <span className="login-featureIcon">•</span>
              <span>Reservas com disponibilidade orientada por calendário</span>
            </div>

            <div className="login-featureItem">
              <span className="login-featureIcon">•</span>
              <span>Fluxo administrativo com aprovação e confirmação de devolução</span>
            </div>

            <div className="login-featureItem">
              <span className="login-featureIcon">•</span>
              <span>Leitura rápida do estado operacional da frota</span>
            </div>
          </div>
        </section>

        <form className="login-card" onSubmit={onSubmit}>
          <header className="login-header">
            <div className="login-badge">FM</div>

            <div className="login-kicker">{greeting}</div>

            <h2 className="login-title">Entrar na plataforma</h2>

            <p className="login-subtitle">
              Use suas credenciais para acessar o workspace da frota.
            </p>
          </header>

          {error ? <div className="login-error">{error}</div> : null}

          <div className="login-field">
            <label className="login-label" htmlFor="email">
              Email corporativo
            </label>

            <input
              id="email"
              className="login-input"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              placeholder="seuemail@empresa.com"
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="login-field">
            <label className="login-label" htmlFor="password">
              Senha
            </label>

            <input
              id="password"
              className="login-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              disabled={isSubmitting}
            />
          </div>

          <button className="login-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Acessar plataforma'}
          </button>

          <p className="login-footer">
            Problemas para acessar? Fale com o administrador do sistema.
          </p>
        </form>
      </div>
    </div>
  );
}