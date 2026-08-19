import { create } from "zustand";

const initialState = {
  unreadConversationCount: 0,
  conversationsByUserId: {},
};

export const useChatUnreadStore = create((set) => ({
  ...initialState,
  setSnapshot: ({ unreadConversationCount = 0, byUserId = {} } = {}) =>
    set({
      unreadConversationCount,
      conversationsByUserId: byUserId,
    }),
  reset: () => set(initialState),
}));
