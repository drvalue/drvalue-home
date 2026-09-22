--
-- PostgreSQL database dump
-- 홈페이지 DB 여섯 테이블(Directus 시절 이름 그대로). 처음 까는 곳에서 한 번 돌린다.
-- directus_folders · directus_users 로 가는 외래키는 뺐다(그 표는 없다). 칸은 남아 있다.
--

-- Dumped from database version 10.23
-- Dumped by pg_dump version 10.23

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: directus_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.directus_files (
    id uuid NOT NULL,
    storage character varying(255) NOT NULL,
    filename_disk character varying(255),
    filename_download character varying(255) NOT NULL,
    title character varying(255),
    type character varying(255),
    folder uuid,
    uploaded_by uuid,
    created_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    modified_by uuid,
    modified_on timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    charset character varying(50),
    filesize bigint,
    width integer,
    height integer,
    duration integer,
    embed character varying(200),
    description text,
    location text,
    tags text,
    metadata json,
    focal_point_x integer,
    focal_point_y integer,
    tus_id character varying(64),
    tus_data json,
    uploaded_on timestamp with time zone
);


--
-- Name: inquiries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inquiries (
    id integer NOT NULL,
    type character varying(255) DEFAULT '기타'::character varying NOT NULL,
    status character varying(255) DEFAULT 'new'::character varying NOT NULL,
    assignee uuid,
    name character varying(255) DEFAULT NULL::character varying NOT NULL,
    email character varying(255) DEFAULT NULL::character varying,
    company character varying(255) DEFAULT NULL::character varying,
    phone character varying(255) DEFAULT NULL::character varying,
    message text NOT NULL,
    consent boolean DEFAULT false NOT NULL,
    source_path character varying(255) DEFAULT NULL::character varying,
    website character varying(255) DEFAULT NULL::character varying
);


--
-- Name: inquiries_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inquiries_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inquiries_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inquiries_id_seq OWNED BY public.inquiries.id;


--
-- Name: languages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.languages (
    code character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    direction character varying(255) DEFAULT 'ltr'::character varying NOT NULL
);


--
-- Name: posts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts (
    id integer NOT NULL,
    board character varying(255) DEFAULT NULL::character varying NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    slug character varying(255) DEFAULT NULL::character varying NOT NULL,
    published_date date NOT NULL,
    publish_at timestamp with time zone,
    unpublish_at timestamp with time zone,
    thumbnail uuid,
    is_pinned boolean DEFAULT false NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    press_media character varying(255) DEFAULT NULL::character varying,
    case_category character varying(255) DEFAULT NULL::character varying,
    period_start date,
    period_end date,
    program_status character varying(255) DEFAULT NULL::character varying,
    program_field character varying(255) DEFAULT NULL::character varying,
    program_region character varying(255) DEFAULT NULL::character varying,
    deadline date,
    en_ready boolean DEFAULT false NOT NULL,
    sort integer,
    og_image uuid,
    no_index boolean DEFAULT false NOT NULL,
    canonical character varying(255) DEFAULT NULL::character varying,
    cert_state character varying(255),
    cert_no character varying(255),
    cert_date date,
    cert_made_date date,
    cert_kind character varying(255),
    history_year character varying(255)
);


--
-- Name: posts_files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts_files (
    id integer NOT NULL,
    posts_id integer,
    directus_files_id uuid
);


--
-- Name: posts_files_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_files_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_files_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_files_id_seq OWNED BY public.posts_files.id;


--
-- Name: posts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_id_seq OWNED BY public.posts.id;


--
-- Name: posts_translations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.posts_translations (
    id integer NOT NULL,
    posts integer,
    languages_code character varying(255),
    title character varying(255),
    summary text,
    body text,
    case_category_label character varying(255),
    faq_category character varying(255),
    seo_title character varying(255),
    seo_description text
);


--
-- Name: posts_translations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.posts_translations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: posts_translations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.posts_translations_id_seq OWNED BY public.posts_translations.id;


--
-- Name: inquiries id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries ALTER COLUMN id SET DEFAULT nextval('public.inquiries_id_seq'::regclass);


--
-- Name: posts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts ALTER COLUMN id SET DEFAULT nextval('public.posts_id_seq'::regclass);


--
-- Name: posts_files id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_files ALTER COLUMN id SET DEFAULT nextval('public.posts_files_id_seq'::regclass);


--
-- Name: posts_translations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_translations ALTER COLUMN id SET DEFAULT nextval('public.posts_translations_id_seq'::regclass);


--
-- Name: directus_files directus_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.directus_files
    ADD CONSTRAINT directus_files_pkey PRIMARY KEY (id);


--
-- Name: inquiries inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (code);


--
-- Name: posts_files posts_files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_files
    ADD CONSTRAINT posts_files_pkey PRIMARY KEY (id);


--
-- Name: posts posts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);


--
-- Name: posts posts_slug_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_slug_unique UNIQUE (slug);


--
-- Name: posts_translations posts_translations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_translations
    ADD CONSTRAINT posts_translations_pkey PRIMARY KEY (id);


--
-- Name: directus_files directus_files_folder_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--



--
-- Name: directus_files directus_files_modified_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--



--
-- Name: directus_files directus_files_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--



--
-- Name: inquiries inquiries_assignee_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inquiries
    ADD CONSTRAINT inquiries_assignee_foreign FOREIGN KEY (assignee) REFERENCES public.directus_users(id) ON DELETE SET NULL;


--
-- Name: posts posts_thumbnail_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_thumbnail_foreign FOREIGN KEY (thumbnail) REFERENCES public.directus_files(id) ON DELETE SET NULL;


--
-- Name: posts_translations posts_translations_languages_code_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_translations
    ADD CONSTRAINT posts_translations_languages_code_foreign FOREIGN KEY (languages_code) REFERENCES public.languages(code) ON DELETE CASCADE;


--
-- Name: posts_translations posts_translations_posts_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.posts_translations
    ADD CONSTRAINT posts_translations_posts_foreign FOREIGN KEY (posts) REFERENCES public.posts(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

--
-- 언어. posts_translations.languages_code 가 여기를 가리킨다 — 비어 있으면 첫 저장이 막힌다.
--
INSERT INTO public.languages (code, name, direction) VALUES ('ko-KR', '한국어', 'ltr'), ('en-US', 'English', 'ltr') ON CONFLICT DO NOTHING;
