-- Migration 009: Extended file uploads and media management
-- Add advanced file upload capabilities and media management

-- Add additional fields to file_uploads table (if not already added in migration 007)
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS thumbnail_path TEXT;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS alt_text VARCHAR(255);
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS width INTEGER;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS height INTEGER;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS duration INTEGER; -- for videos/audio in seconds
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS compression_quality INTEGER; -- 1-100
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT false;
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS processing_error TEXT;

-- Create file variants table for different sizes/formats
CREATE TABLE IF NOT EXISTS file_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    variant_type VARCHAR(50) NOT NULL, -- thumbnail, small, medium, large, webp, etc.
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    width INTEGER,
    height INTEGER,
    quality INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create media galleries for companies
CREATE TABLE IF NOT EXISTS media_galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    gallery_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    cover_image_id UUID REFERENCES file_uploads(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create gallery items
CREATE TABLE IF NOT EXISTS gallery_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES media_galleries(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(gallery_id, file_id)
);

-- Create upload sessions for batch uploads
CREATE TABLE IF NOT EXISTS upload_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uploader_id UUID NOT NULL,
    uploader_type VARCHAR(20) NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    upload_purpose VARCHAR(50) NOT NULL,
    total_files INTEGER DEFAULT 0,
    uploaded_files INTEGER DEFAULT 0,
    failed_files INTEGER DEFAULT 0,
    total_size BIGINT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, completed, failed, expired
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Link files to upload sessions
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS upload_session_id UUID REFERENCES upload_sessions(id) ON DELETE SET NULL;

-- Create file access permissions
CREATE TABLE IF NOT EXISTS file_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    permission_type VARCHAR(20) NOT NULL, -- public, private, restricted
    allowed_users UUID[], -- array of user IDs who can access
    allowed_roles TEXT[], -- array of roles that can access
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create file sharing links
CREATE TABLE IF NOT EXISTS file_sharing_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    download_limit INTEGER,
    download_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP
);

-- Add file associations to various entities
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_file_id UUID REFERENCES file_uploads(id);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS banner_file_id UUID REFERENCES file_uploads(id);
ALTER TABLE services ADD COLUMN IF NOT EXISTS thumbnail_file_id UUID REFERENCES file_uploads(id);
ALTER TABLE products ADD COLUMN IF NOT EXISTS thumbnail_file_id UUID REFERENCES file_uploads(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_file_id UUID REFERENCES file_uploads(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_file_id UUID REFERENCES file_uploads(id);

-- Create service media associations
CREATE TABLE IF NOT EXISTS service_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- image, video, document
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service_id, file_id)
);

-- Create product media associations
CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    media_type VARCHAR(20) NOT NULL, -- image, video, document
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, file_id)
);

-- Create file tags for organization
CREATE TABLE IF NOT EXISTS file_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    tag_name VARCHAR(100) NOT NULL,
    tag_category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(file_id, tag_name)
);

-- Create image optimization jobs queue
CREATE TABLE IF NOT EXISTS image_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- resize, compress, convert, generate_thumbnail
    job_config JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    priority INTEGER DEFAULT 0,
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    processing_started_at TIMESTAMP,
    processing_completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create CDN/storage configuration
CREATE TABLE IF NOT EXISTS storage_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_name VARCHAR(100) UNIQUE NOT NULL,
    storage_type VARCHAR(50) NOT NULL, -- local, s3, cloudinary, etc.
    config_data JSONB NOT NULL,
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add storage configuration reference to file uploads
ALTER TABLE file_uploads ADD COLUMN IF NOT EXISTS storage_config_id UUID REFERENCES storage_configurations(id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_file_variants_original ON file_variants(original_file_id, variant_type);
CREATE INDEX IF NOT EXISTS idx_media_galleries_company ON media_galleries(company_id, is_public);
CREATE INDEX IF NOT EXISTS idx_gallery_items_gallery ON gallery_items(gallery_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_uploader ON upload_sessions(uploader_type, uploader_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON upload_sessions(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_file_permissions_file ON file_permissions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_sharing_links_token ON file_sharing_links(share_token);
CREATE INDEX IF NOT EXISTS idx_service_media_service ON service_media(service_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_product_media_product ON product_media(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_file_tags_file ON file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_name ON file_tags(tag_name);
CREATE INDEX IF NOT EXISTS idx_image_processing_jobs_status ON image_processing_jobs(status, priority);

-- Function to generate file sharing token
CREATE OR REPLACE FUNCTION generate_share_token()
RETURNS VARCHAR(255) AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$ language 'plpgsql';

-- Function to check file access permission
CREATE OR REPLACE FUNCTION check_file_access(
    p_file_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_user_roles TEXT[] DEFAULT '{}'
)
RETURNS BOOLEAN AS $$
DECLARE
    file_public BOOLEAN;
    has_permission BOOLEAN := false;
    permission_record RECORD;
BEGIN
    -- Check if file is public
    SELECT is_public INTO file_public 
    FROM file_uploads 
    WHERE id = p_file_id;
    
    IF file_public THEN
        RETURN true;
    END IF;
    
    -- Check specific permissions
    FOR permission_record IN 
        SELECT * FROM file_permissions 
        WHERE file_id = p_file_id 
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    LOOP
        -- Check if user has direct access
        IF p_user_id IS NOT NULL AND p_user_id = ANY(permission_record.allowed_users) THEN
            has_permission := true;
            EXIT;
        END IF;
        
        -- Check if user has role-based access
        IF p_user_roles && permission_record.allowed_roles THEN
            has_permission := true;
            EXIT;
        END IF;
    END LOOP;
    
    RETURN has_permission;
END;
$$ language 'plpgsql';

-- Function to clean up expired uploads and temporary files
CREATE OR REPLACE FUNCTION cleanup_expired_uploads()
RETURNS void AS $$
BEGIN
    -- Mark expired upload sessions as failed
    UPDATE upload_sessions 
    SET status = 'expired' 
    WHERE expires_at < CURRENT_TIMESTAMP 
    AND status = 'active';
    
    -- Delete expired sharing links
    DELETE FROM file_sharing_links 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Delete old processing jobs (older than 7 days)
    DELETE FROM image_processing_jobs 
    WHERE created_at < CURRENT_DATE - INTERVAL '7 days'
    AND status IN ('completed', 'failed');
END;
$$ language 'plpgsql';

-- Trigger to update file download count
CREATE OR REPLACE FUNCTION update_file_access_stats()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE file_uploads 
    SET download_count = download_count + 1,
        last_accessed_at = CURRENT_TIMESTAMP
    WHERE id = NEW.file_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Insert default storage configuration
INSERT INTO storage_configurations (config_name, storage_type, config_data, is_default, is_active)
VALUES (
    'local_storage',
    'local',
    '{"base_path": "/uploads", "max_file_size": 52428800, "allowed_types": ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"]}',
    true,
    true
) ON CONFLICT (config_name) DO NOTHING;

-- Update triggers
CREATE OR REPLACE FUNCTION update_media_galleries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_media_galleries_updated_at
    BEFORE UPDATE ON media_galleries
    FOR EACH ROW
    EXECUTE FUNCTION update_media_galleries_updated_at(); 