-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'access_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.access_status AS ENUM ('active', 'expired');
  ELSE
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON t.oid = e.enumtypid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE t.typname = 'access_status' AND n.nspname = 'public' AND e.enumlabel = 'expired'
    ) THEN
      ALTER TYPE public.access_status ADD VALUE 'expired';
    END IF;
  END IF;
END$$;

CREATE TABLE public.access_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL,
  status USER-DEFINED DEFAULT 'active'::access_status,
  expires_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT access_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT access_permissions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT access_permissions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);
CREATE TABLE public.active_medication (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  dosage text NOT NULL,
  prescibed_for text NOT NULL,
  prescibed_at date NOT NULL,
  prescribed_by uuid,
  patient_id uuid,
  doctor_name text,
  CONSTRAINT active_medication_pkey PRIMARY KEY (id),
  CONSTRAINT active_prescription_prescribed_by_fkey FOREIGN KEY (prescribed_by) REFERENCES public.doctors(id),
  CONSTRAINT active_medication_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
CREATE TABLE public.allergies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  allergen text NOT NULL,
  severity USER-DEFINED NOT NULL,
  CONSTRAINT allergies_pkey PRIMARY KEY (id),
  CONSTRAINT allergies_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
CREATE TABLE public.chronic_conditions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  condition_name text NOT NULL,
  status USER-DEFINED NOT NULL,
  diagnosed_date date,
  CONSTRAINT chronic_conditions_pkey PRIMARY KEY (id),
  CONSTRAINT chronic_conditions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
CREATE TABLE public.clinics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL,
  clinic_name text NOT NULL,
  address text NOT NULL,
  logo_url text,
  email text NOT NULL,
  phone text NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT clinics_pkey PRIMARY KEY (id),
  CONSTRAINT clinics_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);
CREATE TABLE public.consultations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  doctor_id uuid,
  consultation_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  status USER-DEFINED DEFAULT 'in_progress'::consultation_status,
  updated_at timestamp without time zone DEFAULT now(),
  CONSTRAINT consultations_pkey PRIMARY KEY (id),
  CONSTRAINT consultations_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT consultations_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);
CREATE TABLE public.doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  full_name text NOT NULL,
  license_number text NOT NULL UNIQUE,
  specialization text,
  is_verified boolean DEFAULT false,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT doctors_pkey PRIMARY KEY (id),
  CONSTRAINT doctors_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.emergency_info (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  patient_id uuid,
  contact_name text NOT NULL,
  contact_phone text NOT NULL,
  contact_relationship text,
  contact_email text NOT NULL,
  CONSTRAINT emergency_info_pkey PRIMARY KEY (id),
  CONSTRAINT emergency_info_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id)
);
CREATE TABLE public.patients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  health_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  date_of_birth date,
  gender USER-DEFINED,
  blood_group text,
  CONSTRAINT patients_pkey PRIMARY KEY (id),
  CONSTRAINT patients_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.prescription_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  prescription_id uuid,
  drug_name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  duration_days integer NOT NULL,
  CONSTRAINT prescription_items_pkey PRIMARY KEY (id),
  CONSTRAINT prescription_items_prescription_id_fkey FOREIGN KEY (prescription_id) REFERENCES public.prescriptions(id)
);
CREATE TABLE public.prescriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  consultation_id uuid UNIQUE,
  patient_id uuid,
  doctor_id uuid,
  issued_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  doctor_notes text,
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_consultation_id_fkey FOREIGN KEY (consultation_id) REFERENCES public.consultations(id),
  CONSTRAINT prescriptions_patient_id_fkey FOREIGN KEY (patient_id) REFERENCES public.patients(id),
  CONSTRAINT prescriptions_doctor_id_fkey FOREIGN KEY (doctor_id) REFERENCES public.doctors(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  phone text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role USER-DEFINED NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);