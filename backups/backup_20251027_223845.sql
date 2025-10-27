--
-- PostgreSQL database dump
--

\restrict m12QDMKoCJql8yTk7zhLII0AA5HfbW71xz9tMZ1yxs1blrjnAs7DcCNh2Bkux5W

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: invoice_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.invoice_status AS ENUM (
    'draft',
    'sent',
    'viewed',
    'partial',
    'paid',
    'overdue',
    'cancelled',
    'refunded'
);


ALTER TYPE public.invoice_status OWNER TO postgres;

--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_method AS ENUM (
    'bank_transfer',
    'credit_card',
    'paypal',
    'cash',
    'check',
    'other'
);


ALTER TYPE public.payment_method OWNER TO postgres;

--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'completed',
    'failed',
    'refunded'
);


ALTER TYPE public.payment_status OWNER TO postgres;

--
-- Name: recurrence_frequency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.recurrence_frequency AS ENUM (
    'weekly',
    'biweekly',
    'monthly',
    'quarterly',
    'yearly'
);


ALTER TYPE public.recurrence_frequency OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: clients; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.clients (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    name text NOT NULL,
    email text NOT NULL,
    company text,
    phone text,
    website text,
    address text,
    tax_id text,
    payment_terms integer DEFAULT 30,
    currency text DEFAULT 'EUR'::text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.clients OWNER TO postgres;

--
-- Name: invoices; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    user_id character varying,
    client_id character varying NOT NULL,
    date timestamp without time zone DEFAULT now() NOT NULL,
    order_number text,
    project_number text,
    for_project text,
    status text DEFAULT 'draft'::text NOT NULL,
    notes text,
    subtotal numeric(10,2) NOT NULL,
    tax numeric(10,2) DEFAULT '0'::numeric NOT NULL,
    tax_rate numeric(5,2) DEFAULT '0'::numeric NOT NULL,
    total numeric(10,2) NOT NULL
);


ALTER TABLE public.invoices OWNER TO postgres;

--
-- Name: line_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.line_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_id character varying NOT NULL,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL,
    price numeric(10,2) NOT NULL,
    amount numeric(10,2) NOT NULL
);


ALTER TABLE public.line_items OWNER TO postgres;

--
-- Name: services; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.services (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    name text NOT NULL,
    description text,
    category text,
    price numeric(10,2) NOT NULL,
    unit text DEFAULT 'item'::text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.services OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    username text,
    password text,
    provider text DEFAULT 'local'::text,
    provider_id text,
    is_email_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.clients (id, user_id, name, email, company, phone, website, address, tax_id, payment_terms, currency, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.invoices (id, invoice_number, user_id, client_id, date, order_number, project_number, for_project, status, notes, subtotal, tax, tax_rate, total) FROM stdin;
\.


--
-- Data for Name: line_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.line_items (id, invoice_id, description, quantity, price, amount) FROM stdin;
\.


--
-- Data for Name: services; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.services (id, user_id, name, description, category, price, unit, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, username, password, provider, provider_id, is_email_verified, created_at, updated_at) FROM stdin;
b30e8620-6863-4576-879c-95353730c7ec	demo@example.com	demo	$2b$10$auXz0N7O3zTNaNoA2DpqxeF7p2M4OwzaefnAutG8rnzRMuC5wGWqa	local	\N	f	2025-10-27 20:25:43.814474	2025-10-27 20:25:43.814474
\.


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: line_items line_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_items
    ADD CONSTRAINT line_items_pkey PRIMARY KEY (id);


--
-- Name: services services_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: clients clients_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: invoices invoices_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE RESTRICT;


--
-- Name: invoices invoices_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: line_items line_items_invoice_id_invoices_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.line_items
    ADD CONSTRAINT line_items_invoice_id_invoices_id_fk FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;


--
-- Name: services services_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.services
    ADD CONSTRAINT services_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict m12QDMKoCJql8yTk7zhLII0AA5HfbW71xz9tMZ1yxs1blrjnAs7DcCNh2Bkux5W

