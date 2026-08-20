CREATE TABLE IF NOT EXISTS fusion_recommendations (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    disaster_id UUID NOT NULL
        REFERENCES disasters(id)
        ON DELETE CASCADE,

    /*
     * Cluster IDs are derived identifiers such as:
     *
     * evidence-cluster-v1:<anchor UUID>
     */
    cluster_id VARCHAR(200)
        NOT NULL,

    anchor_finding_id UUID NOT NULL
        REFERENCES findings(id)
        ON DELETE RESTRICT,

    /*
     * SHA-256 of the evidence state used
     * to generate this recommendation.
     *
     * If evidence changes, a new signature
     * is produced.
     */
    evidence_signature VARCHAR(64)
        NOT NULL,

    proposed_type VARCHAR(50)
        NOT NULL
        CHECK (
            proposed_type IN (
                'BUILDING_DAMAGE',
                'ROAD_BLOCKAGE',
                'INFRASTRUCTURE_DAMAGE',
                'SERVICE_DISRUPTION'
            )
        ),

    proposed_severity VARCHAR(30)
        NOT NULL
        CHECK (
            proposed_severity IN (
                'LOW',
                'MODERATE',
                'SEVERE',
                'CRITICAL'
            )
        ),

    proposed_title VARCHAR(255)
        NOT NULL,

    proposed_description TEXT
        NOT NULL,

    latitude DOUBLE PRECISION
        NOT NULL
        CHECK (
            latitude BETWEEN -90 AND 90
        ),

    longitude DOUBLE PRECISION
        NOT NULL
        CHECK (
            longitude BETWEEN -180 AND 180
        ),

    /*
     * Explainable recommendation strength.
     *
     * NOT a probability.
     */
    support_score DOUBLE PRECISION
        NOT NULL
        CHECK (
            support_score >= 0
            AND support_score <= 1
        ),

    /*
     * Immutable evidence state used
     * during generation.
     */
    evidence_snapshot JSONB
        NOT NULL,

    signals JSONB
        NOT NULL,

    algorithm_version VARCHAR(50)
        NOT NULL,

    status VARCHAR(20)
        NOT NULL
        DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'APPROVED',
                'REJECTED'
            )
        ),

    reviewer_label VARCHAR(150),

    review_reason TEXT,

    resulting_finding_id UUID
        REFERENCES findings(id)
        ON DELETE SET NULL,

    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    UNIQUE (
        disaster_id,
        cluster_id,
        evidence_signature
    )
);


CREATE INDEX IF NOT EXISTS
idx_fusion_recommendations_disaster
ON fusion_recommendations(
    disaster_id
);


CREATE INDEX IF NOT EXISTS
idx_fusion_recommendations_status
ON fusion_recommendations(
    status
);


CREATE INDEX IF NOT EXISTS
idx_fusion_recommendations_anchor
ON fusion_recommendations(
    anchor_finding_id
);
