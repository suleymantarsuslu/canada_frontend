import React from 'react';
import { useTranslation } from 'react-i18next';
import logo from '../assets/logo.jpg'; // Logo dosyasını içe aktar

const Home = () => {
  const { t } = useTranslation();

  return (
    <div className="container-custom mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-body text-center">
              {/* Başlık */}
              <h1
                className="card-title home-title"
                style={{
                  fontSize: '3.5rem',
                  fontWeight: 'bold',
                  color: '#dc3545', // Kanada kırmızısı
                  marginTop: '1rem',
                  fontFamily: "'Roboto', sans-serif",
                  textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
                }}
              >
                Canada Event Management System
              </h1>

              {/* Bilgi Metni */}
              <p
                className="home-description"
                style={{
                  fontSize: '1.2rem',
                  color: '#ffffff', // Beyaz renk (orijinalde #white yazılmış, düzelttim)
                  margin: '2rem 0',
                  lineHeight: '1.6',
                }}
              >
                {t('homeDescription')}
              </p>

              {/* Logo */}
              <img
                src={logo}
                alt="Canada Event Management Logo"
                style={{
                  maxWidth: '420px', // Logoyu çok az büyüttük (400px -> 420px)
                  width: '100%',
                  marginBottom: '2rem',
                  borderRadius: '10px',
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Responsive stiller */}
      <style>
        {`
          @media (max-width: 991.98px) {
            .home-title {
              font-size: 2.5rem !important; /* Başlık yazı boyutu küçültüldü */
            }
            .home-description {
              font-size: 1rem !important; /* Bilgi metni yazı boyutu küçültüldü */
            }
          }
        `}
      </style>
    </div>
  );
};

export default Home;