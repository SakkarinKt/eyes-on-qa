# LINE Messaging API and tunnel notes for the control plane

Written Oct 27, 2026. Limits from developers.line.biz (reference and pricing pages, read Oct 20 while planning); tunnel behaviour measured on this Mac on Oct 20. Volatile; re-check anything that bites.

## Webhook

- LINE POSTs events to the webhook URL over HTTPS. Verify `x-line-signature`: base64 of HMAC-SHA256 over the **raw request body** with the channel secret, compared in constant time.
- Return `200` immediately; process events asynchronously (enqueue, then reply).
- Set the URL by API: `PUT https://api.line.me/v2/bot/channel/webhook/endpoint`, header `Authorization: Bearer {channel access token}`, body `{"endpoint": "https://…"}`; valid HTTPS URL ≤ 500 characters; up to 1 minute to apply; 1,000 requests/minute. The runner calls this on boot with the fresh `trycloudflare.com` URL.
- Only the owner's `userId` (from the first event's `source.userId`) is accepted.

## Message accounting

- **Reply messages are free.** Use the event's `replyToken` for every acknowledgement (`goal:` received, `status`, errors). Tokens are single-use and expire quickly; reply within seconds.
- **Push, multicast, broadcast, narrowcast count**, per recipient, however many message objects a request carries (a push with 4 objects to 1 user = 1 message). Budget: at most 3 pushes per goal. The free monthly allowance depends on plan and country (Japan Communication plan: 200/month); check the account's plan in LINE Official Account Manager.
- Usage by API: `GET /v2/bot/message/quota` and `GET /v2/bot/message/quota/consumption` → `totalUsage`. Over the limit, sends fail.

## Message object limits

| Object | Limit |
|---|---|
| Text | ≤ 5,000 characters |
| Image | `originalContentUrl` HTTPS (TLS 1.2+), JPEG/PNG ≤ 10 MB; `previewImageUrl` JPEG/PNG ≤ 1 MB; URLs ≤ 2,000 chars |
| Video | `originalContentUrl` HTTPS, **mp4** ≤ 200 MB; `previewImageUrl` JPEG/PNG ≤ 1 MB; optional `trackingId` ≤ 100 chars |
| Quick reply | ≤ 13 items; `label` ≤ 20 chars |
| Postback action | `data` ≤ 300 chars; `displayText` ≤ 300; `label` ≤ 20 in templates and quick replies, ≤ 40 on a Flex button |
| Buttons template | `title` ≤ 40; `text` ≤ 160 (≤ 60 with image or title); ≤ 4 actions |
| Flex | bubble JSON ≤ 30 KB; carousel ≤ 50 KB; `altText` ≤ 1,500 chars |
| Any request | ≤ 2 MB |

## Result delivery design

One push with up to 5 message objects: the clip (video message, mp4 served from `/media/<job>/<criterion>/clip.mp4` through the tunnel, preview JPEG from the last frame), the annotated frame (image message), and a buttons template with `approve:<job>:<sha>` and `reject:<job>:<sha>` postbacks plus the PR link as a URI action. That is one counted message. Job start is a reply (free); `status` is a reply.

Clips are H.264 MP4 with `+faststart` at 15 fps; a 3-second criterion clip is about 20 KB, a 10-second one about 0.35 MB.

## Tunnel

- `cloudflared tunnel --url http://127.0.0.1:<port> --no-autoupdate` (cloudflared 2026.10.2) prints a `https://<words>.trycloudflare.com` URL within 5 s and registers an edge connection (QUIC, Taiwan POP) within about 10 s. A file served locally came back through the public URL with HTTP 200.
- **Local DNS quirk:** this Mac's resolver (the router's link-local IPv6 nameserver) answered NXDOMAIN for the brand-new hostname for the first minute, while `dig` resolved it at once. External resolvers, including LINE's, are unaffected. The runner's boot self-check retries for up to 2 minutes or resolves via `dig` and passes `--resolve` to curl.
- Boot sequence: start the app on 127.0.0.1 → start cloudflared → parse the URL from stderr → `PUT /v2/bot/channel/webhook/endpoint` with `<url>/webhook` → store `<url>` as this run's media base → self-check `<url>/media/health`.
- The first QUIC dial sometimes times out once before registering; that is normal. If it keeps failing, add `--protocol http2`.
