import { Building2, Mail, MapPin, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDoctorClinics } from '../../api/clinics';

function DoctorDashboardPage() {
  const {
    data: clinicsRes,
    isLoading,
  } = useQuery({
    queryKey: ['clinics'],
    queryFn: getDoctorClinics,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
    refetchOnWindowFocus: false,
  });

  const clinics = clinicsRes?.data || [];

  return (
    <section className="doctor-page-luxe">
      <article className="doctor-card doctor-intro-card">
        <div className="doctor-intro-icon" aria-hidden="true">
          <Building2 size={16} />
        </div>
        <h3>Doctor Dashboard</h3>
        <p>Overview of your registered clinics and contact details used in prescription headers.</p>
        <div className="doctor-chip-row">
          <span>{clinics.length} Clinics</span>
        </div>
      </article>

      <article className="doctor-card">
        <div className="panel-head">
          <h3>Your Clinics</h3>
          <span className="luxe-subtle-count">{clinics.length} items</span>
        </div>

        {isLoading ? <p className="muted">Loading clinics...</p> : null}

        {!isLoading && clinics.length === 0 ? (
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
              </article>
            ))}
          </div>
        ) : null}
      </article>
    </section>
  );
}

export default DoctorDashboardPage;
