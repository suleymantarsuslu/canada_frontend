import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { jwtDecode } from 'jwt-decode';
import Navbar from './components/Navbar';
import Home from './components/Home';
import CheckIn from './components/CheckIn';
import ParticipantList from './components/ParticipantList';
import Users from './components/Users';
import EventSettings from './components/EventSettings';
import ManualCheckIn from './components/ManualCheckIn';
import Invitation from './components/Invitation';
import AdminSettings from './components/AdminSettings';
import Confirmation from './components/Confirmation';
import GuestRsvp from './components/GuestRsvp';
import NotFound from './components/NotFound';

const App = () => {
  const { t, i18n } = useTranslation();
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roles, setRoles] = useState([]);
  const isAlertShown = React.useRef(false);
  const navigate = useNavigate();
  const location = useLocation();
  const API_URL = 'https://api.canada-ankara.com';

  const showAlertOnce = (message) => {
    if (!isAlertShown.current) {
      isAlertShown.current = true;
      alert(message);
      setTimeout(() => {
        isAlertShown.current = false;
      }, 2000);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (username === 'admin') {
      showAlertOnce(`${t('error')}: ${t('invalid_credentials')}`);
      return;
    }
    try {
      setToken(null);
      setRoles([]);
      localStorage.removeItem('token');
      isAlertShown.current = false;
      const response = await axios.post(`${API_URL}/api/admin/login`, {
        username,
        password,
      }, {
        validateStatus: (status) => status < 500 // 401 hatalarını yakalamak için
      });
      if (response.status === 200) {
        setToken(response.data.token);
        setRoles(response.data.roles || []);
        localStorage.setItem('token', response.data.token);
        navigate('/checkin');
      } else if (response.status === 401) {
        showAlertOnce(`${t('error')}: ${t('invalid_credentials')}`);
      } else {
        showAlertOnce(`${t('error')}: ${t(response.data?.messageKey) || 'Giriş başarısız'}`);
      }
    } catch (error) {
      showAlertOnce(`${t('error')}: ${t('invalid_credentials')}`);
    }
  };

  const handleLanguageChange = (e) => {
    i18n.changeLanguage(e.target.value);
  };

  const handleTimerEnd = () => {
    setToken(null);
    setRoles([]);
    localStorage.removeItem('token');
    showAlertOnce(t('session_expired'));
    navigate('/login', { replace: true });
  };

  axios.interceptors.response.use(
    response => response,
    error => {
      // Sadece token yenileme veya diğer API isteklerinde 401 alındığında handleTimerEnd çağır
      if (error.response && error.response.status === 401 && error.config.url !== `${API_URL}/api/admin/login`) {
        handleTimerEnd();
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }
  );

  const refreshToken = async () => {
    try {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        const decoded = jwtDecode(storedToken);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeLeft = decoded.exp - currentTime;
        if (timeLeft < 300) {
          const response = await axios.post(`${API_URL}/api/admin/refresh`, {}, {
            headers: { Authorization: `Bearer ${storedToken}` }
          });
          setToken(response.data.token);
          setRoles(response.data.roles || []);
          localStorage.setItem('token', response.data.token);
        }
      }
    } catch (error) {
      console.error('Token yenileme hatası:', error);
      handleTimerEnd();
    }
  };

  useEffect(() => {
    const initializeToken = () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const decoded = jwtDecode(storedToken);
          const currentTime = Math.floor(Date.now() / 1000);
          if (decoded.exp > currentTime) {
            setToken(storedToken);
            setRoles(decoded.roles || []);
          } else {
            localStorage.removeItem('token');
            setToken(null);
            setRoles([]);
            navigate('/login', { replace: true });
          }
        } catch (error) {
          console.error('Token çözümleme hatası:', error);
          localStorage.removeItem('token');
          setToken(null);
          setRoles([]);
          navigate('/login', { replace: true });
        }
      }
    };

    initializeToken();

    const interval = setInterval(() => {
      refreshToken();
    }, 60000);
    return () => clearInterval(interval);
  }, [navigate]);

  const hasAccess = (requiredRoles) => {
    return roles.some((role) => requiredRoles.includes(role));
  };

  const isPublicRoute = (path) => {
    return (
      path.startsWith('/invitation') ||
      path === '/confirmation' ||
      path.startsWith('/rsvp') ||
      path === '/'
    );
  };

  // Hatalı rotalar için yönlendirme kontrolü
  useEffect(() => {
    if (!isPublicRoute(location.pathname) && location.pathname !== '/login' && location.pathname !== '/not-found') {
      // Tanımlı rotalar dışında bir rotaya gidiliyorsa /not-found'a yönlendir
      const validRoutes = [
        '/',
        '/login',
        '/checkin',
        '/manual-checkin',
        '/participants',
        '/users',
        '/settings',
        '/admin-settings',
        '/confirmation',
      ];
      const isValidRoute = validRoutes.includes(location.pathname) || 
                          location.pathname.startsWith('/invitation') || 
                          location.pathname.startsWith('/rsvp');
      if (!isValidRoute) {
        navigate('/not-found', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  if (!token && !isPublicRoute(location.pathname) && location.pathname !== '/login' && location.pathname !== '/not-found') {
    return (
      <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#000000' }}>
        <div className="card" style={{ width: '24rem' }}>
          <div className="card-body">
            <h2 className="login-title">{t('title_main')}</h2>
            <h3 className="login-subtitle">{t('title_sub')}</h3>
            <div className="language-select-container">
              <select
                className="language-select"
                value={i18n.language}
                onChange={handleLanguageChange}
              >
                <option value="tr">Türkçe</option>
                <option value="en">English</option>
                <option value="fr">Français</option>
              </select>
            </div>
            <h4 className="card-title text-center">{t('login')}</h4>
            <form onSubmit={handleLogin}>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder={t('username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="form-control"
                />
              </div>
              <div className="mb-3">
                <input
                  type="password"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-control"
                />
              </div>
              <button type="submit" className="btn btn-canada w-100">
                {t('login')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!(location.pathname.startsWith('/rsvp') || location.pathname === '/not-found') && (
        <Navbar
          token={token}
          setToken={setToken}
          onTimerEnd={handleTimerEnd}
          handleLanguageChange={handleLanguageChange}
          currentLanguage={i18n.language}
        />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={
          <div className="min-vh-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: '#000000' }}>
            <div className="card">
              <div className="card-body">
                <h2 className="login-title">{t('title_main')}</h2>
                <h3 className="login-subtitle">{t('title_sub')}</h3>
                <div className="language-select-container">
                  <select
                    className="language-select"
                    value={i18n.language}
                    onChange={handleLanguageChange}
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
                <h4 className="card-title text-center">{t('login')}</h4>
                <form onSubmit={handleLogin}>
                  <div className="mb-3">
                    <input
                      type="text"
                      placeholder={t('username')}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <div className="mb-3">
                    <input
                      type="password"
                      placeholder={t('password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="form-control"
                    />
                  </div>
                  <button type="submit" className="btn btn-canada w-100">
                    {t('login')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        } />
        <Route
          path="/checkin"
          element={
            hasAccess(['Admin', 'Editor', 'CheckInEditor']) ? (
              <CheckIn />
            ) : (
              <div className="text-center mt-5">{t('unauthorized')}</div>
            )
          }
        />
        <Route
          path="/manual-checkin"
          element={
            hasAccess(['Admin', 'Editor', 'CheckInEditor']) ? (
              <ManualCheckIn />
            ) : (
              <div className="text-center mt-5">{t('unauthorized')}</div>
            )
          }
        />
        <Route
          path="/participants"
          element={
            hasAccess(['Admin', 'Editor', 'ParticipantEditor']) ? (
              <ParticipantList />
            ) : (
              <div className="text-center mt-5">{t('unauthorized')}</div>
            )
          }
        />
        <Route
          path="/users"
          element={
            hasAccess(['Admin', 'UserEditor']) ? (
              <Users />
            ) : (
              <div className="text-center mt-5">{t('unauthorized')}</div>
            )
          }
        />
        <Route
          path="/settings"
          element={
            hasAccess(['Admin', 'Editor', 'GuestEditor']) ? (
              <EventSettings />
            ) : (
              <div className="text-center mt-5">{t('unauthorized')}</div>
            )
          }
        />
        <Route
          path="/admin-settings"
          element={
            hasAccess(['Admin']) ? (
              <AdminSettings />
            ) : (
              <div className="text-center mt-5">{t('unauthorized')}</div>
            )
          }
        />
        <Route path="/invitation/:qrId" element={<Invitation />} />
        <Route path="/rsvp/:qrId" element={<GuestRsvp />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/not-found" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;