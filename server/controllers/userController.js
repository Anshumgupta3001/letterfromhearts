// Mock user — replace with DB queries once MongoDB is connected
const mockUser = {
  id: 'user-1',
  name: 'Divya',
  email: 'divya@example.com',
  avatar: 'D',
  weeklyStats: {
    written: 3,
    heard: 2,
    repliedTo: 4,
    wroteBack: 2,
  },
  listenerCap: {
    used: 2,
    total: 5,
  },
  totals: {
    written: 7,
    repliedTo: 3,
    capsule: 1,
    released: 1,
  },
}

// GET /api/users/me
export function getMe(req, res) {
  res.json({ success: true, data: mockUser })
}

// GET /api/users/me/stats
export function getMyStats(req, res) {
  res.json({
    success: true,
    data: {
      weekly: mockUser.weeklyStats,
      totals: mockUser.totals,
      listenerCap: mockUser.listenerCap,
    },
  })
}
