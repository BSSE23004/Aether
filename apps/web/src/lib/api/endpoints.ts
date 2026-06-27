/**
 * API endpoints
 */

export const endpoints = {
  // Auth
  auth: {
    nonce: '/api/auth/nonce',
    login: '/api/auth/login',
    verify: '/api/auth/verify',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    profile: '/api/auth/profile',
  },

  // Users
  users: {
    list: '/api/users',
    detail: (id: string) => `/api/users/${id}`,
    profile: (address: string) => `/api/users/${address}/profile`,
    update: (id: string) => `/api/users/${id}`,
  },

  // Communities
  communities: {
    list: '/api/communities',
    detail: (id: string) => `/api/communities/${id}`,
    join: (id: string) => `/api/communities/${id}/join`,
    leave: (id: string) => `/api/communities/${id}/leave`,
    members: (id: string) => `/api/communities/${id}/members`,
    create: '/api/communities',
    channels: (id: string) => `/api/communities/${id}/channels`,
  },

  // Channels
  channels: {
    list: (communityId: string) => `/api/communities/${communityId}/channels`,
    detail: (id: string) => `/api/channels/${id}`,
    create: (communityId: string) => `/api/communities/${communityId}/channels`,
    update: (id: string) => `/api/channels/${id}`,
    delete: (id: string) => `/api/channels/${id}`,
  },

  // Messages
  messages: {
    list: (channelId: string) => `/api/channels/${channelId}/messages`,
    send: (channelId: string) => `/api/channels/${channelId}/messages`,
    detail: (channelId: string, messageId: string) => 
      `/api/channels/${channelId}/messages/${messageId}`,
    delete: (channelId: string, messageId: string) =>
      `/api/channels/${channelId}/messages/${messageId}`,
  },

  // Proposals
  proposals: {
    list: (communityId: string) => `/api/communities/${communityId}/proposals`,
    detail: (communityId: string, proposalId: string) =>
      `/api/communities/${communityId}/proposals/${proposalId}`,
    create: (communityId: string) => `/api/communities/${communityId}/proposals`,
    vote: (communityId: string, proposalId: string) =>
      `/api/communities/${communityId}/proposals/${proposalId}/vote`,
  },

  // Files
  files: {
    list: '/api/files',
    upload: '/api/files/upload',
    detail: (id: string) => `/api/files/${id}`,
    delete: (id: string) => `/api/files/${id}`,
  },

  // Search
  search: {
    global: '/api/search',
    communities: '/api/search/communities',
    users: '/api/search/users',
    messages: '/api/search/messages',
  },
} as const;
