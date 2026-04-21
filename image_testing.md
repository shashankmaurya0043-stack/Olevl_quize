# Image Integration Test Rules (from integration_playbook_expert_v2)

## Image Handling Rules
- Always use base64-encoded images for all tests and requests.
- Accepted formats: JPEG, PNG, WEBP only.
- Do not use SVG, BMP, HEIC, or other formats.
- Do not upload blank, solid-color, or uniform-variance images.
- Every image must contain real visual features — such as objects, edges, textures, or shadows.
- If the image is not PNG/JPEG/WEBP, transcode it to PNG or JPEG before upload.
  - Example fix: If you read a .jpg but the content is actually PNG after conversion, re-detect and update the MIME.
- If the image is animated (GIF, APNG, WEBP animation), extract the first frame only.
- Resize large images to reasonable bounds (avoid oversized payloads).

## Applicable to this app
- Endpoint under test: POST /api/admin/parse  (mode=image, content=base64 image)
- Model: gemini-3-flash-preview (Emergent Universal Key)
- Expected response: {"questions": [ParsedMCQ...]}
- Auth header: X-Admin-Password: olevel-admin-7dc75d34
