import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'https://backend.canada-ankara.com';

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

        setIsLinkValid(validateResponse.data.valid === true);
        setIsRsvpEnabled(validateResponse.data.rsvpEnabled !== false);
        setEventInfo({
          eventName: eventInfoResponse.data.eventName || '',
          eventDate: eventInfoResponse.data.eventDate || '',
          eventTime: eventInfoResponse.data.eventTime || '',
          eventLocation: eventInfoResponse.data.eventLocation || '',
          eventAddress: eventInfoResponse.data.eventAddress || '',
        });
      } catch (err) {
        setIsLinkValid(false);
        setError(err.response?.data?.message || 'Link gecersiz veya suresi dolmus.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

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

      setSuccess('Kayit tamamlandi, bilet sayfasina yonlendiriliyorsunuz...');
      setTimeout(() => {
        navigate(`/rsvp/${response.data.qrId}`);
      }, 700);
    } catch (err) {
      setError(err.response?.data?.message || 'Kayit sirasinda bir hata olustu.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container mt-5 text-center">
        <h4>Yukleniyor...</h4>
      </div>
    );
  }

  if (!isLinkValid) {
    return (
      <div className="container mt-5" style={{ maxWidth: '720px' }}>
        <div className="alert alert-danger">
          {error || 'Bu RSVP linki gecersiz veya suresi dolmus.'}
        </div>
      </div>
    );
  }

  if (!isRsvpEnabled) {
    return (
      <div className="container mt-5" style={{ maxWidth: '720px' }}>
        <div className="alert alert-warning">
          Genel RSVP kayitlari su anda kapali.
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-5" style={{ maxWidth: '720px' }}>
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h3 className="mb-3">General RSVP</h3>
          {eventInfo.eventName && <h5 className="mb-3">{eventInfo.eventName}</h5>}
          {eventInfo.eventDate && <p className="mb-1"><strong>Tarih:</strong> {eventInfo.eventDate}</p>}
          {eventInfo.eventTime && <p className="mb-1"><strong>Saat:</strong> {eventInfo.eventTime}</p>}
          {eventInfo.eventLocation && <p className="mb-1"><strong>Yer:</strong> {eventInfo.eventLocation}</p>}
          {eventInfo.eventAddress && <p className="text-muted">{eventInfo.eventAddress}</p>}

          <hr />
          <p className="mb-3">Kayit olmak icin bilgilerinizi doldurun.</p>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Isim</label>
              <input
                type="text"
                name="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Soyisim</label>
              <input
                type="text"
                name="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label">E-posta</label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button type="submit" className="btn btn-canada" disabled={submitting}>
              {submitting ? 'Kaydediliyor...' : 'Kaydol ve Bileti Goster'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GeneralRsvp;
