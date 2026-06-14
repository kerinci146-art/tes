-- ============================================================
-- Kas Petani — Database Schema (MySQL 8.0+)
-- Phase 2 (Full System). Phase 1 frontend memakai mock JSON.
-- ============================================================
CREATE DATABASE IF NOT EXISTS kas_petani CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kas_petani;

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    role ENUM('superadmin', 'admin', 'user') NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT TRUE,
    is_locked BOOLEAN DEFAULT FALSE,
    locked_until DATETIME,
    force_change_password BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    full_name VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE workers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    admin_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

CREATE TABLE daily_kas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    worker_id INT NOT NULL,
    work_date DATE NOT NULL,
    workplace VARCHAR(255) NOT NULL,
    kas_masuk DECIMAL(15,2) DEFAULT 0,
    kas_keluar DECIMAL(15,2) DEFAULT 0,
    pinjaman DECIMAL(15,2) DEFAULT 0,
    total_kas DECIMAL(15,2) GENERATED ALWAYS AS (kas_masuk - kas_keluar) STORED,
    total_pinjaman DECIMAL(15,2) DEFAULT 0,
    return_date DATE,
    notes TEXT,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE jobs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    work_date DATE NOT NULL,
    needed_workers INT NOT NULL DEFAULT 1,
    description TEXT,
    status ENUM('open', 'closed', 'completed') DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id)
);

CREATE TABLE job_registrations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    job_id INT NOT NULL,
    user_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_registration (job_id, user_id)
);

CREATE TABLE loans (
    id INT PRIMARY KEY AUTO_INCREMENT,
    worker_id INT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    status ENUM('active', 'paid', 'installment') DEFAULT 'active',
    paid_amount DECIMAL(15,2) DEFAULT 0,
    due_date DATE,
    paid_at DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES workers(id)
);

CREATE TABLE gallery (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255),
    image_url VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    author_id INT NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE TABLE settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    theme ENUM('light', 'dark') DEFAULT 'light',
    language ENUM('id', 'en') DEFAULT 'id',
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE security_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username_attempt VARCHAR(100),
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    user_agent TEXT,
    attempt_time DATETIME,
    attempt_status ENUM('success', 'failed', 'locked', 'banned'),
    failure_count INT,
    lock_until DATETIME,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_until DATETIME,
    ban_permanent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE banned_devices (
    id INT PRIMARY KEY AUTO_INCREMENT,
    ip_address VARCHAR(45),
    device_fingerprint VARCHAR(255),
    ban_reason TEXT,
    banned_at DATETIME,
    ban_until DATETIME,
    is_permanent BOOLEAN DEFAULT FALSE,
    banned_by INT,
    appeal_status ENUM('none', 'pending', 'approved', 'rejected') DEFAULT 'none',
    appeal_reason TEXT,
    FOREIGN KEY (banned_by) REFERENCES users(id)
);

CREATE TABLE activity_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Index untuk performa
CREATE INDEX idx_kas_worker ON daily_kas(worker_id);
CREATE INDEX idx_kas_date ON daily_kas(work_date);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_workers_admin ON workers(admin_id);
CREATE INDEX idx_seclog_user ON security_logs(username_attempt);
