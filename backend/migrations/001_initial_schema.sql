CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sso_subject TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE provider_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider TEXT NOT NULL CHECK (provider IN ('jira', 'confluence')),
  cloud_id TEXT NOT NULL,
  atlassian_account_id TEXT NOT NULL,
  token_ciphertext BYTEA NOT NULL,
  token_nonce BYTEA NOT NULL CHECK (octet_length(token_nonce) = 12),
  token_auth_tag BYTEA NOT NULL CHECK (octet_length(token_auth_tag) = 16),
  encryption_key_id TEXT NOT NULL CHECK (length(encryption_key_id) > 0),
  access_token_expires_at TIMESTAMPTZ NOT NULL,
  refresh_token_expires_at TIMESTAMPTZ,
  scopes TEXT[] NOT NULL DEFAULT '{}',
  connection_status TEXT NOT NULL DEFAULT 'connected'
    CHECK (connection_status IN ('connected', 'reauthorization_required')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, provider, cloud_id)
);

CREATE INDEX provider_connections_user_provider_idx
  ON provider_connections (user_id, provider);

CREATE TABLE automation_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  request_id UUID NOT NULL,
  operation_type TEXT NOT NULL CHECK (
    operation_type IN (
      'jira_search',
      'jira_issue_create',
      'jira_issue_update',
      'confluence_search',
      'confluence_page_create',
      'confluence_page_update'
    )
  ),
  provider TEXT NOT NULL CHECK (provider IN ('jira', 'confluence')),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'completed', 'failed', 'uncertain')),
  request_fingerprint BYTEA NOT NULL
    CHECK (octet_length(request_fingerprint) = 32),
  target_ref TEXT,
  outcome_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL
    DEFAULT (CURRENT_TIMESTAMP + INTERVAL '365 days'),
  CHECK (expires_at > created_at),
  CHECK ((status = 'completed') = (completed_at IS NOT NULL)),
  CHECK (
    (operation_type IN ('jira_search', 'jira_issue_create', 'jira_issue_update')
      AND provider = 'jira')
    OR
    (operation_type IN (
      'confluence_search',
      'confluence_page_create',
      'confluence_page_update'
    ) AND provider = 'confluence')
  ),
  UNIQUE (requester_user_id, request_id)
);

CREATE INDEX automation_operations_requester_created_idx
  ON automation_operations (requester_user_id, created_at DESC);

CREATE INDEX automation_operations_expiry_idx
  ON automation_operations (expires_at);

CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  operation_id UUID REFERENCES automation_operations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (length(event_type) > 0),
  result TEXT NOT NULL CHECK (length(result) > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ NOT NULL
    DEFAULT (CURRENT_TIMESTAMP + INTERVAL '365 days'),
  CHECK (expires_at > created_at)
);

CREATE INDEX audit_events_actor_created_idx
  ON audit_events (actor_user_id, created_at DESC);

CREATE INDEX audit_events_expiry_idx
  ON audit_events (expires_at);
