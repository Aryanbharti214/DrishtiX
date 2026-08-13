CREATE TABLE IF NOT EXISTS imagery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    disaster_id UUID NOT NULL
        REFERENCES disasters(id)
        ON DELETE CASCADE,

    source_type VARCHAR(30) NOT NULL
        CHECK (
            source_type IN (
                'SATELLITE',
                'DRONE',
                'STREET'
            )
        ),

    original_filename VARCHAR(255) NOT NULL,

    stored_filename VARCHAR(255) NOT NULL,

    image_url TEXT NOT NULL,

    mime_type VARCHAR(100) NOT NULL,

    size_bytes BIGINT NOT NULL,

    latitude DOUBLE PRECISION,

    longitude DOUBLE PRECISION,

    captured_at TIMESTAMPTZ,

    processing_status VARCHAR(30)
        NOT NULL DEFAULT 'UPLOADED'
        CHECK (
            processing_status IN (
                'UPLOADED',
                'QUEUED',
                'PROCESSING',
                'ANALYZED',
                'FAILED'
            )
        ),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_imagery_disaster_id
ON imagery(disaster_id);

CREATE INDEX IF NOT EXISTS idx_imagery_processing_status
ON imagery(processing_status);