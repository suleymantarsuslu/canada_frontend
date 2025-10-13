import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const PlusOneModal = ({ isOpen, onClose, guest, onUpdate, guestTypeSettings }) => {
  const { t } = useTranslation();
  const [plusOnes, setPlusOnes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPlusOne, setNewPlusOne] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [editingPlusOne, setEditingPlusOne] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  // Calculate max allowed plus ones for this guest type
  const maxPlusOnes = guestTypeSettings && guest && guestTypeSettings[guest.guestType] !== undefined
    ? guestTypeSettings[guest.guestType]
    : 0;
  const plusOneLimitReached = plusOnes.length >= maxPlusOnes;

  useEffect(() => {
    if (isOpen && guest) {
      fetchPlusOnes();
    }
  }, [isOpen, guest]);

  const fetchPlusOnes = async () => {
    if (!guest) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`https://api.canada-ankara.com/api/admin/guests/${guest._id}/plusones`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setPlusOnes(response.data.plusOnes || []);
    } catch (error) {
      console.error('Plus ones fetch error:', error);
      alert(t('error') + ': ' + (error.response?.data?.message || t('plusOnesFetchFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleAddPlusOne = async (e) => {
    e.preventDefault();
    if (!newPlusOne.firstName || !newPlusOne.lastName || !newPlusOne.email) {
      alert(t('empty_fields'));
      return;
    }

    setLoading(true);
    try {
      await axios.post(`https://api.canada-ankara.com/api/admin/guests/${guest._id}/plusones`, newPlusOne, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      setNewPlusOne({ firstName: '', lastName: '', email: '' });
      setShowAddForm(false);
      fetchPlusOnes();
      if (onUpdate) onUpdate();
      alert(t('plusOneAdded'));
    } catch (error) {
      console.error('Add plus one error:', error);
      alert(t('error') + ': ' + (error.response?.data?.message || t('plusOneAddFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlusOne = async (e) => {
    e.preventDefault();
    if (!editingPlusOne.firstName || !editingPlusOne.lastName || !editingPlusOne.email) {
      alert(t('empty_fields'));
      return;
    }

    setLoading(true);
    try {
      await axios.put(`https://api.canada-ankara.com/api/admin/guests/${guest._id}/plusones/${editingPlusOne.qrId}`, {
        firstName: editingPlusOne.firstName,
        lastName: editingPlusOne.lastName,
        email: editingPlusOne.email
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      setEditingPlusOne(null);
      fetchPlusOnes();
      if (onUpdate) onUpdate();
      alert(t('plusOneUpdated'));
    } catch (error) {
      console.error('Update plus one error:', error);
      alert(t('error') + ': ' + (error.response?.data?.message || t('plusOneUpdateFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlusOne = async (qrId) => {
    if (!window.confirm(t('confirmDelete'))) return;

    setLoading(true);
    try {
      await axios.delete(`https://api.canada-ankara.com/api/admin/guests/${guest._id}/plusones/${qrId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      
      fetchPlusOnes();
      if (onUpdate) onUpdate();
      alert(t('plusOneDeleted'));
    } catch (error) {
      console.error('Delete plus one error:', error);
      alert(t('error') + ': ' + (error.response?.data?.message || t('plusOneDeleteFailed')));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plusOne) => {
    setEditingPlusOne({ ...plusOne });
  };

  const handleCancelEdit = () => {
    setEditingPlusOne(null);
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {t('plusOneManagement')} - {guest?.firstName} {guest?.lastName}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              disabled={loading}
            ></button>
          </div>
          <div className="modal-body">
            {loading && (
              <div className="text-center mb-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">{t('loading')}</span>
                </div>
              </div>
            )}

            {/* Add New Plus One Form */}
            {!showAddForm ? (
              <button
                className="btn btn-canada mb-3"
                onClick={() => setShowAddForm(true)}
                disabled={loading || plusOneLimitReached}
              >
                <i className="fas fa-plus me-2"></i>
                {t('addPlusOne')}
              </button>
            ) : (
              <div className="card mb-3">
                <div className="card-header">
                  <h6 className="mb-0">{t('addPlusOne')}</h6>
                </div>
                <div className="card-body">
                  <form onSubmit={handleAddPlusOne}>
                    <div className="row">
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder={t('firstName')}
                          value={newPlusOne.firstName}
                          onChange={(e) => setNewPlusOne({ ...newPlusOne, firstName: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="text"
                          className="form-control mb-2"
                          placeholder={t('lastName')}
                          value={newPlusOne.lastName}
                          onChange={(e) => setNewPlusOne({ ...newPlusOne, lastName: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                      <div className="col-md-4">
                        <input
                          type="email"
                          className="form-control mb-2"
                          placeholder={t('email')}
                          value={newPlusOne.email}
                          onChange={(e) => setNewPlusOne({ ...newPlusOne, email: e.target.value })}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="submit" className="btn btn-canada" disabled={loading}>
                        {t('save')}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowAddForm(false);
                          setNewPlusOne({ firstName: '', lastName: '', email: '' });
                        }}
                        disabled={loading}
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Plus Ones List */}
            <div className="table-responsive">
              <table className="table table-dark table-striped">
                <thead>
                  <tr>
                    <th>{t('firstName')}</th>
                    <th>{t('lastName')}</th>
                    <th>{t('email')}</th>
                    <th>{t('qrId')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {plusOnes.map((plusOne, index) => (
                    <tr key={plusOne.qrId || index}>
                      {/* Remove inline editing logic, just show values */}
                      <td>{plusOne.firstName}</td>
                      <td>{plusOne.lastName}</td>
                      <td>{plusOne.email}</td>
                      <td>{plusOne.qrId}</td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleDeletePlusOne(plusOne.qrId)}
                            disabled={loading}
                            title={t('delete')}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {plusOnes.length === 0 && !loading && (
              <div className="text-center text-muted">
                <p>{t('noPlusOnes')}</p>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlusOneModal; 