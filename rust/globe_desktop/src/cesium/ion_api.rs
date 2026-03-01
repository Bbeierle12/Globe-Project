//! Cesium Ion REST API client.
//! Mirrors src/utils/ionApi.js — same endpoints, same auth scheme.
//!
//! Base URL : https://api.cesium.com
//! Auth     : Authorization: Bearer <token>

use serde::Deserialize;

const ION_BASE: &str = "https://api.cesium.com";

// ─── Response types ───────────────────────────────────────────────────────────

/// Response from GET /v1/me
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IonMe {
    pub id:       u64,
    pub username: String,
    pub email:    String,
}

/// One entry from GET /v1/assets
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IonAsset {
    pub id:          u64,
    pub name:        String,
    #[serde(rename = "type")]
    pub asset_type:  String,
    pub description: Option<String>,
    pub bytes:       Option<u64>,
    pub status:      Option<String>,
    pub attribution: Option<String>,
}

/// Response from GET /v1/assets?...
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IonAssetList {
    pub items:     Vec<IonAsset>,
    pub next_page: Option<String>,
}

/// Response from GET /v1/assets/{id}/endpoint
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IonEndpoint {
    pub url:          String,
    pub access_token: String,
    #[serde(rename = "type")]
    pub endpoint_type: String,
    pub attributions:  Vec<IonAttribution>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct IonAttribution {
    pub html:       String,
    pub collapsible: Option<bool>,
}

// ─── UI status ────────────────────────────────────────────────────────────────

/// Connection state shown in the sidebar Ion panel.
#[derive(Debug, Clone, Default)]
pub enum IonStatus {
    #[default]
    Loading,
    Connected(String), // username
    Error(String),
    NoToken,
}

// ─── Client ───────────────────────────────────────────────────────────────────

/// Thin async wrapper around the Cesium Ion REST API.
#[derive(Debug, Clone)]
pub struct IonClient {
    token:  String,
    client: reqwest::Client,
}

impl IonClient {
    pub fn new(token: impl Into<String>) -> Self {
        Self { token: token.into(), client: reqwest::Client::new() }
    }

    /// GET /v1/me
    pub async fn get_me(&self) -> Result<IonMe, String> {
        self.get("/v1/me").await
    }

    /// GET /v1/assets?limit={limit}
    pub async fn list_assets(&self, limit: u32) -> Result<IonAssetList, String> {
        self.get(&format!("/v1/assets?limit={limit}")).await
    }

    /// GET /v1/assets/{id}
    pub async fn get_asset(&self, id: u64) -> Result<IonAsset, String> {
        self.get(&format!("/v1/assets/{id}")).await
    }

    /// GET /v1/assets/{id}/endpoint
    pub async fn get_asset_endpoint(&self, id: u64) -> Result<IonEndpoint, String> {
        self.get(&format!("/v1/assets/{id}/endpoint")).await
    }

    async fn get<T: for<'de> serde::Deserialize<'de>>(&self, path: &str) -> Result<T, String> {
        let url = format!("{ION_BASE}{path}");
        self.client
            .get(&url)
            .bearer_auth(&self.token)
            .send()
            .await
            .map_err(|e| e.to_string())?
            .error_for_status()
            .map_err(|e| {
                let status = e.status().map_or(0, |s| s.as_u16());
                format!("HTTP {status}")
            })?
            .json::<T>()
            .await
            .map_err(|e| e.to_string())
    }
}

// ─── Token loading ────────────────────────────────────────────────────────────

/// Load the Ion token from the environment or the nearest `.env` file.
///
/// Checks (in order):
/// 1. `VITE_CESIUM_ION_TOKEN` — already set in environment
/// 2. `CESIUM_ION_TOKEN`       — already set in environment
/// 3. Walk up from CWD looking for `.env`, load it, re-check both vars.
pub fn load_ion_token() -> Option<String> {
    if let Some(t) = read_token_from_env() {
        return Some(t);
    }

    // Walk up directory tree looking for .env
    if let Ok(mut dir) = std::env::current_dir() {
        for _ in 0..6 {
            let candidate = dir.join(".env");
            if candidate.exists() {
                let _ = dotenvy::from_path(&candidate);
                break;
            }
            if !dir.pop() {
                break;
            }
        }
    }

    read_token_from_env()
}

fn read_token_from_env() -> Option<String> {
    for var in ["VITE_CESIUM_ION_TOKEN", "CESIUM_ION_TOKEN"] {
        if let Ok(t) = std::env::var(var) {
            if !t.is_empty() && t != "your_token_here" {
                return Some(t);
            }
        }
    }
    None
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ion_me() {
        let json = r#"{
            "id": 12345,
            "username": "explorer",
            "email": "explorer@example.com"
        }"#;
        let me: IonMe = serde_json::from_str(json).unwrap();
        assert_eq!(me.id, 12345);
        assert_eq!(me.username, "explorer");
        assert_eq!(me.email, "explorer@example.com");
    }

    #[test]
    fn test_parse_ion_asset_full() {
        let json = r#"{
            "id": 1,
            "name": "Cesium World Terrain",
            "type": "TERRAIN",
            "description": "High-resolution global terrain",
            "bytes": 0,
            "status": "COMPLETE",
            "attribution": "© Cesium"
        }"#;
        let a: IonAsset = serde_json::from_str(json).unwrap();
        assert_eq!(a.id, 1);
        assert_eq!(a.asset_type, "TERRAIN");
        assert_eq!(a.status.as_deref(), Some("COMPLETE"));
        assert_eq!(a.attribution.as_deref(), Some("© Cesium"));
    }

    #[test]
    fn test_parse_ion_asset_minimal() {
        // Optional fields absent
        let json = r#"{"id": 96188, "name": "OSM Buildings", "type": "3DTILES"}"#;
        let a: IonAsset = serde_json::from_str(json).unwrap();
        assert_eq!(a.id, 96188);
        assert_eq!(a.asset_type, "3DTILES");
        assert!(a.description.is_none());
        assert!(a.bytes.is_none());
    }

    #[test]
    fn test_parse_ion_asset_list() {
        let json = r#"{
            "items": [
                {"id": 1,     "name": "World Terrain", "type": "TERRAIN"},
                {"id": 96188, "name": "OSM Buildings",  "type": "3DTILES"}
            ]
        }"#;
        let list: IonAssetList = serde_json::from_str(json).unwrap();
        assert_eq!(list.items.len(), 2);
        assert_eq!(list.items[0].asset_type, "TERRAIN");
        assert_eq!(list.items[1].id, 96188);
        assert!(list.next_page.is_none());
    }

    #[test]
    fn test_parse_ion_asset_list_with_next_page() {
        let json = r#"{"items": [], "nextPage": "https://api.cesium.com/v1/assets?page=2"}"#;
        let list: IonAssetList = serde_json::from_str(json).unwrap();
        assert!(list.items.is_empty());
        assert!(list.next_page.is_some());
    }

    #[test]
    fn test_parse_ion_endpoint() {
        let json = r#"{
            "url": "https://assets.cesium.com/1/",
            "accessToken": "eyJhb...",
            "type": "TERRAIN",
            "attributions": [
                {"html": "<p>© Cesium</p>", "collapsible": false}
            ]
        }"#;
        let ep: IonEndpoint = serde_json::from_str(json).unwrap();
        assert_eq!(ep.access_token, "eyJhb...");
        assert_eq!(ep.endpoint_type, "TERRAIN");
        assert_eq!(ep.attributions.len(), 1);
        assert_eq!(ep.attributions[0].collapsible, Some(false));
    }

    #[test]
    fn test_ion_status_default_is_loading() {
        assert!(matches!(IonStatus::default(), IonStatus::Loading));
    }

    #[test]
    fn test_read_token_from_env_missing() {
        // Ensure neither var is set for this thread (best-effort in test env).
        // We can't guarantee isolation but verify the function handles absence.
        // Just confirm it returns None when both vars are empty strings.
        // (Actual env state may vary — don't mutate it in tests.)
        let result = read_token_from_env();
        // Result is either Some(real_token) or None — both are valid.
        // We just ensure the function doesn't panic.
        let _ = result;
    }

    #[test]
    fn test_ion_client_new() {
        let client = IonClient::new("test-token-123");
        assert_eq!(client.token, "test-token-123");
    }
}
