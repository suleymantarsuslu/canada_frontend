import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import ReactPaginate from 'react-paginate';
import Select from 'react-select';
import SearchBar from './SearchBar';
import ConfirmModal from './ConfirmModal';
import PlusOneModal from './PlusOneModal';
import * as XLSX from 'xlsx';
import loadingGif from '../assets/wait.gif';

const EventSettings = () => {
  const { t } = useTranslation();
  const [guests, setGuests] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [newGuest, setNewGuest] = useState({
    firstName: '',
    lastName: '',
    email: '',
    guestType: 'REGULAR',
    selectedInviterId: null,
  });
  const [editGuest, setEditGuest] = useState(null);
  const [addGuestModalOpen, setAddGuestModalOpen] = useState(false);
  const [editGuestModalOpen, setEditGuestModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalAction, setModalAction] = useState(() => {});
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [inviters, setInviters] = useState([]);
  const [inviterSearchTerm, setInviterSearchTerm] = useState('');
  const [plusOneName, setPlusOneName] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [totalGuests, setTotalGuests] = useState(0);
  const [plusOneModalOpen, setPlusOneModalOpen] = useState(false);
  const [selectedGuestForPlusOne, setSelectedGuestForPlusOne] = useState(null);
  const [guestTypeSettings, setGuestTypeSettings] = useState({
    REGULAR: 0,
    VIP: 5,
    EMPLOYEE: 5,
    PLUSONE: 0
  });
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailData, setMailData] = useState({
    to: '',
    subject: '',
    message: ''
  });
  const [sendingMail, setSendingMail] = useState(false);
  const [mailTemplateType, setMailTemplateType] = useState('invitation');
  const [mailFilters, setMailFilters] = useState({
    guestType: 'ALL',
    willAttend: undefined,
    responded: undefined
  });

  const fetchGuests = useCallback(async (page, search) => {
    try {
      const response = await axios.get('https://backend.canada-ankara.com/api/admin/guests', {
        params: { page: page + 1, limit: 10, search },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setGuests(response.data.guests);
      setPageCount(response.data.totalPages);
      setSelectedGuests([]);
    } catch (error) {
      console.error('Davetli listeleme hatası:', error);
      alert(`${t('error')}: ${error.response?.data?.message || t('fetchGuestsFailed')}`);
    }
  }, [t]);

  const fetchAllGuests = useCallback(async (search) => {
    try {
      const response = await axios.get('https://backend.canada-ankara.com/api/admin/guests', {
        params: { limit: 'all', search },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      return response.data.guests;
    } catch (error) {
      console.error('Tüm davetlileri alma hatası:', error);
      alert(`${t('error')}: ${error.response?.data?.message || t('fetchAllGuestsFailed')}`);
      return [];
    }
  }, [t]);

  const fetchTotalGuests = useCallback(async () => {
    try {
      const response = await axios.get('https://backend.canada-ankara.com/api/admin/guests', {
        params: { limit: 'all' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setTotalGuests(response.data.guests?.length || 0);
    } catch (error) {
      console.error('Toplam misafir sayısı alınamadı:', error);
      setTotalGuests(0);
    }
  }, []);

  const fetchGuestTypeSettings = useCallback(async () => {
    try {
      const response = await axios.get('https://backend.canada-ankara.com/api/admin/guest-type-settings', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setGuestTypeSettings(response.data.settings);
    } catch (error) {
      console.error('Guest type settings alınamadı:', error);
    }
  }, []);



const fetchInviters = useCallback(async (search = '') => {
  try {
    console.log('fetchInviters çağrıldı, arama terimi:', search);
    const response = await axios.get('https://backend.canada-ankara.com/api/admin/guests/employee-vip', {
      params: { search },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
    console.log('API\'den gelen davet edenler:', response.data.inviters);
    setInviters(response.data.inviters || []);
  } catch (error) {
    console.error('Davet eden listeleme hatası:', error);
    alert(`${t('error')}: ${error.response?.data?.message || t('fetchInvitersFailed')}`);
    setInviters([]);
  }
}, [t]);

  const getPlusOneName = useCallback(async (plusOneQrId) => {
    if (!plusOneQrId || plusOneQrId === 'NA') {
      console.log('PlusOne QR ID boş veya NA:', plusOneQrId);
      return '';
    }
    
    try {
      console.log('PlusOne aranıyor, QR ID:', plusOneQrId);
      const response = await axios.get('https://backend.canada-ankara.com/api/admin/guests', {
        params: { limit: 'all' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
            
      const plusOneGuest = response.data.guests.find((guest) => {
        console.log(`Misafir kontrol ediliyor: ${guest.firstName} ${guest.lastName}, QR: ${guest.qrId}, Type: ${guest.guestType}`);
        return guest.qrId === plusOneQrId && guest.guestType === 'PLUSONE';
      });
      
      if (plusOneGuest) {
        const fullName = `${plusOneGuest.firstName} ${plusOneGuest.lastName}`;
        console.log('PlusOne misafir bulundu:', fullName);
        return fullName;
      } else {
        console.log('PlusOne misafir bulunamadı, QR ID:', plusOneQrId);
        const anyGuestWithQrId = response.data.guests.find((guest) => guest.qrId === plusOneQrId);
        if (anyGuestWithQrId) {
          console.log('QR ID ile eşleşen misafir bulundu ama PLUSONE değil:', anyGuestWithQrId);
          return `${anyGuestWithQrId.firstName} ${anyGuestWithQrId.lastName}`;
        }
        return t('unknownGuest');
      }
    } catch (error) {
      console.error('PlusOne ismi alma hatası:', error);
      return t('unknownGuest');
    }
  }, [t]);

useEffect(() => {
  const shouldFetchInviters =
    (addGuestModalOpen && newGuest.guestType === 'PLUSONE') ||
    (editGuestModalOpen && editGuest?.guestType === 'PLUSONE');
  if (shouldFetchInviters) {
    fetchInviters(inviterSearchTerm); // Arama terimi ile davet edenleri getir
  } else {
    setInviters([]);
    setInviterSearchTerm(''); // Arama terimini sıfırla
  }
}, [addGuestModalOpen, newGuest.guestType, editGuestModalOpen, editGuest, inviterSearchTerm, fetchInviters]);
  

  useEffect(() => {
    fetchGuests(currentPage, searchTerm);
    fetchTotalGuests();
    fetchGuestTypeSettings();
  }, [currentPage, searchTerm, fetchGuests, fetchTotalGuests, fetchGuestTypeSettings]);

  useEffect(() => {
    const plusOneQrId = editGuest?.plusOneQrId;
    if (editGuestModalOpen && plusOneQrId && plusOneQrId !== 'NA') {
      getPlusOneName(plusOneQrId).then((name) => setPlusOneName(name));
    } else {
      setPlusOneName('');
    }
  }, [editGuestModalOpen, editGuest, getPlusOneName]);

  const handleOpenRsvpLink = (qrId) => {
    if (qrId) {
      window.open(`/rsvp/${qrId}`, '_blank');
    } else {
      alert(t('qrIdNotFound'));
    }
  };

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleAddGuest = () => {
    if (!newGuest.firstName || !newGuest.lastName || !newGuest.email || !newGuest.guestType) {
      alert(t('empty_fields'));
      return;
    }
    if (newGuest.guestType === 'PLUSONE' && !newGuest.selectedInviterId) {
      alert(t('inviter_required'));
      return;
    }
    setModalMessage(newGuest.guestType === 'PLUSONE' ? t('confirmAddPlusOne') : t('confirmAddGuest'));
    setModalAction(() => async () => {
      try {
        await axios.post('https://backend.canada-ankara.com/api/admin/guests', newGuest, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setNewGuest({ firstName: '', lastName: '', email: '', guestType: 'REGULAR', selectedInviterId: null });
        setInviterSearchTerm('');
        setAddGuestModalOpen(false);
        setModalOpen(false);
        fetchGuests(currentPage, searchTerm);
        fetchTotalGuests();
        alert(newGuest.guestType === 'PLUSONE' ? t('addPlusOneSuccess') : t('participantAdded'));
      } catch (error) {
        console.error('Davetli ekleme hatası:', error);
        alert(`${t('error')}: ${error.response?.data?.message || t('addGuestFailed')}`);
        setModalOpen(false);
      }
    });
    setModalOpen(true);
  };

  const handleExportToExcel = async () => {
    setIsExporting(true);
    try {
      const allGuests = await fetchAllGuests(searchTerm);
      if (!allGuests || allGuests.length === 0) {
        alert(t('noGuestsFound'));
        return;
      }

      const headers = [
        t('firstName'),
        t('lastName'),
        t('email'),
        t('guestType'),
        t('qrId'),
        t('plusOneCount'),
        t('responded'),
        t('willAttend'),
        t('isCheckedIn'),
        t('checkInTime'),
      ];

      const data = allGuests.map((guest) => ({
        [t('firstName')]: guest.firstName,
        [t('lastName')]: guest.lastName,
        [t('email')]: guest.email,
        [t('guestType')]: guest.guestType,
        [t('qrId')]: guest.qrId || '',
        [t('plusOneCount')]: guest.guests ? guest.guests.length : 0,
        [t('responded')]: guest.responded ? t('yes') : t('no'),
        [t('willAttend')]: guest.willAttend ? t('yes') : t('no'),
        [t('isCheckedIn')]: guest.isCheckedIn ? t('yes') : t('no'),
        [t('checkInTime')]: guest.checkInTime ? new Date(guest.checkInTime).toLocaleString() : '',
      }));

      const ws = XLSX.utils.json_to_sheet(data, { header: headers });
      ws['!cols'] = headers.map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Guests');
      XLSX.writeFile(wb, `guests_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Excel aktarma hatası:', error);
      alert(`${t('error')}: ${t('exportToExcel')} ${t('failed')}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleEdit = (guest) => {
    setEditGuest({
      _id: guest._id,
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      guestType: guest.guestType,
      selectedInviterId: guest.guestType === 'PLUSONE' ? guest.selectedInviterId : null,
      plusOneQrId: guest.plusOneQrId || null,
    });
    setEditGuestModalOpen(true);
  };

  const handleUpdateGuest = () => {
    if (!editGuest.firstName || !editGuest.lastName || !editGuest.email || !editGuest.guestType) {
      alert(t('empty_fields'));
      return;
    }
    if (editGuest.guestType === 'PLUSONE' && !editGuest.selectedInviterId) {
      alert(t('inviter_required'));
      return;
    }
    setModalMessage(t('confirmUpdateGuest'));
    setModalAction(() => async () => {
      try {
        const payload = {
          firstName: editGuest.firstName,
          lastName: editGuest.lastName,
          email: editGuest.email,
          guestType: editGuest.guestType,
          selectedInviterId: editGuest.guestType === 'PLUSONE' ? editGuest.selectedInviterId : null,
        };
        await axios.put(`https://backend.canada-ankara.com/api/admin/guests/${editGuest._id}`, payload, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setEditGuestModalOpen(false);
        setEditGuest(null);
        setPlusOneName('');
        fetchGuests(currentPage, searchTerm);
        fetchTotalGuests();
        alert(t('participantUpdated'));
      } catch (error) {
        console.error('Davetli güncelleme hatası:', error);
        alert(`${t('error')}: ${error.response?.data?.message || t('updateGuestFailed')}`);
      }
      setModalOpen(false);
    });
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    const guest = guests.find((g) => g._id === id);
    setModalMessage(guest.plusOneQrId && guest.plusOneQrId !== 'NA' ? t('confirmDeleteWithPlusOne') : t('confirmDelete'));
    setModalAction(() => async () => {
      try {
        await axios.delete(`https://backend.canada-ankara.com/api/admin/guests/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        fetchGuests(currentPage, searchTerm);
        fetchTotalGuests();
        setSelectedGuests((prev) => prev.filter((selectedId) => selectedId !== id));
        alert(t('deleteSuccess'));
      } catch (error) {
        console.error('Davetli silme hatası:', error);
        alert(`${t('error')}: ${error.response?.data?.message || t('deleteFailed')}`);
      }
      setModalOpen(false);
    });
    setModalOpen(true);
  };

  const handleToggleAttend = (id) => {
    const guest = guests.find((g) => g._id === id);
    setModalMessage(guest.willAttend ? t('confirmNotAttend') : t('confirmAttend'));
    setModalAction(() => async () => {
      try {
        await axios.put(`https://backend.canada-ankara.com/api/admin/guests/${id}/toggle-attend`, {}, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        setModalOpen(false);
        fetchGuests(currentPage, searchTerm);
        fetchTotalGuests();
        alert(t('participantUpdated'));
      } catch (error) {
        console.error('Katılım durumu güncelleme hatası:', error);
        alert(`${t('error')}: ${error.response?.data?.message || t('updateGuestFailed')}`);
        setModalOpen(false);
      }
    });
    setModalOpen(true);
  };

  const handleRemoveInvited = (guestId, plusOneQrId) => {
    setModalMessage(t('confirmRemoveInvited'));
    setModalAction(() => async () => {
      let plusOneDeleted = false;
      try {
        if (plusOneQrId && plusOneQrId !== 'NA') {
          try {
            const response = await axios.get('https://backend.canada-ankara.com/api/admin/guests', {
              params: { limit: 'all' },
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });

            const plusOneGuest = response.data.guests.find((g) => g.qrId === plusOneQrId && g.guestType === 'PLUSONE');

            if (plusOneGuest) {
              await axios.delete(`https://backend.canada-ankara.com/api/admin/guests/${plusOneGuest._id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
              });
              console.log('PlusOne misafir başarıyla silindi:', plusOneGuest._id);
              plusOneDeleted = true;
            } else {
              console.log('PlusOne misafir bulunamadı. QR ID:', plusOneQrId);
            }
          } catch (error) {
            console.error('PlusOne misafir silme hatası:', error.response?.data || error.message);
            console.log('PlusOne silme başarısız, işleme devam ediliyor...');
          }
        } else {
          console.log('PlusOneQrId boş veya NA, silme işlemi atlanıyor.');
        }

        await axios.put(
          `https://backend.canada-ankara.com/api/admin/guests/${guestId}`,
          { plusOneQrId: '' },
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        console.log('Ana davetlinin plusOneQrId başarıyla temizlendi');

        fetchGuests(currentPage, searchTerm);
        fetchTotalGuests();
        setPlusOneName('');
        alert(plusOneDeleted ? t('removeInvitedSuccess') : t('removeInvitedSuccessNoPlusOne'));

      } catch (error) {
        console.error('handleRemoveInvited hatası:', error.response?.data || error.message);
        alert(`${t('error')}: ${error.response?.data?.messageKey ? t(error.response.data.messageKey) : t('removeInvitedFailed')}`);
      } finally {
        setModalOpen(false);
      }
    });
    setModalOpen(true);
  };

  const handleBulkDelete = () => {
    if (selectedGuests.length === 0) return;
    setModalMessage(t('confirmBulkDeleteWithPlusOne'));
    setModalAction(() => async () => {
      try {
        await Promise.all(
          selectedGuests.map(async (id) => {
            await axios.delete(`https://backend.canada-ankara.com/api/admin/guests/${id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
          })
        );
        fetchGuests(currentPage, searchTerm);
        fetchTotalGuests();
        setSelectedGuests([]);
        alert(t('bulkDeleteSuccess'));
      } catch (error) {
        console.error('Toplu silme hatası:', error);
        alert(`${t('error')}: ${error.response?.data?.message || t('bulkDeleteFailed')}`);
      }
      setModalOpen(false);
    });
    setModalOpen(true);
  };

const inviterOptions = inviters.map((inviter) => {
  const currentCount = inviter.guests ? inviter.guests.length : 0;
  const maxGuests = guestTypeSettings[inviter.guestType] || 0;
  return {
    value: inviter._id,
    label: `${inviter.firstName} ${inviter.lastName} (${currentCount}/${maxGuests})`,
  };
});

  const handleRowClick = (id) => {
    setSelectedGuests((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  };

  const handleOpenPlusOneModal = (guest) => {
    setSelectedGuestForPlusOne(guest);
    setPlusOneModalOpen(true);
  };

  const handleClosePlusOneModal = () => {
    setPlusOneModalOpen(false);
    setSelectedGuestForPlusOne(null);
  };

  // Mail gönderme fonksiyonları
  const handleMailInputChange = (e) => {
    const { name, value } = e.target;
    setMailData({ ...mailData, [name]: value });
  };

  const handleSendMail = async (e) => {
    e.preventDefault();
    setSendingMail(true);
    
    try {
      const response = await axios.post(
        'https://backend.canada-ankara.com/api/admin/mail/send',
        mailData,
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          } 
        }
      );
      
      if (response.data.success) {
        alert('Mail başarıyla gönderildi!');
        setShowMailModal(false);
        setMailData({ to: '', subject: '', message: '' });
      } else {
        alert('Mail gönderilemedi: ' + response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Mail gönderme hatası';
      alert(errorMessage);
      console.error('Mail gönderme hatası:', err.response?.data || err.message);
    } finally {
      setSendingMail(false);
    }
  };

  const handleSendBulkMail = async () => {
    setSendingMail(true);
    
    try {
      const response = await axios.post(
        'https://backend.canada-ankara.com/api/admin/mail/bulk',
        {
          templateType: mailTemplateType,
          customData: {
            eventDate: '18 Temmuz 2025',
            eventTime: '19:00',
            eventLocation: 'Canada Club Ankara'
          },
          filters: mailFilters
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          } 
        }
      );
      
      if (response.data.success) {
        alert(`${response.data.totalSent} mail başarıyla gönderildi, ${response.data.totalFailed} mail gönderilemedi`);
        setShowMailModal(false);
      } else {
        alert('Toplu mail gönderilemedi: ' + response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Toplu mail gönderme hatası';
      alert(errorMessage);
      console.error('Toplu mail gönderme hatası:', err.response?.data || err.message);
    } finally {
      setSendingMail(false);
    }
  };

  const handleSendMailToSelected = async () => {
    if (selectedGuests.length === 0) {
      alert('Lütfen en az bir davetli seçin');
      return;
    }

    setSendingMail(true);
    
    try {
      const response = await axios.post(
        'https://backend.canada-ankara.com/api/admin/mail/send-to-guests',
        {
          guestIds: selectedGuests,
          templateType: mailTemplateType,
          customData: {
            eventDate: '18 Temmuz 2025',
            eventTime: '19:00',
            eventLocation: 'Canada Club Ankara'
          }
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          } 
        }
      );
      
      if (response.data.success) {
        alert(`${response.data.totalSent} mail başarıyla gönderildi, ${response.data.totalFailed} mail gönderilemedi`);
        setShowMailModal(false);
      } else {
        alert('Seçili davetlilere mail gönderilemedi: ' + response.data.message);
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Mail gönderme hatası';
      alert(errorMessage);
      console.error('Seçili davetlilere mail gönderme hatası:', err.response?.data || err.message);
    } finally {
      setSendingMail(false);
    }
  };

  const handleOpenMailModal = () => {
    setMailData({
      to: '',
      subject: 'G7 Canada Club Event - Davet',
      message: 'Sayın [Ad Soyad],\n\nG7 Canada Club Event\'ine davet edildiğinizi bildirmekten mutluluk duyarız.\n\nEtkinlik Detayları:\n- Tarih: 18 Temmuz 2025\n- Saat: 19:00\n- Konum: Canada Club Ankara\n- Adres: Aziziye, Cinnah Street no: 58, 06690 Çankaya/Ankara\n\nSaygılarımızla,\nCanada Club Ankara'
    });
    setShowMailModal(true);
  };

  const handlePlusOneUpdate = () => {
    fetchGuests(currentPage, searchTerm);
    fetchTotalGuests();
  };

  return (
    <div className="container-custom mt-5">
      <style>
        {`
          .action-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 4px;
          }

          .actions-column {
            min-width: 150px;
          }
          .btn-canada.btn-sm i {
            font-size: 14px;
          }

          .btn-attend {
            background-color: #28a745;
            color: white;
            border: none;
          }
          .btn-attend:hover {
            background-color: #218838;
          }
          .btn-not-attend {
            background-color: #dc3545;
            color: white;
            border: none;
          }
          .btn-not-attend:hover {
            background-color: #c82333;
          }
          .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
          }
          .loading-spinner {
            width: 100px;
            height: 100px;
          }
          .modal-content {
            background-color: #2c2f33;
            color: #ffffff;
            border-radius: 8px;
          }
          .modal-header, .modal-footer {
            border-color: #444;
          }
          .form-control, .form-select {
            background-color: #3a3d41;
            color: #ffffff;
            border: 1px solid #555;
          }
          .form-control::placeholder {
            color: #aaa;
          }
          .react-select__control {
            background-color: #3a3d41;
            border: 1px solid #555;
            color: #ffffff;
          }
          .react-select__single-value {
            color: #ffffff;
          }
          .react-select__input-container {
            color: #ffffff !important;
          }
          .react-select__menu {
            background-color: #2c2f33;
            color: #ffffff;
          }
          .react-select__option {
            background-color: #2c2f33;
            color: #ffffff;
          }
          .react-select__option--is-focused {
            background-color: #444;
          }
          .react-select__option--is-selected {
            background-color: #007bff;
            color: #ffffff;
          }
        `}
      </style>
      <div className="row justify-content-center">
        <div className="col-md-11">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">{t('eventSettings')} ({totalGuests})</h4>
              <div className="filter-container d-flex align-items-center">
                {selectedGuests.length > 0 && (
                  <span
                    onClick={handleBulkDelete}
                    className="text-orange me-3"
                    style={{ cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {t('deleteSelected')}
                  </span>
                )}
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <div className="ms-auto d-flex">
                  <button 
                    onClick={handleOpenMailModal} 
                    className="btn btn-info me-2"
                    disabled={isExporting}
                  >
                    <i className="fas fa-envelope me-1"></i>
                    Mail Gönder
                  </button>
                  <button 
                    onClick={handleSendBulkMail} 
                    className="btn btn-warning me-2"
                    disabled={isExporting}
                  >
                    <i className="fas fa-broadcast-tower me-1"></i>
                    Toplu Mail
                  </button>
                  {selectedGuests.length > 0 && (
                    <button 
                      onClick={handleSendMailToSelected} 
                      className="btn btn-success me-2"
                      disabled={isExporting}
                    >
                      <i className="fas fa-users me-1"></i>
                      Seçili Davetlilere Mail ({selectedGuests.length})
                    </button>
                  )}
                  <button 
                    onClick={handleExportToExcel} 
                    className="btn btn-canada me-2"
                    disabled={isExporting}
                  >
                    {t('exportToExcel')}
                  </button>
                  <button 
                    onClick={() => setAddGuestModalOpen(true)} 
                    className="btn btn-canada"
                    disabled={isExporting}
                  >
                    {t('addParticipant')}
                  </button>

                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>{t('firstName')}</th>
                      <th>{t('lastName')}</th>
                      <th>{t('email')}</th>
                      <th>{t('guestType')}</th>
                      <th>{t('qrId')}</th>
                      <th>{t('plusOneCount')}</th>
                      <th>{t('responded')}</th>
                      <th>{t('willAttend')}</th>
                      <th>{t('isCheckedIn')}</th>
                      <th>{t('checkInTime')}</th>
                      <th>{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guests.map((guest) => (
                      <tr
                        key={guest._id}
                        className={`participant-row ${selectedGuests.includes(guest._id) ? 'selected-row' : ''}`}
                        onClick={() => handleRowClick(guest._id)}
                      >
                        <td>{guest.firstName}</td>
                        <td>{guest.lastName}</td>
                        <td>{guest.email}</td>
                        <td>{typeof guest.guestType === 'string' ? guest.guestType : 'UNKNOWN'}</td>
                        <td className="qr-id-column">{guest.qrId}</td>
                        <td className="plus-one-count-column">{guest.guests ? guest.guests.length : 0}</td>
                        <td>{guest.responded ? t('yes') : t('no')}</td>
                        <td>{guest.willAttend ? t('yes') : t('no')}</td>
                        <td>{guest.isCheckedIn ? t('yes') : t('no')}</td>
                        <td>{guest.checkInTime ? new Date(guest.checkInTime).toLocaleString() : ''}</td>
                        <td className="action-buttons">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleAttend(guest._id);
                            }}
                            className={`btn btn-canada btn-sm ${guest.willAttend ? 'btn-not-attend' : 'btn-attend'}`}
                            title={guest.willAttend ? t('notAttend') : t('attend')}
                            disabled={isExporting}
                          >
                            <i className={`fas ${guest.willAttend ? 'fa-times' : 'fa-check'}`}></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEdit(guest);
                            }}
                            className="btn btn-canada btn-sm me-1"
                            title={t('editParticipant')}
                            disabled={isExporting}
                          >
                            <i className="fas fa-pencil-alt"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(guest._id);
                            }}
                            className="btn btn-canada btn-sm me-1"
                            title={t('delete')}
                            disabled={isExporting}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenRsvpLink(guest.qrId);
                            }}
                            className="btn btn-canada btn-sm me-1"
                            title={t('openRsvpLink')}
                            disabled={isExporting}
                          >
                            <i className="fas fa-link"></i>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenPlusOneModal(guest);
                            }}
                            className="btn btn-canada btn-sm"
                            title={t('plusOneManagement')}
                            disabled={isExporting || (guestTypeSettings[guest.guestType] === 0)}
                          >
                            <i className="fas fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination-container">
                <ReactPaginate
                  previousLabel={t('previous')}
                  nextLabel={t('next')}
                  pageCount={pageCount}
                  onPageChange={handlePageClick}
                  containerClassName="pagination justify-content-center"
                  pageClassName="page-item"
                  pageLinkClassName="page-link"
                  previousClassName="page-item"
                  previousLinkClassName="page-link"
                  nextClassName="page-item"
                  nextLinkClassName="page-link"
                  activeClassName="active"
                  disabledClassName="disabled"
                  disabled={isExporting}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {isExporting && (
        <div className="loading-overlay">
          <img src={loadingGif} alt="Yükleniyor..." className="loading-spinner" />
        </div>
      )}
    {addGuestModalOpen && (
      <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{t('addParticipant')}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={() => setAddGuestModalOpen(false)}
                disabled={isExporting}
              ></button>
            </div>
            <div className="modal-body">
              <div className="d-flex flex-column">
                <div className="mb-3">
                  <label className="form-label">{t('firstName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('firstName')}
                    value={newGuest.firstName}
                    onChange={(e) => setNewGuest({ ...newGuest, firstName: e.target.value })}
                    disabled={isExporting}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('lastName')}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={t('lastName')}
                    value={newGuest.lastName}
                    onChange={(e) => setNewGuest({ ...newGuest, lastName: e.target.value })}
                    disabled={isExporting}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('email')}</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder={t('email')}
                    value={newGuest.email}
                    onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                    disabled={isExporting}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">{t('guestType')}</label>
                  <select
                    className="form-select"
                    value={newGuest.guestType}
                    onChange={(e) => setNewGuest({ ...newGuest, guestType: e.target.value, selectedInviterId: e.target.value === 'PLUSONE' ? null : null })}
                    disabled={isExporting}
                  >
                    <option value="REGULAR">REGULAR</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="VIP">VIP</option>
                    <option value="PLUSONE">PLUSONE</option>
                  </select>
                </div>
                {newGuest.guestType === 'PLUSONE' && (
                  <div className="mb-3">
                    <label className="form-label">{t('selectInviter')}</label>
                    <Select
                      options={inviterOptions}
                      onChange={(option) => setNewGuest({ ...newGuest, selectedInviterId: option ? option.value : null })}
                      onInputChange={(input) => {
                        setInviterSearchTerm(input);
                        fetchInviters(input); // Arama her değiştiğinde uygun davet edenleri getir
                      }}
                      placeholder={t('selectInviter')}
                      isClearable
                      isSearchable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      noOptionsMessage={() => t('noInvitersAvailable')}
                      isDisabled={isExporting}
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-canada-secondary"
                onClick={() => setAddGuestModalOpen(false)}
                disabled={isExporting}
              >
                {t('cancel')}
              </button>
              <button 
                type="button" 
                className="btn btn-canada" 
                onClick={handleAddGuest}
                disabled={isExporting}
              >
                {t('add')}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
      {editGuestModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('editParticipant')}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setEditGuestModalOpen(false)}
                  disabled={isExporting}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder={t('firstName')}
                      value={editGuest.firstName}
                      onChange={(e) => setEditGuest({ ...editGuest, firstName: e.target.value })}
                      disabled={isExporting}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="text"
                      className="form-control mb-2"
                      placeholder={t('lastName')}
                      value={editGuest.lastName}
                      onChange={(e) => setEditGuest({ ...editGuest, lastName: e.target.value })}
                      disabled={isExporting}
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="email"
                      className="form-control mb-2"
                      placeholder={t('email')}
                      value={editGuest.email}
                      onChange={(e) => setEditGuest({ ...editGuest, email: e.target.value })}
                      disabled={isExporting}
                    />
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-control mb-2"
                      value={editGuest.guestType}
                      onChange={(e) => setEditGuest({ ...editGuest, guestType: e.target.value, selectedInviterId: e.target.value === 'PLUSONE' ? editGuest.selectedInviterId : null })}
                      disabled={isExporting}
                    >
                      <option value="REGULAR">REGULAR</option>
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="VIP">VIP</option>
                      <option value="PLUSONE">PLUSONE</option>
                    </select>
                  </div>
                  {editGuest.guestType === 'PLUSONE' && (
                    <div className="col-md-6">
                      <Select
                        options={inviterOptions}
                        value={inviterOptions.find((option) => option.value === editGuest.selectedInviterId) || null}
                        onChange={(option) => setEditGuest({ ...editGuest, selectedInviterId: option ? option.value : null })}
                        onInputChange={(input) => setInviterSearchTerm(input)}
                        placeholder={t('selectInviter')}
                        isClearable
                        isSearchable
                        className="react-select-container"
                        classNamePrefix="react-select"
                        noOptionsMessage={() => t('noInvitersAvailable')}
                        isDisabled={isExporting}
                      />
                    </div>
                  )}
                  {['EMPLOYEE', 'VIP'].includes(editGuest.guestType) && editGuest.plusOneQrId && editGuest.plusOneQrId !== 'NA' && (
                    <div className="col-md-12 mt-3">
                      <label className="form-label">{t('invitedGuest')}:</label>
                      <div className="d-flex align-items-center">
                        <span>{plusOneName}</span>
                        <button
                          className="btn btn-canada btn-sm ms-2"
                          onClick={() => handleRemoveInvited(editGuest._id, editGuest.plusOneQrId)}
                          disabled={isExporting}
                        >
                          {t('removeInvited')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-canada-secondary"
                  onClick={() => setEditGuestModalOpen(false)}
                  disabled={isExporting}
                >
                  {t('cancel')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-canada" 
                  onClick={handleUpdateGuest}
                  disabled={isExporting}
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={modalAction}
        message={modalMessage}
        isDisabled={isExporting}
      />
      
      <PlusOneModal
        isOpen={plusOneModalOpen}
        onClose={handleClosePlusOneModal}
        guest={selectedGuestForPlusOne}
        onUpdate={handlePlusOneUpdate}
        guestTypeSettings={guestTypeSettings}
      />

      {/* Mail Modal */}
      {showMailModal && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Mail Gönder</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowMailModal(false)}
                  disabled={sendingMail}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSendMail}>
                  <div className="row">
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Alıcı E-posta:</label>
                        <input
                          type="email"
                          name="to"
                          value={mailData.to}
                          onChange={handleMailInputChange}
                          className="form-control"
                          required
                          disabled={sendingMail}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Template Türü:</label>
                        <select
                          className="form-select"
                          value={mailTemplateType}
                          onChange={(e) => setMailTemplateType(e.target.value)}
                          disabled={sendingMail}
                        >
                          <option value="invitation">Davet</option>
                          <option value="reminder">Hatırlatma</option>
                          <option value="custom">Özel</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Konu:</label>
                    <input
                      type="text"
                      name="subject"
                      value={mailData.subject}
                      onChange={handleMailInputChange}
                      className="form-control"
                      required
                      disabled={sendingMail}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Mesaj:</label>
                    <textarea
                      name="message"
                      value={mailData.message}
                      onChange={handleMailInputChange}
                      className="form-control"
                      rows={10}
                      required
                      disabled={sendingMail}
                    />
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowMailModal(false)}
                      disabled={sendingMail}
                    >
                      İptal
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={sendingMail}
                    >
                      {sendingMail ? 'Gönderiliyor...' : 'Mail Gönder'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventSettings;