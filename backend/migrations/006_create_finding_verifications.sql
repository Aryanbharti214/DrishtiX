CREATE TABLE IF NOT EXISTS finding_verifications (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    finding_id UUID NOT NULL
        REFERENCES findings(id)
        ON DELETE CASCADE,

    decision VARCHAR(30) NOT NULL
        CHECK (
            decision IN (
                'CONFIRMED',
                'CORRECTED',
                'REJECTED'
            )
        ),

    reviewer_label VARCHAR(150),

    reason TEXT,

    before_snapshot JSONB NOT NULL,

    after_snapshot JSONB,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW()
);


CREATE INDEX IF NOT EXISTS
idx_finding_verifications_finding_id
ON finding_verifications(finding_id);


CREATE INDEX IF NOT EXISTS
idx_finding_verifications_decision
ON finding_verifications(decision);


CREATE INDEX IF NOT EXISTS
idx_finding_verifications_created_at
ON finding_verifications(created_at);