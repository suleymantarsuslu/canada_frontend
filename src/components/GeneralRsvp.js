import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import styles from './GuestRsvp.module.css';
import CanadaFlag from '../assets/canada_flag.png';

const API_URL = 'https://backend.canada-ankara.com';

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

const GeneralRsvp = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [eventInfo, setEventInfo] = useState({
    eventName: '',
    eventDate: '',
    eventTime: '',
    eventLocation: '',
    eventAddress: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLinkValid, setIsLinkValid] = useState(true);
  const [isRsvpEnabled, setIsRsvpEnabled] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [validateResponse, eventInfoResponse] = await Promise.all([
          axios.get(`${API_URL}/api/public/general-rsvp/validate/${token}`),
          axios.get(`${API_URL}/api/public/event-information`),
        ]);

        if (validateResponse.data.valid !== true) {
          navigate('/not-found', { replace: true });
          return;
        }

        setIsLinkValid(true);
        setIsRsvpEnabled(validateResponse.data.rsvpEnabled !== false);
        setEventInfo({
          eventName: eventInfoResponse.data.eventName || '',
          eventDate: eventInfoResponse.data.eventDate || '',
          eventTime: eventInfoResponse.data.eventTime || '',
          eventLocation: eventInfoResponse.data.eventLocation || '',
          eventAddress: eventInfoResponse.data.eventAddress || '',
        });
      } catch (err) {
        navigate('/not-found', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(`${API_URL}/api/public/general-rsvp/register`, {
        token,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });

      setSuccess('Registration completed, redirecting you to the ticket page...');
      setTimeout(() => {
        navigate(`/rsvp/${response.data.qrId}`);
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred during registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.body}>
        <div className={styles.content}>
          <h4>Loading...</h4>
        </div>
      </div>
    );
  }

  if (!isLinkValid) {
    return (
      <div className={styles.body}>
        <div className={styles.container}>
          <div className={styles.content}>
            <div className={styles.textRed500}>
              {error || 'This RSVP link is invalid or expired.'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isRsvpEnabled) {
    return (
      <div className={styles.body}>
        <div className={styles.container}>
          <div
            className={styles.containerBackground}
            style={{
              backgroundImage: `url(${CanadaFlag})`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: 'contain',
              backgroundPosition: 'center',
            }}
          ></div>
          <div className={styles.content}>
            <h1 className={styles.h1}>
              <div>Canada Club Resresents</div>
              <div>{eventInfo.eventName || 'Event Registration'}</div>
            </h1>
            <p className={styles.textXl}>General RSVP registrations are currently closed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.body}>
      <div className={styles.container}>
        <div
          className={styles.containerBackground}
          style={{
            backgroundImage: `url(${CanadaFlag})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
          }}
        ></div>
        <div className={styles.content}>
          <h1 className={styles.h1}>
            <div>Canada Club Resresents</div>
            <div>{eventInfo.eventName || 'Event Registration'}</div>
          </h1>

          <p className={styles.textLg}>Please fill in your information to register.</p>
          {eventInfo.eventDate && (
            <p className={styles.textXl}>
              <CalendarIcon />
              {eventInfo.eventDate}
            </p>
          )}
          {eventInfo.eventTime && <p className={styles.textLg}>{eventInfo.eventTime}</p>}
          {eventInfo.eventLocation && (
            <p className={styles.textLg}>
              <LocationIcon />
              {eventInfo.eventLocation}
            </p>
          )}
          {eventInfo.eventAddress && <p className={styles.textSm}>{eventInfo.eventAddress}</p>}

          <form onSubmit={handleSubmit} className={styles.formContainer} style={{ marginTop: '1.5rem' }}>
            <div>
              <label className={styles.textSm} style={{ display: 'block', marginBottom: '0.4rem' }}>First Name</label>
              <input
                type="text"
                name="firstName"
                className={styles.input}
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className={styles.textSm} style={{ display: 'block', marginBottom: '0.4rem' }}>Last Name</label>
              <input
                type="text"
                name="lastName"
                className={styles.input}
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className={styles.textSm} style={{ display: 'block', marginBottom: '0.4rem' }}>Email</label>
              <input
                type="email"
                name="email"
                className={styles.input}
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className={styles.textRed500}>{error}</div>}
            {success && <div className={styles.textLg}>{success}</div>}

            <button type="submit" className={styles.bgRed600} disabled={submitting}>
              {submitting ? 'Registering...' : 'Register and View Ticket'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeneralRsvp;
