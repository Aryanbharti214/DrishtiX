CREATE TABLE IF NOT EXISTS findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    disaster_id UUID NOT NULL
        REFERENCES disasters(id)
        ON DELETE CASCADE,

    imagery_id UUID NOT NULL
        REFERENCES imagery(id)
        ON DELETE CASCADE,

    ai_run_id UUID
        REFERENCES ai_runs(id)
        ON DELETE SET NULL,

    finding_type VARCHAR(50) NOT NULL
        CHECK (
            finding_type IN (
                'BUILDING_DAMAGE',
                'ROAD_BLOCKAGE',
                'INFRASTRUCTURE_DAMAGE',
                'SERVICE_DISRUPTION'
            )
        ),

    severity VARCHAR(30),

    confidence DOUBLE PRECISION
        CHECK (
            confidence IS NULL
            OR (
                confidence >= 0
                AND confidence <= 1
            )
        ),

    latitude DOUBLE PRECISION,

    longitude DOUBLE PRECISION,

    prediction JSONB NOT NULL,

    bbox JSONB,

    verification_status VARCHAR(30)
        NOT NULL DEFAULT 'PENDING'
        CHECK (
            verification_status IN (
                'PENDING',
                'CONFIRMED',
                'CORRECTED',
                'REJECTED'
            )
        ),

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_findings_disaster_id
ON findings(disaster_id);

CREATE INDEX IF NOT EXISTS idx_findings_imagery_id
ON findings(imagery_id);

CREATE INDEX IF NOT EXISTS idx_findings_ai_run_id
ON findings(ai_run_id);

CREATE INDEX IF NOT EXISTS idx_findings_verification_status
ON findings(verification_status);