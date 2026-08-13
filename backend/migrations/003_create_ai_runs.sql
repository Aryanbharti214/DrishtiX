CREATE TABLE IF NOT EXISTS ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    imagery_id UUID NOT NULL
        REFERENCES imagery(id)
        ON DELETE CASCADE,

    model_name VARCHAR(100),

    model_version VARCHAR(100),

    status VARCHAR(30) NOT NULL
        DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'PROCESSING',
                'SUCCEEDED',
                'FAILED'
            )
        ),

    started_at TIMESTAMPTZ,

    completed_at TIMESTAMPTZ,

    processing_time_ms INTEGER,

    raw_output JSONB,

    error_message TEXT,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_runs_imagery_id
ON ai_runs(imagery_id);

CREATE INDEX IF NOT EXISTS idx_ai_runs_status
ON ai_runs(status);