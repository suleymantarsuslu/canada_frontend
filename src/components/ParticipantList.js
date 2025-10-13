import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import { useTranslation } from 'react-i18next';
import ParticipantForm from './ParticipantForm';
import SearchBar from './SearchBar';
import ConfirmModal from './ConfirmModal';
import ParticipantsReport from './ParticipantsReport';
import * as XLSX from 'xlsx';

const ParticipantList = () => {
  const { t } = useTranslation();
  const [guests, setGuests] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editGuest, setEditGuest] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGuests, setSelectedGuests] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalAction, setConfirmModalAction] = useState(() => () => {});
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [totalGuests, setTotalGuests] = useState(0);
  const [allGuests, setAllGuests] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [selectedGuestType, setSelectedGuestType] = useState('ALL GUESTS');

  const reportRef = useRef(null);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const lineChartRef = useRef(null);
  const donutChartRef = useRef(null);

  // Stats state
  const [stats, setStats] = useState({
    willAttendCount: 0,
    checkedInCount: 0,
    notCheckedInCount: 0,
    respondedCount: 0,
    guestTypeCounts: { EMPLOYEE: 0, REGULAR: 0, VIP: 0, PLUSONE: 0 },
  });

  const fetchGuests = async (page, search) => {
    try {
      const response = await axios.get(`https://api.canada-ankara.com/api/admin/guests`, {
        params: { page: page + 1, limit: 10, search, attending: true },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('API Yanıtı (Sayfalı):', response.data);
      console.log('count Değeri:', response.data.count);

      setGuests(response.data.guests || []);
      setPageCount(response.data.totalPages || 0);
    } catch (error) {
      console.error('Hata Detayları:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(`${t('error')}: ${error.response?.data?.message || t('guestsFetchFailed')}`);
      setGuests([]);
    }
  };

  const fetchTotalGuests = async () => {
    try {
      const response = await axios.get(`https://api.canada-ankara.com/api/admin/guests`, {
        params: { limit: 'all', attending: true },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('WillAttend Katılımcı Sayısı Yanıtı:', response.data);
      setTotalGuests(response.data.count || response.data.guests?.length || 0);
    } catch (error) {
      console.error('WillAttend katılımcı sayısı alınamadı:', error);
      setTotalGuests(0);
    }
  };

  const fetchAllGuestsForReport = async () => {
    try {
      const response = await axios.get(`https://api.canada-ankara.com/api/admin/guests`, {
        params: { limit: 'all' },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Tüm Katılımcı Yanıtı:', response.data);
      setAllGuests(response.data.guests || []);
    } catch (error) {
      console.error('Tüm katılımcılar alınamadı:', error);
      setAllGuests([]);
    }
  };

  useEffect(() => {
    fetchGuests(currentPage, searchTerm);
    fetchTotalGuests();
    fetchAllGuestsForReport();
  }, [currentPage, searchTerm]);

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleDelete = (id) => {
    setIsConfirmModalOpen(true);
    setConfirmModalAction(() => () => {
      axios
        .delete(`https://api.canada-ankara.com/api/admin/guests/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then(() => {
          fetchGuests(currentPage, searchTerm);
          fetchTotalGuests();
          fetchAllGuestsForReport();
          setIsConfirmModalOpen(false);
          alert(t('deleteSuccess'));
        })
        .catch((error) => {
          alert(`${t('error')}: ${error.response?.data?.message || t('deleteFailed')}`);
          setIsConfirmModalOpen(false);
        });
    });
  };

  const handleBulkDelete = () => {
    if (selectedGuests.length === 0) return;
    setIsConfirmModalOpen(true);
    setConfirmModalAction(() => confirmBulkDelete);
  };

  const confirmBulkDelete = async () => {
    try {
      await Promise.all(
        selectedGuests.map(id =>
          axios.delete(`https://api.canada-ankara.com/api/admin/guests/${id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          })
        )
      );
      fetchGuests(currentPage, searchTerm);
      fetchTotalGuests();
      fetchAllGuestsForReport();
      setSelectedGuests([]);
      alert(t('bulkDeleteSuccess'));
    } catch (error) {
      alert(`${t('error')}: ${error.response?.data?.message || t('bulkDeleteFailed')}`);
    } finally {
      setIsConfirmModalOpen(false);
    }
  };

  const handleRowClick = (id) => {
    setSelectedGuests(prev =>
      prev.includes(id)
        ? prev.filter(selectedId => selectedId !== id)
        : [...prev, id]
    );
  };

  const handleEdit = (guest) => {
    setEditGuest(guest);
    setIsModalOpen(true);
  };

  const handleExportToExcel = () => {
    const filteredGuests = selectedGuestType === 'ALL GUESTS'
      ? allGuests
      : allGuests.filter(guest => guest.guestType === selectedGuestType);

    const data = filteredGuests.map(g => ({
      [t('firstName')]: g.firstName,
      [t('lastName')]: g.lastName,
      [t('email')]: g.email,
      [t('qrId')]: g.qrId,
      [t('plusOneCount')]: g.guests ? g.guests.length : 0,
      [t('guestType')]: g.guestType,
      [t('willAttend')]: g.willAttend ? t('yes') : t('no'),
      [t('isCheckedIn')]: g.isCheckedIn ? t('yes') : t('no'),
      [t('checkInTime')]: g.checkInTime ? new Date(g.checkInTime).toLocaleString() : t('none'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Guests');
    XLSX.writeFile(wb, `Guests_${selectedGuestType}.xlsx`);
    setIsExportModalOpen(false);
  };



  return (
    <div className="container-custom mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">{t('participants')} ({totalGuests})</h4>
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
                  <button onClick={() => setIsExportModalOpen(true)} className="btn btn-canada me-2">
                    {t('exportToExcel')}
                  </button>
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className="btn btn-canada me-2"
                  >
                    {t('generateReport')}
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
                      <th>{t('qrId')}</th>
                      <th>{t('plusOneCount')}</th>
                      <th>{t('guestType')}</th>
                      <th>{t('willAttend')}</th>
                      <th>{t('isCheckedIn')}</th>
                      <th>{t('checkInTime')}</th>
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
                        <td>{guest.qrId}</td>
                        <td>{guest.guests ? guest.guests.length : 0}</td>
                        <td>{typeof guest.guestType === 'string' ? guest.guestType : 'UNKNOWN'}</td>
                        <td>{guest.willAttend ? t('yes') : t('no')}</td>
                        <td>{guest.isCheckedIn ? t('yes') : t('no')}</td>
                        <td>
                          {guest.checkInTime
                            ? new Date(guest.checkInTime).toLocaleString()
                            : t('none')}
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
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editGuest ? t('editParticipant') : t('addParticipant')}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <ParticipantForm
                  onSuccess={() => {
                    setIsModalOpen(false);
                    setEditGuest(null);
                    fetchGuests(currentPage, searchTerm);
                    fetchTotalGuests();
                    fetchAllGuestsForReport();
                  }}
                  editParticipant={editGuest}
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-canada-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  {t('close_button')}
                </button>
                <button type="submit" form="participantForm" className="btn btn-canada">
                  {editGuest ? t('save') : t('addParticipant')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isExportModalOpen && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{t('exportToExcel')}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsExportModalOpen(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="guestTypeSelect" className="form-label">{t('selectGuestType')}</label>
                  <select
                    id="guestTypeSelect"
                    className="form-select"
                    value={selectedGuestType}
                    onChange={(e) => setSelectedGuestType(e.target.value)}
                  >
                    <option value="ALL GUESTS">{t('allGuests')}</option>
                    <option value="EMPLOYEE">{t('employee')}</option>
                    <option value="VIP">{t('vip')}</option>
                    <option value="PLUSONE">{t('plusOne')}</option>
                    <option value="REGULAR">{t('regular')}</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-canada-secondary"
                  onClick={() => setIsExportModalOpen(false)}
                >
                  {t('close_button')}
                </button>
                <button
                  type="button"
                  className="btn btn-canada"
                  onClick={handleExportToExcel}
                >
                  {t('export')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmModalAction || (() => {})}
        message={t('confirmDeleteParticipant')}
      />
      <ParticipantsReport
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        guests={allGuests}
        stats={stats}
        setStats={setStats}
        pieChartRef={pieChartRef}
        barChartRef={barChartRef}
        lineChartRef={lineChartRef}
        donutChartRef={donutChartRef}
        reportRef={reportRef}
      />
    </div>
  );
};

export default ParticipantList;