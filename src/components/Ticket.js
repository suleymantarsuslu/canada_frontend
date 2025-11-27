import React from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './Ticket.module.css';
import TicketHeader from '../assets/TicketHeader.png';
import CanadaFlag from '../assets/canada_flag.png';
import G7Image from '../assets/G7.avif';

const MapleLeaf = () => (
  <svg className={styles.mapleLeaf} width="50" height="50" viewBox="0 0 100 100" fill="red">
    <path d="M12 2l1.5 4.5h4.5l-1.5 3.5 3.5 1-3.5 1.5 1.5 3.5h-4.5l-1.5 4.5-1.5-4.5h-4.5l1.5-3.5-3.5-1 3.5-1.5-1.5-3.5h4.5l1.5-4.5zM12 6l-.75 2.25h-2.25l.75 1.75-1.75.5 1.75.75-.75 1.75h2.25l.75 2.25.75-2.25h2.25l-.75-1.75 1.75-.75-1.75-.5.75-1.75h-2.25l-.75-2.25z" />
  </svg>
);

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

const Ticket = ({ guest, qrId, isPlusOne = false, plusOneGuest, eventInfo = null }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container} id="ticket-content">
      <div
        className={styles.containerBackground}
        style={{ backgroundImage: `url(${CanadaFlag})` }}
      ></div>
      <div className={styles.mapleLeaf} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}><MapleLeaf /></div>
      <div className={styles.content}>
        <img src={TicketHeader} alt="Ticket Header" className={styles.ticketHeader} />
        <h1 className={styles.h1}>
          <div>Canada Club's</div>
          <div>{eventInfo?.eventName || t('eventName') || 'HALLOWEEN PARTY'}</div>
        </h1>
        <p className={`${styles.textXl} font-sans`}>
          {t('dear') || 'Dear'} {guest.firstName} {guest.lastName}
        </p>
        <p className={`${styles.textXl} font-sans`}>
          {t('invitationLinePrefix') || 'You are invited to Canada Club\'s'} {eventInfo?.eventName || t('eventName') || 'HALLOWEEN PARTY'}
        </p>
        <p className={styles.textLg}>
          {t('foodAndBeverage') || 'Food and beverages available for cash purchase.'}
        </p>
        <p className={styles.textXl}>
          <CalendarIcon />
          {eventInfo?.eventDate || t('eventDate') || 'Friday July 18th, 2025'}
        </p>
        <p className={styles.textLg}>
          {eventInfo?.eventTime || t('eventTime') || '18:00 - 22:00'}
        </p>
        <p className={styles.textLg}>
          <LocationIcon />
          {eventInfo?.eventLocation || t('eventLocation') || 'At the Canadian Embassy in Ankara'}
        </p>
        <p className={styles.textSm}>
          {eventInfo?.eventAddress || 'Aziziye, Cinnah Street no: 58, 06690 Çankaya/Ankara'}
        </p>
        <p className={styles.textLg}>
          {t('rsvpEmail') || 'RSVP'}: <a href="mailto:canadaclub.ankara@international.gc.ca" className={styles.textRed600}>canadaclub.ankara@international.gc.ca</a>
        </p>
        <div className={styles.qrContainer}>
          <div className={styles.qrFrame}>
            <QRCodeCanvas value={qrId} size={200} level="H" />
          </div>
          <div className={styles.qrIdFrame}>
            <span className={styles.qrIdText}>{qrId}</span>
          </div>
        </div>

        <p className={styles.textSm}>
          {t('qrCodeNotice') || 'Please present your ticket and ID at the entrance.'}
        </p>
        <p className={styles.textSm}>
          {t('noParking') || 'No parking available. This invitation is non-transferable.'}
        </p>
        <p className={styles.textSm}>
          {t('noMinors') || 'No minors will be allowed.'}
        </p>
        <img src={G7Image} alt="G7 Logo" className={styles.g7Image} />
      </div>
    </div>
  );
};

export default Ticket;