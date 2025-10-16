import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import styles from './GuestRsvp.module.css';
import TicketHeader from '../assets/TicketHeader.png';
import CanadaFlag from '../assets/canada_flag.png';
import G7Image from '../assets/G7.avif';
import Ticket from './Ticket';

const Pumpkin = () => (
  <svg className={styles.halloweenElement} width="60" height="60" viewBox="0 0 100 100">
    <ellipse cx="50" cy="55" rx="35" ry="30" fill="#ff6b35" />
    <path d="M50 15 Q55 25 50 30" stroke="#2d5016" strokeWidth="3" fill="none" />
    <rect x="48" y="10" width="4" height="10" fill="#2d5016" rx="2" />
    <path d="M35 45 L40 50 L35 55 Z" fill="#1a1a1a" />
    <path d="M65 45 L60 50 L65 55 Z" fill="#1a1a1a" />
    <path d="M43 65 Q50 70 57 65" stroke="#1a1a1a" strokeWidth="2" fill="none" />
  </svg>
);

const Ghost = () => (
  <svg className={styles.halloweenElement} width="60" height="60" viewBox="0 0 100 100">
    <path d="M50 10 Q30 10 25 30 Q25 60 25 70 L30 75 L35 70 L40 75 L45 70 L50 75 L55 70 L60 75 L65 70 L70 75 L75 70 Q75 60 75 30 Q70 10 50 10 Z" fill="#f0f0f0" opacity="0.9" />
    <circle cx="40" cy="35" r="5" fill="#1a1a1a" />
    <circle cx="60" cy="35" r="5" fill="#1a1a1a" />
    <ellipse cx="50" cy="50" rx="8" ry="12" fill="#1a1a1a" />
  </svg>
);

const Bat = () => (
  <svg className={styles.halloweenElement} width="70" height="40" viewBox="0 0 140 80">
    <ellipse cx="70" cy="40" rx="10" ry="12" fill="#2d2d2d" />
    <path d="M60 40 Q50 25 35 20 Q25 18 20 25 Q18 35 25 40 Q35 45 50 38 Z" fill="#2d2d2d" />
    <path d="M80 40 Q90 25 105 20 Q115 18 120 25 Q122 35 115 40 Q105 45 90 38 Z" fill="#2d2d2d" />
    <circle cx="67" cy="38" r="2" fill="#ff0000" />
    <circle cx="73" cy="38" r="2" fill="#ff0000" />
  </svg>
);

const Spider = () => (
  <svg className={styles.halloweenElement} width="50" height="50" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="12" fill="#1a1a1a" />
    <circle cx="50" cy="35" r="8" fill="#1a1a1a" />
    <line x1="50" y1="50" x2="20" y2="30" stroke="#1a1a1a" strokeWidth="2" />
    <line x1="50" y1="50" x2="20" y2="50" stroke="#1a1a1a" strokeWidth="2" />
    <line x1="50" y1="50" x2="20" y2="70" stroke="#1a1a1a" strokeWidth="2" />
    <line x1="50" y1="50" x2="80" y2="30" stroke="#1a1a1a" strokeWidth="2" />
    <line x1="50" y1="50" x2="80" y2="50" stroke="#1a1a1a" strokeWidth="2" />
    <line x1="50" y1="50" x2="80" y2="70" stroke="#1a1a1a" strokeWidth="2" />
  </svg>
);

const Candy = () => (
  <svg className={styles.halloweenElement} width="50" height="50" viewBox="0 0 100 100">
    <rect x="30" y="40" width="40" height="20" fill="#ff1744" rx="3" />
    <rect x="30" y="40" width="8" height="20" fill="#ffeb3b" />
    <rect x="46" y="40" width="8" height="20" fill="#ffeb3b" />
    <rect x="62" y="40" width="8" height="20" fill="#ffeb3b" />
    <path d="M25 45 L30 40 L30 60 L25 55 Z" fill="#4caf50" />
    <path d="M75 45 L70 40 L70 60 L75 55 Z" fill="#4caf50" />
  </svg>
);

const CalendarIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="#ff6b35">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
  </svg>
);

const LocationIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="#ff6b35">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z" />
  </svg>
);

// Yardımcı fonksiyon: dizi elemanlarını 3'erli gruplara ayırır
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

const GuestRsvp = () => {
  const { t, i18n } = useTranslation();
  const { qrId } = useParams();
  const navigate = useNavigate();
  const [guest, setGuest] = useState(null);
  const [guests, setGuests] = useState([]);
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [showDeclineMessage, setShowDeclineMessage] = useState(false);
  const [guestData, setGuestData] = useState({ firstName: '', lastName: '', email: '' });
  const [maxGuests, setMaxGuests] = useState(0);

  const API_URL = 'https://backend.canada-ankara.com';

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    i18n.changeLanguage(selectedLanguage);
  };

  useEffect(() => {
    const checkRsvpStatus = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/public/rsvp-status`);
        console.log('RSVP durumu alındı:', response.data);
        setRsvpEnabled(response.data.rsvpEnabled);
      } catch (err) {
        const errorMessage =
          err.response?.data?.message ||
          t('rsvpStatusError') || 'RSVP durumu alınamadı, lütfen daha sonra tekrar deneyin.';
        setError(errorMessage);
        console.error('checkRsvpStatus hatası:', err.response?.data || err.message);
      }
    };

    const fetchGuest = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/public/guest/${qrId}`);
        console.log('Davetli bilgisi alındı:', response.data);
        setGuest(response.data);
        setMaxGuests(response.data.maxGuests || 0);
        if (response.data.guests && response.data.guests.length > 0) {
          setGuests(response.data.guests);
        }
        setLoading(false);
      } catch (err) {
        console.error('fetchGuest hatası:', err.response?.data || err.message);
        setLoading(false);
        navigate('/not-found');
      }
    };

    checkRsvpStatus();
    fetchGuest();
  }, [qrId, t, navigate]);

  useEffect(() => {
    if (guest && guest.willAttend && rsvpEnabled) {
      if (['EMPLOYEE', 'VIP'].includes(guest.guestType) && (!guest.guests || guest.guests.length < maxGuests)) {
        setShowGuestForm(true);
      } else {
        setShowGuestForm(false);
      }
    }
  }, [guest, rsvpEnabled, maxGuests]);

  const handleResponse = async (willAttend) => {
    console.log('handleResponse çağrıldı, willAttend:', willAttend);
    try {
      const response = await axios.post(
        `${API_URL}/api/public/rsvp/${qrId}`,
        { willAttend },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('RSVP yanıtı alındı:', response.data);
      setGuest({ ...guest, willAttend, responded: true });
      if (!willAttend) {
        setShowDeclineMessage(true);
        setShowGuestForm(false);
        setGuests([]);
      } else if (['EMPLOYEE', 'VIP'].includes(guest.guestType) && (!guest.guests || guest.guests.length < maxGuests)) {
        setShowGuestForm(true);
        setShowDeclineMessage(false);
      } else {
        setShowGuestForm(false);
        setShowDeclineMessage(false);
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || t('error') || 'Bir hata oluştu, lütfen tekrar deneyin.';
      setError(errorMessage);
      console.error('handleResponse hatası:', err.response?.data || err.message);
      alert(errorMessage);
    }
  };

  const handleGuestInputChange = (e) => {
    const { name, value } = e.target;
    setGuestData({ ...guestData, [name]: value });
  };

  const handleGuestSubmit = async (e) => {
    e.preventDefault();
    console.log('handleGuestSubmit çağrıldı, guestData:', guestData);
    try {
      const response = await axios.post(
        `${API_URL}/api/public/add-guest/${qrId}`,
        { ...guestData },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('Misafir ekleme yanıtı:', response.data);
      setGuest({ ...guest, guests: [...(guest.guests || []), response.data.guest] });
      setGuests([...guests, response.data.guest]);
      setGuestData({ firstName: '', lastName: '', email: '' });
      // Eğer maksimuma ulaşılmadıysa form tekrar görünsün
      if (guests.length + 1 < maxGuests) {
        setShowGuestForm(true);
      } else {
        setShowGuestForm(false);
      }
      setError('');
      navigate(`/rsvp/${qrId}`);
    } catch (err) {
      const errorMessage = err.response?.data?.messageKey
        ? t(err.response.data.messageKey) || err.response.data.message
        : t('retryOrContact') || 'Lütfen sayfayı yenileyip tekrar deneyiniz. Eğer hata devam ediyorsa canadaclub.ankara@international.gc.ca adresini kullanarak bizimle iletişime geçiniz.';
      setError(errorMessage);
      console.error('handleGuestSubmit hatası:', err.response?.data || err.message);
      alert(errorMessage);
    }
  };

  const handleContinueWithoutGuest = () => {
    console.log('handleContinueWithoutGuest çağrıldı');
    setShowGuestForm(false);
    navigate(`/rsvp/${qrId}`);
  };

  const waitForRender = () => {
    return new Promise((resolve) => {
      const checkRender = () => {
        const ticketElement = document.querySelector('#ticket-content');
        if (ticketElement && ticketElement.offsetHeight > 0) {
          resolve();
        } else {
          requestAnimationFrame(checkRender);
        }
      };
      requestAnimationFrame(checkRender);
    });
  };

  const generatePDF = async (guestData, qrId, isPlusOne = false) => {
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.top = '-9999px';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '595px';
      tempDiv.style.height = '842px';
      tempDiv.style.overflow = 'hidden';
      tempDiv.style.display = 'flex';
      tempDiv.style.flexDirection = 'column';
      tempDiv.style.justifyContent = 'center';
      tempDiv.style.alignItems = 'center';
      tempDiv.style.backgroundColor = '#ffffff';
      document.body.appendChild(tempDiv);

      const ticket = (
        <Ticket
          guest={guestData}
          qrId={qrId}
          isPlusOne={isPlusOne}
        />
      );

      const { createRoot } = await import('react-dom/client');
      const root = createRoot(tempDiv);
      root.render(ticket);

      await waitForRender();

      const ticketElement = tempDiv.querySelector('#ticket-content');
      if (!ticketElement) {
        throw new Error('Ticket content not found');
      }

      ticketElement.style.width = '595px';
      ticketElement.style.height = '842px';
      ticketElement.style.overflow = 'hidden';
      ticketElement.style.display = 'flex';
      ticketElement.style.flexDirection = 'column';
      ticketElement.style.justifyContent = 'center';
      ticketElement.style.alignItems = 'center';
      ticketElement.style.padding = '20px';
      ticketElement.style.boxSizing = 'border-box';

      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: 595,
        height: 842,
        windowWidth: 595,
        windowHeight: 842,
        scrollX: 0,
        scrollY: 0,
      });

      const imgData = canvas.toDataURL('image/png');

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      const xOffset = 0;
      const yOffset = (pageHeight - imgHeight) / 2;
      doc.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, null, 'FAST');

      doc.save(`${guestData.firstName}_${guestData.lastName}${isPlusOne ? '_PlusOne' : ''}_Ticket.pdf`);

      root.unmount();
      document.body.removeChild(tempDiv);
    } catch (err) {
      console.error('PDF oluşturma hatası:', err);
      alert(t('pdfError') || 'PDF oluşturulamadı, lütfen tekrar deneyin.');
    }
  };

  const handleDownloadOwnTicket = () => {
    generatePDF(guest, qrId);
  };

  const handleDownloadGuestTicket = (guestData) => {
    generatePDF(guestData, guestData.qrId, true);
  };

  // Misafir ekleme formunu açan fonksiyon
  const handleShowGuestForm = () => {
    setShowGuestForm(true);
  };



  if (loading) {
    return (
      <div className={styles.body}>
        <div className={styles.content}>{t('loading') || 'Loading'}</div>
        <img src={G7Image} alt="G7 Logo" className={styles.g7Image} />
      </div>
    );
  }

  if (error && !guest) {
    navigate('/not-found');
    return null;
  }

  if (!rsvpEnabled) {
    if (guest.willAttend) {
      return (
        <div className={styles.container}>
          <div
            className={styles.containerBackground}
            style={{ backgroundImage: `url(${CanadaFlag})` }}
          ></div>
          <div className={`${styles.halloweenFloat} ${styles.pumpkin1}`}><Pumpkin /></div>
          <div className={`${styles.halloweenFloat} ${styles.ghost1}`}><Ghost /></div>
          <div className={`${styles.halloweenFloat} ${styles.bat1}`}><Bat /></div>
          <div className={`${styles.halloweenFloat} ${styles.spider1}`}><Spider /></div>
          <div className={`${styles.halloweenFloat} ${styles.candy1}`}><Candy /></div>
          <div className={`${styles.halloweenFloat} ${styles.pumpkin2}`}><Pumpkin /></div>
          <div className={`${styles.halloweenFloat} ${styles.ghost2}`}><Ghost /></div>
          <div className={`${styles.halloweenFloat} ${styles.bat2}`}><Bat /></div>
          <div className={styles.content}>
            <h1 className={styles.h1}>{t('eventTitle')}</h1>
            <p className={`${styles.textXl} font-sans`}>
              {t('dear')} {guest.firstName} {guest.lastName}
            </p>
            <p className={`${styles.textXl} font-sans`}>
              {t('invitationLine')}
            </p>
            <p className={styles.textLg}>
              {t('foodAndBeverage')}
            </p>
            <p className={styles.textXl}>
              <CalendarIcon />
              {t('eventDate')}
            </p>
            <p className={styles.textLg}>
              {t('eventTime')}
            </p>
            <p className={styles.textLg}>
              <LocationIcon />
              {t('eventLocation')}
            </p>
            <p className={styles.textSm}>
              Aziziye, Cinnah Street no: 58, 06690 Çankaya/Ankara
            </p>
            <p className={styles.textLg}>
              {t('rsvpEmail') || 'RSVP'}: <a href="mailto:canadaclub.ankara@international.gc.ca" className={styles.textRed600}>canadaclub.ankara@international.gc.ca</a>
            </p>
            {error && <p className={styles.textRed500}>{error}</p>}
            <p className={styles.textLg}>
              {t('downloadTicketPrompt') || 'Aşağıdaki düğmeye tıklayıp biletinizi indirebilirsiniz.'}
            </p>
                      <div className={styles.buttonContainer}>
            <button className={styles.bgRed600} onClick={handleDownloadOwnTicket}>
              {t('downloadOwnTicket') || 'Biletimi İndir'}
            </button>
            {guests.length > 0 && chunkArray(guests, 3).map((group, groupIdx) => (
              <div key={groupIdx} style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: groupIdx > 0 ? '1rem' : 0 }}>
                {group.map((g, index) => (
                  <button key={g.qrId} className={styles.bgRed600} style={{ marginLeft: index > 0 ? '1.5rem' : 0 }} onClick={() => handleDownloadGuestTicket(g)}>
                    {t('downloadGuestTicket') || `Misafir ${groupIdx * 3 + index + 1} Biletini İndir`}
                  </button>
                ))}
              </div>
            ))}
          </div>
            <p className={styles.textSm}>
              {t('noParking')}
            </p>
            <p className={styles.textSm}>
              {t('drinkResponsibly')}
            </p>
            <p className={styles.textSm}>
              {t('sociallyYours')}
            </p>
          </div>
        </div>
      );
    } else {
      return (
        <div className={styles.container}>
          <div
            className={styles.containerBackground}
            style={{ backgroundImage: `url(${CanadaFlag})` }}
          ></div>
          <div className={`${styles.halloweenFloat} ${styles.pumpkin1}`}><Pumpkin /></div>
          <div className={`${styles.halloweenFloat} ${styles.ghost1}`}><Ghost /></div>
          <div className={`${styles.halloweenFloat} ${styles.bat1}`}><Bat /></div>
          <div className={`${styles.halloweenFloat} ${styles.spider1}`}><Spider /></div>
          <div className={`${styles.halloweenFloat} ${styles.candy1}`}><Candy /></div>
          <div className={`${styles.halloweenFloat} ${styles.pumpkin2}`}><Pumpkin /></div>
          <div className={`${styles.halloweenFloat} ${styles.ghost2}`}><Ghost /></div>
          <div className={`${styles.halloweenFloat} ${styles.bat2}`}><Bat /></div>
          <div className={styles.content}>
            <h1 className={styles.h1}>{t('eventTitle')}</h1>
            <p className={`${styles.textXl} font-sans`}>
              {t('rsvpClosedMessage') || 'Üzgünüz fakat kayıtlarımız sona ermiştir. Talep ve sorularınız için canadaclub.ankara@international.gc.ca ile iletişime geçebilirsiniz.'}
            </p>
            <p className={styles.textLg}>
              <a href="mailto:canadaclub.ankara@international.gc.ca" className={styles.textRed600}>canadaclub.ankara@international.gc.ca</a>
            </p>
          </div>
        </div>
      );
    }
  }

  if (showDeclineMessage || (   guest.responded   & !guest.willAttend )) {
    return (
      <div className={styles.container}>
        <div
          className={styles.containerBackground}
          style={{ backgroundImage: `url(${CanadaFlag})` }}
        ></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin1}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost1}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat1}`}><Bat /></div>
        <div className={`${styles.halloweenFloat} ${styles.spider1}`}><Spider /></div>
        <div className={`${styles.halloweenFloat} ${styles.candy1}`}><Candy /></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin2}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost2}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat2}`}><Bat /></div>
        <div className={styles.content}>
          <h1 className={styles.h1}>{t('eventTitle')}</h1>
          <p className={`${styles.textXl} font-sans`}>
            {t('declineMessage') || 'Sizleri aramızda göremeyeceğimiz için üzgünüz.'}
          </p>
          <p className={styles.textLg}>
            {t('rsvpEmail') || 'RSVP'}: <a href="mailto:ankara.rsvp@international.gc.ca" className={styles.textRed600}>ankara.rsvp@international.gc.ca</a>
          </p>
        </div>
      </div>
    );
  }

  // Ticketlerin göründüğü ve misafir ekleme formunun açılabildiği kısım:
  if (guest.willAttend && ['EMPLOYEE', 'VIP'].includes(guest.guestType) && showGuestForm && guests.length < maxGuests) {
    // Misafir ekleme formunu göster
    return (
      <div className={styles.container}>
        <div className={styles.containerBackground} style={{ backgroundImage: `url(${CanadaFlag})` }}></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin1}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost1}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat1}`}><Bat /></div>
        <div className={`${styles.halloweenFloat} ${styles.spider1}`}><Spider /></div>
        <div className={`${styles.halloweenFloat} ${styles.candy1}`}><Candy /></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin2}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost2}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat2}`}><Bat /></div>
        <div className={styles.content}>
          <h1 className={styles.h1}>{t('eventTitle')}</h1>
          <p className={`${styles.textXl} font-sans`}>
            {t('dear')} {guest.firstName} {guest.lastName}
          </p>
          <p className={`${styles.textXl} font-sans`}>
            {t('invitationLine')}
          </p>
          <p className={styles.textLg}>
            {t('foodAndBeverage')}
          </p>
          {/* Kişi sayısı göstergesi: yazıların hemen altında, büyük ve turuncu */}
          <div
            style={{
              fontWeight: 700,
              fontSize: '2rem',
              color: '#ff8800', // Temanın turuncu rengi
              margin: '1.5rem 0 1rem 0',
              letterSpacing: '2px',
            }}
          >
            {guests.length}/{maxGuests}
          </div>
          <p className={`${styles.textLg} font-sans`}>
            {t('addGuestPrompt') || 'If you are bringing guests, please fill out the form below:'}
          </p>
          <p className={styles.textSm}>
            {t('additionalGuestsInfo')}
          </p>
          {error && <p className={styles.textRed500}>{error}</p>}
          <div className={styles.formContainer}>
            <input
              type="text"
              name="firstName"
              value={guestData.firstName}
              onChange={handleGuestInputChange}
              placeholder={t('guestsFirstName') || 'Misafir Adı'}
              className={styles.input}
            />
            <input
              type="text"
              name="lastName"
              value={guestData.lastName}
              onChange={handleGuestInputChange}
              placeholder={t('guestsLastName') || 'Misafir Soyadı'}
              className={styles.input}
            />
            <input
              type="email"
              name="email"
              value={guestData.email}
              onChange={handleGuestInputChange}
              placeholder={t('guestsEmail') || 'Misafir E-posta'}
              className={styles.input}
            />
            <div className={styles.buttonContainerSmall}>
              <button
                onClick={handleGuestSubmit}
                className={styles.bgRed600}
              >
                {t('submitGuest') || 'Misafir Ekle'}
              </button>
              <button
                onClick={handleContinueWithoutGuest}
                className={styles.bgWhite}
              >
                {t('continueWithoutGuest') || 'Misafirsiz Devam Et'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // Diğer durumlarda ticketleri göster
  if (guest.willAttend && (!showGuestForm || (['EMPLOYEE', 'VIP'].includes(guest.guestType) && guests.length > 0))) {
    return (
      <div className={styles.container}>
        <div
          className={styles.containerBackground}
          style={{ backgroundImage: `url(${CanadaFlag})` }}
        ></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin1}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost1}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat1}`}><Bat /></div>
        <div className={`${styles.halloweenFloat} ${styles.spider1}`}><Spider /></div>
        <div className={`${styles.halloweenFloat} ${styles.candy1}`}><Candy /></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin2}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost2}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat2}`}><Bat /></div>
        <div className={styles.content}>
          <h1 className={styles.h1}>{t('eventTitle')}</h1>
          <p className={`${styles.textXl} font-sans`}>
            {t('dear')} {guest.firstName} {guest.lastName}
          </p>
          <p className={`${styles.textXl} font-sans`}>
            {t('invitationLine')}
          </p>
          <p className={styles.textLg}>
            {t('foodAndBeverage')}
          </p>
          <p className={styles.textXl}>
            <CalendarIcon />
            {t('eventDate')}
          </p>
          <p className={styles.textLg}>
            {t('eventTime')}
          </p>
          <p className={styles.textLg}>
            <LocationIcon />
            {t('eventLocation')}
          </p>
          <p className={styles.textSm}>
            Aziziye, Cinnah Street no: 58, 06690 Çankaya/Ankara
          </p>
          <p className={styles.textLg}>
            {t('rsvpEmail') || 'RSVP'}: <a href="mailto:canadaclub.ankara@international.gc.ca" className={styles.textRed600}>canadaclub.ankara@international.gc.ca</a>
          </p>
          {error && <p className={styles.textRed500}>{error}</p>}
          <p className={styles.textLg}>
            {t('downloadTicketPrompt') || 'Aşağıdaki düğmeye tıklayıp biletinizi indirebilirsiniz.'}
          </p>
          <div className={styles.buttonContainer}>
            <button className={styles.bgRed600} onClick={handleDownloadOwnTicket}>
              {t('downloadOwnTicket') || 'Biletimi İndir'}
            </button>
            {guests.length > 0 && chunkArray(guests, 3).map((group, groupIdx) => (
              <div key={groupIdx} style={{ display: 'flex', width: '100%', justifyContent: 'center', marginTop: groupIdx > 0 ? '1rem' : 0 }}>
                {group.map((g, index) => (
                  <button key={g.qrId} className={styles.bgRed600} style={{ marginLeft: index > 0 ? '1.5rem' : 0 }} onClick={() => handleDownloadGuestTicket(g)}>
                    {t('downloadGuestTicket') || `Misafir ${groupIdx * 3 + index + 1} Biletini İndir`}
                  </button>
                ))}
              </div>
            ))}
          </div>
          {/* Misafir ekle butonu: RSVP açık ve guest daha fazla misafir ekleyebiliyorsa göster */}
          {rsvpEnabled && ['EMPLOYEE', 'VIP'].includes(guest.guestType) && guests.length < maxGuests && (
            <button className={styles.addGuestButton} style={{ marginTop: '1rem', marginBottom: '2rem' }} onClick={handleShowGuestForm}>
              {t('addGuest') || 'Misafir Ekle'}
            </button>
          )}
          <p className={styles.textSm}>
            {t('noParking')}
          </p>
          <p className={styles.textSm}>
            {t('drinkResponsibly')}
          </p>
          <p className={styles.textSm}>
            {t('sociallyYours')}
          </p>
        </div>
      </div>
    );
  }

  if (!guest.willAttend) {
    return (
      <div className={styles.container}>
        <div
          className={styles.containerBackground}
          style={{ backgroundImage: `url(${CanadaFlag})` }}
        ></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin1}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost1}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat1}`}><Bat /></div>
        <div className={`${styles.halloweenFloat} ${styles.spider1}`}><Spider /></div>
        <div className={`${styles.halloweenFloat} ${styles.candy1}`}><Candy /></div>
        <div className={`${styles.halloweenFloat} ${styles.pumpkin2}`}><Pumpkin /></div>
        <div className={`${styles.halloweenFloat} ${styles.ghost2}`}><Ghost /></div>
        <div className={`${styles.halloweenFloat} ${styles.bat2}`}><Bat /></div>
        <div className={styles.content}>
          <h1 className={styles.h1}>{t('eventTitle')}</h1>
          <p className={`${styles.textXl} font-sans`}>
            {t('dear')} {guest.firstName} {guest.lastName}
          </p>
          <p className={`${styles.textXl} font-sans`}>
            {t('invitationLine')}
          </p>
          <p className={styles.textLg}>
            {t('foodAndBeverage')}
          </p>
          <p className={styles.textXl}>
            <CalendarIcon />
            {t('eventDate')}
          </p>
          <p className={styles.textLg}>
            {t('eventTime')}
          </p>
          <p className={styles.textLg}>
            <LocationIcon />
            {t('eventLocation')}
          </p>
          <p className={styles.textSm}>
            Aziziye, Cinnah Street no: 58, 06690 Çankaya/Ankara
          </p>
          <p className={styles.textLg}>
            {t('rsvpEmail') || 'RSVP'}: <a href="mailto:canadaclub.ankara@international.gc.ca" className={styles.textRed600}>canadaclub.ankara@international.gc.ca</a>
          </p>
          <p className={styles.textSm}>
            {t('noParking')}
          </p>
          <p className={styles.textSm}>
            {t('drinkResponsibly')}
          </p>
          <p className={styles.textSm}>
            {t('sociallyYours')}
          </p>
          {error && <p className={styles.textRed500}>{error}</p>}
          <div className={styles.buttonContainer}>
            <button
              onClick={() => handleResponse(true)}
              className={styles.bgRed600}
              disabled={!guest}
            >
              {t('attend') || 'Katılacağım'}
            </button>
            <button
              onClick={() => handleResponse(false)}
              className={styles.bgWhite}
              disabled={!guest}
            >
              {t('notAttend') || 'Katılmayacağım'}
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default GuestRsvp;