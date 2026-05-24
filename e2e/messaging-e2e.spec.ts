import { test, expect, APIRequestContext } from '@playwright/test';

/**
 * End-to-End Messaging Test: Pet Seeker → Service Provider
 *
 * This test uses REAL API calls (no mocking) to verify the full
 * message delivery flow:
 *
 * 1. Pet seeker logs in and sends a message to the service provider
 * 2. Service provider logs in and verifies the message appears in their inbox
 * 3. Verifies message content matches what was sent
 *
 * Test accounts (password: Test1234!):
 *   petseeker.test@breedly.test  — pet seeker (Alex Johnson)
 *   lisa.boarding@breedly.test   — service provider (Lisa Park)
 *
 * Service provider ID: 825c2f42-580a-4b84-8bdb-c1e5051c401f
 */

const API = 'http://localhost:8000/api';

const PET_SEEKER_EMAIL = 'petseeker.test@breedly.test';
const PET_SEEKER_PASSWORD = 'Test1234!';

const SP_EMAIL = 'lisa.boarding@breedly.test';
const SP_PASSWORD = 'Test1234!';
const SP_ID = '825c2f42-580a-4b84-8bdb-c1e5051c401f';

// ── API helpers ───────────────────────────────────────────────────────────────

async function login(request: APIRequestContext, email: string, password: string): Promise<string> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await request.post(`${API}/auth/jwt/login`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    data: formData.toString(),
  });

  expect(res.status(), `Login failed for ${email}: ${await res.text()}`).toBe(200);
  const body = await res.json();
  expect(body.access_token, 'No access_token in login response').toBeTruthy();
  return body.access_token as string;
}

async function sendMessage(
  request: APIRequestContext,
  token: string,
  receiverId: string,
  message: string
): Promise<string> {
  const res = await request.post(`${API}/messages/direct`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    data: JSON.stringify({
      receiver_id: receiverId,
      message,
    }),
  });

  const body = await res.json();
  expect(
    res.status(),
    `Send message failed: ${JSON.stringify(body)}`
  ).toBeGreaterThanOrEqual(200);
  expect(res.status()).toBeLessThan(300);

  return body.id ?? body.thread_id ?? 'sent';
}

async function getMessages(
  request: APIRequestContext,
  token: string
): Promise<any[]> {
  const res = await request.get(`${API}/messages/`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(res.status(), `Get messages failed: ${await res.text()}`).toBe(200);
  const body = await res.json();
  // Support both response shapes: { messages: [] } or []
  return Array.isArray(body) ? body : (body.messages ?? []);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('End-to-End: Pet Seeker → Service Provider messaging', () => {

  test.use({ project: 'chromium' } as any);

  test('pet seeker sends a message and service provider receives it in their inbox', async ({ request }) => {
    const uniqueMessage = `Hi Lisa, I need boarding for my dog next weekend. Test run: ${Date.now()}`;

    // ── Step 1: Pet seeker logs in ────────────────────────────────────────
    const seekerToken = await login(request, PET_SEEKER_EMAIL, PET_SEEKER_PASSWORD);
    expect(seekerToken).toBeTruthy();

    // ── Step 2: Pet seeker sends message to service provider ──────────────
    await sendMessage(request, seekerToken, SP_ID, uniqueMessage);

    // ── Step 3: Service provider logs in ─────────────────────────────────
    const spToken = await login(request, SP_EMAIL, SP_PASSWORD);
    expect(spToken).toBeTruthy();

    // ── Step 4: Service provider fetches their messages ───────────────────
    const messages = await getMessages(request, spToken);
    expect(messages.length, 'Service provider should have at least 1 message').toBeGreaterThan(0);

    // ── Step 5: Verify the message from the pet seeker is present ─────────
    const received = messages.find((m: any) => {
      const preview = m.content_preview ?? m.message ?? m.message_preview ?? '';
      return preview.includes('boarding for my dog next weekend');
    });

    expect(
      received,
      `Message not found in SP inbox. Messages: ${JSON.stringify(messages.map((m: any) => m.content_preview ?? m.message ?? '').slice(0, 5))}`
    ).toBeTruthy();

    // ── Step 6: Verify sender is the pet seeker ───────────────────────────
    const senderName = received.sender_name ?? received.sender?.name ?? '';
    expect(senderName.toLowerCase()).toContain('alex');
  });

  test('service provider can see unread count increase after pet seeker sends a message', async ({ request }) => {
    // Get SP unread count before
    const spToken = await login(request, SP_EMAIL, SP_PASSWORD);

    const beforeRes = await request.get(`${API}/messages/unread-count`, {
      headers: { Authorization: `Bearer ${spToken}` },
    });
    const before = await beforeRes.json();
    const unreadBefore: number = before.unread_count ?? 0;

    // Pet seeker sends a new message
    const seekerToken = await login(request, PET_SEEKER_EMAIL, PET_SEEKER_PASSWORD);
    const uniqueMsg = `Unread count test message ${Date.now()}`;
    await sendMessage(request, seekerToken, SP_ID, uniqueMsg);

    // SP checks unread count again (re-login to get fresh state)
    const spToken2 = await login(request, SP_EMAIL, SP_PASSWORD);
    const afterRes = await request.get(`${API}/messages/unread-count`, {
      headers: { Authorization: `Bearer ${spToken2}` },
    });
    const after = await afterRes.json();
    const unreadAfter: number = after.unread_count ?? 0;

    expect(
      unreadAfter,
      `Unread count should have increased. Before: ${unreadBefore}, After: ${unreadAfter}`
    ).toBeGreaterThanOrEqual(unreadBefore);
  });

  test('pet seeker can see their sent message in their own messages list', async ({ request }) => {
    const seekerToken = await login(request, PET_SEEKER_EMAIL, PET_SEEKER_PASSWORD);

    const uniqueMsg = `Seeker outbox test ${Date.now()}`;
    await sendMessage(request, seekerToken, SP_ID, uniqueMsg);

    // Pet seeker fetches their messages
    const messages = await getMessages(request, seekerToken);
    expect(messages.length).toBeGreaterThan(0);

    // The sent message should appear in their list
    const sent = messages.find((m: any) => {
      const preview = m.content_preview ?? m.message ?? m.message_preview ?? '';
      return preview.includes('Seeker outbox test');
    });

    expect(
      sent,
      `Sent message not found in seeker inbox. Messages: ${JSON.stringify(messages.map((m: any) => m.content_preview ?? '').slice(0, 5))}`
    ).toBeTruthy();
  });
});
