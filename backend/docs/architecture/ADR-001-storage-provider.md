# ADR-001: Storage Provider Abstraction

## Decision
Introduce a `StorageProvider` interface and a concrete `MinIOStorageProvider` implementation to handle all object storage operations. Direct imports and usage of the `minio` SDK outside of the `storage/` domain are strictly prohibited.

## Reason
The system currently couples MinIO directly to multiple domains (e.g., `evidence`, `export`, `knowledge`). This tightly couples the business logic to a specific infrastructure technology. By abstracting storage, we enable swappability for enterprise deployments (e.g., AWS S3, Azure Blob Storage) and simplify unit testing by allowing an in-memory or mock storage provider.

## Alternatives Considered
- Keeping MinIO tightly coupled: Rejected because it violates the dependency inversion principle and prevents enterprise flexibility.
- Using a heavy third-party storage abstraction library: Rejected to minimize dependencies and maintain full control over the storage interface.

## Consequences
- All existing MinIO logic must be moved to `storage/minio_provider.py`.
- Other domains must be refactored to use the injected or global `StorageProvider` interface.
- Future storage integrations require implementing only the `StorageProvider` interface.
