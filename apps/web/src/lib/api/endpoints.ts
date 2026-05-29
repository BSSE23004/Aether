/**
 * API endpoints
 */

export const endpoints = {
  // Auth
  auth: {
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
  },

  // Messages
  messages: {
    list: (communityId: string) => `/api/communities/${communityId}/messages`,
    send: (communityId: string) => `/api/communities/${communityId}/messages`,
    detail: (communityId: string, messageId: string) => 
      `/api/communities/${communityId}/messages/${messageId}`,
    delete: (communityId: string, messageId: string) =>
      `/api/communities/${communityId}/messages/${messageId}`,
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
