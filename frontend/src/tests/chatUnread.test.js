import test from "node:test";
import assert from "node:assert/strict";

const {
  buildConversationSnapshot,
  filterConversationSnapshot,
  getLastMessagePreview,
} = await import("../lib/chatUnread.js");

function fakeChannel({ otherUserId, unreadMessages, text, createdAt }) {
  return {
    countUnread: () => unreadMessages,
    state: {
      members: {
        me: { user: { id: "me", name: "Me" } },
        other: { user: { id: otherUserId, name: `User ${otherUserId}` } },
      },
      messages: [
        {
          text,
          created_at: createdAt,
        },
      ],
    },
    data: {},
  };
}

test("chat unread badge counts conversations instead of individual messages", () => {
  const snapshot = buildConversationSnapshot(
    [
      fakeChannel({
        otherUserId: "a",
        unreadMessages: 5,
        text: "Five messages here",
        createdAt: "2026-08-19T10:00:00.000Z",
      }),
      fakeChannel({
        otherUserId: "b",
        unreadMessages: 2,
        text: "Two messages here",
        createdAt: "2026-08-19T11:00:00.000Z",
      }),
      fakeChannel({
        otherUserId: "c",
        unreadMessages: 0,
        text: "Already read",
        createdAt: "2026-08-19T12:00:00.000Z",
      }),
    ],
    "me"
  );

  assert.equal(snapshot.unreadConversationCount, 2);
  assert.equal(snapshot.byUserId.a.hasUnread, true);
  assert.equal(snapshot.byUserId.b.hasUnread, true);
  assert.equal(snapshot.byUserId.c.hasUnread, false);
});

test("multiple unread messages from one person still count as one unread conversation", () => {
  const snapshot = buildConversationSnapshot(
    [
      fakeChannel({
        otherUserId: "friend",
        unreadMessages: 18,
        text: "Latest message",
        createdAt: "2026-08-19T12:00:00.000Z",
      }),
    ],
    "me"
  );

  assert.equal(snapshot.unreadConversationCount, 1);
});

test("chat preview falls back safely for attachment-only messages", () => {
  assert.equal(getLastMessagePreview({ attachments: [{}] }), "Attachment");
  assert.equal(getLastMessagePreview({}), "Private conversation");
});


test("chat unread snapshot excludes conversations that are no longer friends", () => {
  const snapshot = buildConversationSnapshot(
    [
      fakeChannel({
        otherUserId: "friend",
        unreadMessages: 3,
        text: "Friend message",
        createdAt: "2026-08-19T12:00:00.000Z",
      }),
      fakeChannel({
        otherUserId: "removed",
        unreadMessages: 4,
        text: "Old conversation",
        createdAt: "2026-08-19T13:00:00.000Z",
      }),
    ],
    "me"
  );

  const filtered = filterConversationSnapshot(snapshot, ["friend"]);

  assert.equal(filtered.unreadConversationCount, 1);
  assert.equal(Boolean(filtered.byUserId.friend), true);
  assert.equal(Boolean(filtered.byUserId.removed), false);
});
