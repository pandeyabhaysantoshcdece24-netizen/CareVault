import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Building2, Mail, MapPin, PencilLine, Phone, Trash2 } from 'lucide-react';
import { createClinic, deleteClinic, getDoctorClinics, updateClinic, uploadClinicLogo } from '../../api/clinics';

const INITIAL_FORM = {
  clinicName: '',
  address: '',
  logoURL: '',
  email: '',
  phone: '',
};

function toFriendlyMessage(error, fallback) {
  if (error?.message && typeof error.message === 'string') return error.message;

  const status = error?.response?.status;
  const code = error?.response?.data?.error?.code;

  if (status === 400 || code === 'VALIDATION_ERROR') return 'Please check clinic details and try again.';
  if (status === 403 || code === 'FORBIDDEN') return 'Clinic management is available after doctor verification.';
  if (status === 409 || code === 'CONFLICT') return 'A clinic with the same name and address already exists.';
  return fallback;
}

function DoctorClinicsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(INITIAL_FORM);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [notice, setNotice] = useState({ type: '', text: '' });
  const logoInputRef = useRef(null);

  const {
    data: clinicsRes,
    isLoading: loading,
    isFetching: refreshing,
    error: loadError,
  } = useQuery({
    queryKey: ['clinics'],
    queryFn: getDoctorClinics,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const clinics = clinicsRes?.data || [];

  const createClinicMutation = useMutation({
    mutationFn: createClinic,
  });

  const updateClinicMutation = useMutation({
    mutationFn: ({ id, payload }) => updateClinic(id, payload),
  });

  const deleteClinicMutation = useMutation({
    mutationFn: deleteClinic,
  });

  useEffect(() => {
    if (!loadError) return;
    setNotice({ type: 'error', text: toFriendlyMessage(loadError, 'Unable to load clinics right now.') });
  }, [loadError]);

  const saving = createClinicMutation.isPending || updateClinicMutation.isPending || uploadingLogo;

  useEffect(() => {
    if (!logoFile) {
      setLogoPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(logoFile);
    setLogoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [logoFile]);

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setLogoFile(null);
    setLogoPreviewUrl('');
    setEditingId('');
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const onLogoFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    if (!nextFile) {
      setLogoFile(null);
      return;
    }

    if (!String(nextFile.type || '').startsWith('image/')) {
      setNotice({ type: 'error', text: 'Please select a valid image file for clinic logo.' });
      event.target.value = '';
      setLogoFile(null);
      return;
    }

    if (nextFile.size > 5 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Clinic logo must be 5 MB or smaller.' });
      event.target.value = '';
      setLogoFile(null);
      return;
    }

    setNotice({ type: '', text: '' });
    setLogoFile(nextFile);
  };

  const clearSelectedLogo = () => {
    setLogoFile(null);
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setNotice({ type: '', text: '' });

    try {
      let logoURL = String(form.logoURL || '').trim();

      if (logoFile) {
        setUploadingLogo(true);
        logoURL = await uploadClinicLogo(logoFile);
      }

      const payload = {
        ...form,
        logoURL,
      };

      if (editingId) {
        await updateClinicMutation.mutateAsync({ id: editingId, payload });
        setNotice({ type: 'success', text: 'Clinic updated successfully.' });
      } else {
        await createClinicMutation.mutateAsync(payload);
        setNotice({ type: 'success', text: 'Clinic added successfully.' });
      }
      resetForm();
      await queryClient.invalidateQueries({ queryKey: ['clinics'] });
    } catch (e) {
      setNotice({ type: 'error', text: toFriendlyMessage(e, 'Unable to save clinic right now.') });
    } finally {
      setUploadingLogo(false);
    }
  };

  const onDeleteClinic = async (id) => {
    const confirmed = window.confirm('Delete this clinic? This action cannot be undone.');
    if (!confirmed) {
      return;
    }

    setDeletingId(id);
    setNotice({ type: '', text: '' });

    try {
      await deleteClinicMutation.mutateAsync(id);
      if (editingId === id) {
        resetForm();
      }
      setNotice({ type: 'success', text: 'Clinic deleted successfully.' });
      await queryClient.invalidateQueries({ queryKey: ['clinics'] });
    } catch (e) {
      setNotice({ type: 'error', text: toFriendlyMessage(e, 'Unable to delete clinic right now.') });
    } finally {
      setDeletingId('');
    }
  };

  return (
    <section className="doctor-page-luxe">
      <article className="doctor-card">
        <div className="panel-head">
          <h3>{editingId ? 'Update Clinic' : 'Add New Clinic'}</h3>
          <span className="luxe-pill-tag">Practice Setup</span>
        </div>

        <p className="patient-inline-note">
          Keep clinic details current so patient communication and emergency handoffs remain accurate.
        </p>

        <form className="doctor-form-grid" onSubmit={onSubmit}>
          <label>
            Clinic Name
            <input
              value={form.clinicName}
              onChange={(e) => setForm((prev) => ({ ...prev, clinicName: e.target.value }))}
              required
            />
          </label>

          <label>
            Contact Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              required
            />
          </label>

          <label>
            Address
            <input
              value={form.address}
              onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
              required
            />
          </label>

          <label>
            Contact Phone
            <input
              value={form.phone}
              onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
              required
            />
          </label>

          <label className="doctor-form-full">
            Clinic Logo (recommended)
            <div className="clinic-logo-upload-row">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={onLogoFileChange}
                disabled={saving}
              />
              {logoFile ? (
                <button type="button" className="patient-secondary-btn" onClick={clearSelectedLogo} disabled={saving}>
                  Remove
                </button>
              ) : null}
            </div>
            <small className="clinic-logo-help">Upload PNG/JPG/WebP up to 5 MB. The image is stored in Supabase Storage.</small>
            {(logoPreviewUrl || form.logoURL) ? (
              <img
                src={logoPreviewUrl || form.logoURL}
                alt="Clinic logo preview"
                className="clinic-logo-preview"
              />
            ) : null}
          </label>

          <label className="doctor-form-full">
            Logo URL (optional fallback)
            <input
              value={form.logoURL}
              onChange={(e) => setForm((prev) => ({ ...prev, logoURL: e.target.value }))}
              placeholder="Used only if no file is uploaded"
            />
          </label>

          <div className="doctor-form-actions">
            <button className="submit-btn slim" type="submit" disabled={saving}>
              {saving ? (uploadingLogo ? 'Uploading logo...' : 'Saving...') : editingId ? 'Update Clinic' : 'Add Clinic'}
            </button>
            {editingId ? (
              <button className="patient-secondary-btn" type="button" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </article>

      <article className="doctor-card">
        <div className="panel-head">
          <h3>Clinics</h3>
          <span className="luxe-subtle-count">
            {clinics.length} items{refreshing ? ' (refreshing...)' : ''}
          </span>
        </div>

        {loading ? <p className="muted">Loading clinics...</p> : null}

        {!loading && clinics.length === 0 ? (
          <div className="luxe-empty-mini">
            <Building2 size={18} />
            <p>No clinics added yet.</p>
          </div>
        ) : null}

        {clinics.length > 0 ? (
          <div className="clinic-records-grid">
            {clinics.map((clinic) => (
              <article key={clinic.id} className="clinic-record-card">
                <div className="clinic-record-head">
                  {clinic.logo_url ? (
                    <img
                      src={clinic.logo_url}
                      alt={`${clinic.clinic_name || 'Clinic'} logo`}
                      className="clinic-record-logo"
                      loading="lazy"
                    />
                  ) : (
                    <div className="clinic-record-icon clinic-record-icon-fallback" aria-hidden="true">
                      {(clinic.clinic_name || 'C').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h4>{clinic.clinic_name}</h4>
                    <p>Practice Location</p>
                  </div>
                </div>

                <div className="clinic-contact-list">
                  <p><MapPin size={13} /> {clinic.address || '-'}</p>
                  <p><Mail size={13} /> {clinic.email || '-'}</p>
                  <p><Phone size={13} /> {clinic.phone || '-'}</p>
                </div>

                <div className="clinic-record-actions">
                  <button
                    type="button"
                    className="clinic-action-btn"
                    onClick={() => {
                      setEditingId(clinic.id);
                      setLogoFile(null);
                      if (logoInputRef.current) {
                        logoInputRef.current.value = '';
                      }
                      setForm({
                        clinicName: clinic.clinic_name || '',
                        address: clinic.address || '',
                        logoURL: clinic.logo_url || '',
                        email: clinic.email || '',
                        phone: clinic.phone || '',
                      });
                    }}
                  >
                    <PencilLine size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className="clinic-action-btn danger"
                    onClick={() => onDeleteClinic(clinic.id)}
                    disabled={deletingId === clinic.id}
                  >
                    <Trash2 size={14} /> {deletingId === clinic.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </article>

      {notice.text ? (
        <p className={notice.type === 'error' ? 'patient-soft-error' : 'patient-soft-success'}>
          {notice.type === 'error' ? <AlertTriangle size={14} /> : null}
          {notice.text}
        </p>
      ) : null}
    </section>
  );
}

export default DoctorClinicsPage;
