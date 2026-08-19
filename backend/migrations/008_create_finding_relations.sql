CREATE TABLE IF NOT EXISTS finding_relations (
    id UUID PRIMARY KEY
        DEFAULT gen_random_uuid(),

    disaster_id UUID NOT NULL
        REFERENCES disasters(id)
        ON DELETE CASCADE,

    finding_a_id UUID NOT NULL
        REFERENCES findings(id)
        ON DELETE CASCADE,

    finding_b_id UUID NOT NULL
        REFERENCES findings(id)
        ON DELETE CASCADE,

    relation_type VARCHAR(40) NOT NULL
        CHECK (
            relation_type IN (
                'CORROBORATES',
                'RELATED',
                'POSSIBLE_DUPLICATE',
                'DISPUTED'
            )
        ),

    distance_meters DOUBLE PRECISION NOT NULL
        CHECK (
            distance_meters >= 0
        ),

    score DOUBLE PRECISION NOT NULL
        CHECK (
            score >= 0
            AND score <= 1
        ),

    /*
     * Transparent machine-readable explanation
     * of why this relationship exists.
     */
    signals JSONB NOT NULL
        DEFAULT '{}'::jsonb,

    algorithm_version VARCHAR(50)
        NOT NULL,

    created_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ
        NOT NULL DEFAULT NOW(),

    CHECK (
        finding_a_id <>
        finding_b_id
    ),

    /*
     * Store every pair in canonical UUID order.
     */
    CHECK (
        finding_a_id <
        finding_b_id
    ),

    UNIQUE (
        finding_a_id,
        finding_b_id
    )
);


CREATE INDEX IF NOT EXISTS
idx_finding_relations_disaster
ON finding_relations(disaster_id);


CREATE INDEX IF NOT EXISTS
idx_finding_relations_finding_a
ON finding_relations(finding_a_id);


CREATE INDEX IF NOT EXISTS
idx_finding_relations_finding_b
ON finding_relations(finding_b_id);


CREATE INDEX IF NOT EXISTS
idx_finding_relations_type
ON finding_relations(relation_type);


CREATE INDEX IF NOT EXISTS
idx_finding_relations_score
ON finding_relations(score DESC);