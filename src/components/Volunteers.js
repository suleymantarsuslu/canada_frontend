import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReactPaginate from 'react-paginate';
import { useTranslation } from 'react-i18next';
import SearchBar from './SearchBar';
import * as XLSX from 'xlsx';

const Volunteers = () => {
  const { t } = useTranslation();
  const [volunteers, setVolunteers] = useState([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalVolunteers, setTotalVolunteers] = useState(0);
  const [allVolunteers, setAllVolunteers] = useState([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const fetchVolunteers = async (page, search) => {
    try {
      const response = await axios.get(`https://backend.canada-ankara.com/api/admin/guests`, {
        params: { page: page + 1, limit: 10, search, volunteer: true },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Volunteers API Yanıtı:', response.data);

      setVolunteers(response.data.guests || []);
      setPageCount(response.data.totalPages || 0);
    } catch (error) {
      console.error('Hata Detayları:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      alert(`${t('error')}: ${error.response?.data?.message || t('volunteersFetchFailed')}`);
      setVolunteers([]);
    }
  };

  const fetchTotalVolunteers = async () => {
    try {
      const response = await axios.get(`https://backend.canada-ankara.com/api/admin/guests`, {
        params: { limit: 'all', volunteer: true },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      console.log('Toplam Volunteer Sayısı:', response.data);
      setTotalVolunteers(response.data.count || response.data.guests?.length || 0);
      setAllVolunteers(response.data.guests || []);
    } catch (error) {
      console.error('Toplam volunteer sayısı alınamadı:', error);
      setTotalVolunteers(0);
      setAllVolunteers([]);
    }
  };

  useEffect(() => {
    fetchVolunteers(currentPage, searchTerm);
    fetchTotalVolunteers();
  }, [currentPage, searchTerm]);

  const handlePageClick = (data) => {
    setCurrentPage(data.selected);
  };

  const handleExportToExcel = () => {
    const data = allVolunteers.map(v => ({
      [t('firstName')]: v.firstName,
      [t('lastName')]: v.lastName,
      [t('email')]: v.email,
      [t('qrId')]: v.qrId,
      [t('guestType')]: v.guestType,
      [t('volunteerFields')]: v.volunteerFields ? v.volunteerFields.join(', ') : '',
      [t('willAttend')]: v.willAttend ? t('yes') : t('no'),
      [t('isCheckedIn')]: v.isCheckedIn ? t('yes') : t('no'),
      [t('checkInTime')]: v.checkInTime ? new Date(v.checkInTime).toLocaleString() : t('none'),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Volunteers');
    XLSX.writeFile(wb, 'Volunteers.xlsx');
    setIsExportModalOpen(false);
  };

  return (
    <div className="container-custom mt-5">
      <div className="row justify-content-center">
        <div className="col-md-10">
          <div className="card">
            <div className="card-body">
              <h4 className="card-title">{t('volunteers')} ({totalVolunteers})</h4>
              <div className="filter-container d-flex align-items-center">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                <div className="ms-auto d-flex">
                  <button onClick={() => setIsExportModalOpen(true)} className="btn btn-canada me-2">
                    {t('exportToExcel')}
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
                      <th>{t('guestType')}</th>
                      <th>{t('volunteerFields')}</th>
                      <th>{t('willAttend')}</th>
                      <th>{t('isCheckedIn')}</th>
                      <th>{t('checkInTime')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volunteers.map((volunteer) => (
                      <tr key={volunteer._id}>
                        <td>{volunteer.firstName}</td>
                        <td>{volunteer.lastName}</td>
                        <td>{volunteer.email}</td>
                        <td>{volunteer.qrId}</td>
                        <td>{typeof volunteer.guestType === 'string' ? volunteer.guestType : 'UNKNOWN'}</td>
                        <td>{volunteer.volunteerFields ? volunteer.volunteerFields.join(', ') : ''}</td>
                        <td>{volunteer.willAttend ? t('yes') : t('no')}</td>
                        <td>{volunteer.isCheckedIn ? t('yes') : t('no')}</td>
                        <td>
                          {volunteer.checkInTime
                            ? new Date(volunteer.checkInTime).toLocaleString()
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
                <p>{t('exportVolunteersMessage') || 'Volunteer listesini Excel dosyası olarak indirmek istediğinizden emin misiniz?'}</p>
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
    </div>
  );
};

export default Volunteers;

