ALTER TABLE findings
ALTER COLUMN imagery_id DROP NOT NULL;


ALTER TABLE findings
ADD COLUMN IF NOT EXISTS source VARCHAR(30)
NOT NULL DEFAULT 'AI';


ALTER TABLE findings
ADD COLUMN IF NOT EXISTS title VARCHAR(255);


ALTER TABLE findings
ADD COLUMN IF NOT EXISTS description TEXT;


ALTER TABLE findings
DROP CONSTRAINT IF EXISTS findings_source_check;


ALTER TABLE findings
ADD CONSTRAINT findings_source_check
CHECK (
    source IN (
        'AI',
        'RESPONDER',
        'FUSION'
    )
);


ALTER TABLE findings
DROP CONSTRAINT IF EXISTS findings_severity_check;


ALTER TABLE findings
ADD CONSTRAINT findings_severity_check
CHECK (
    severity IS NULL
    OR severity IN (
        'LOW',
        'MODERATE',
        'SEVERE',
        'CRITICAL'
    )
);


CREATE INDEX IF NOT EXISTS idx_findings_source
ON findings(source);


CREATE INDEX IF NOT EXISTS idx_findings_location
ON findings(latitude, longitude);