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

const CalendarIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="#dc2626">
    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
  </svg>
);

const LocationIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="#dc2626">
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
  const [eventInfo, setEventInfo] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventAddress: ''
  });

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

    const fetchEventInformation = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/public/event-information`);
        console.log('Event bilgileri alındı:', response.data);
        setEventInfo({
          eventName: response.data.eventName || '',
          eventDate: response.data.eventDate || '',
          eventTime: response.data.eventTime || '',
          eventLocation: response.data.eventLocation || '',
          eventAddress: response.data.eventAddress || ''
        });
      } catch (err) {
        console.error('Event bilgileri alma hatası:', err.response?.data || err.message);
        // Hata durumunda translation key'lerini kullan
        setEventInfo({
          eventName: '',
          eventDate: '',
          eventTime: '',
          eventLocation: '',
          eventAddress: ''
        });
      }
    };

    checkRsvpStatus();
    fetchGuest();
    fetchEventInformation();
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
          eventInfo={eventInfo}
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
            style={{ 
              backgroundImage: `url(${CanadaFlag})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundPosition: 'center'
            }}
          ></div>
          <div className={styles.content}>
            <h1 className={styles.h1}>
              <div>Canada Club's</div>
              <div>{eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}</div>
            </h1>
            <p className={`${styles.textXl} font-sans`}>
              {t('dear')} {guest.firstName} {guest.lastName}
            </p>
            <p className={`${styles.textXl} font-sans`}>
              {t('invitationLinePrefix') || 'You are invited to Canada Club\'s'} {eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}
            </p>
            <p className={styles.textLg}>
              {t('foodAndBeverage')}
            </p>
            <p className={styles.textXl}>
              <CalendarIcon />
              {eventInfo.eventDate || t('eventDate')}
            </p>
            <p className={styles.textLg}>
              {eventInfo.eventTime || t('eventTime')}
            </p>
            <p className={styles.textLg}>
              <LocationIcon />
              {eventInfo.eventLocation || t('eventLocation')}
            </p>
            <p className={styles.textSm}>
              {eventInfo.eventAddress || 'Aziziye, Cinnah Street no: 58, 06690 Çankaya/Ankara'}
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
            style={{ 
              backgroundImage: `url(${CanadaFlag})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundPosition: 'center'
            }}
          ></div>
        <div className={styles.content}>
          <h1 className={styles.h1}>
            <div>Canada Club's</div>
            <div>{eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}</div>
          </h1>
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
        <div className={styles.content}>
          <h1 className={styles.h1}>
            <div>Canada Club's</div>
            <div>{eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}</div>
          </h1>
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
        <div className={styles.containerBackground} style={{ 
          backgroundImage: `url(${CanadaFlag})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          backgroundPosition: 'center'
        }}></div>
        <div className={styles.content}>
          <h1 className={styles.h1}>
            <div>Canada Club's</div>
            <div>{eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}</div>
          </h1>
          <p className={`${styles.textXl} font-sans`}>
            {t('dear')} {guest.firstName} {guest.lastName}
          </p>
          <p className={`${styles.textXl} font-sans`}>
            {t('invitationLinePrefix') || 'You are invited to Canada Club\'s'} {eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}
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
        <div className={styles.content}>
          <h1 className={styles.h1}>
            <div>Canada Club's</div>
            <div>{eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}</div>
          </h1>
          <p className={`${styles.textXl} font-sans`}>
            {t('dear')} {guest.firstName} {guest.lastName}
          </p>
          <p className={`${styles.textXl} font-sans`}>
            {t('invitationLinePrefix') || 'You are invited to Canada Club\'s'} {eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}
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
        <div className={styles.content}>
          <h1 className={styles.h1}>
            <div>Canada Club's</div>
            <div>{eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}</div>
          </h1>
          <p className={`${styles.textXl} font-sans`}>
            {t('dear')} {guest.firstName} {guest.lastName}
          </p>
          <p className={`${styles.textXl} font-sans`}>
            {t('invitationLinePrefix') || 'You are invited to Canada Club\'s'} {eventInfo.eventName || t('eventName') || 'HALLOWEEN PARTY'}
          </p>
          <p className={styles.textLg}>
            {t('foodAndBeverage')}
          </p>
          <p className={styles.textXl}>
            <CalendarIcon />
            {eventInfo.eventDate || t('eventDate')}
          </p>
          <p className={styles.textLg}>
            {eventInfo.eventTime || t('eventTime')}
          </p>
          <p className={styles.textLg}>
            <LocationIcon />
            {eventInfo.eventLocation || t('eventLocation')}
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