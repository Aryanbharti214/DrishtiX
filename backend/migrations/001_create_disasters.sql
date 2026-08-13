CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS disasters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    name VARCHAR(150) NOT NULL,

    type VARCHAR(30) NOT NULL
        CHECK (
            type IN (
                'FLOOD',
                'CYCLONE',
                'FIRE',
                'EARTHQUAKE'
            )
        ),

    description TEXT,

    region_name VARCHAR(255),

    start_date TIMESTAMPTZ NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
        CHECK (
            status IN (
                'ACTIVE',
                'MONITORING',
                'CLOSED'
            )
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);