// src/data/focusTracks.js
// ─────────────────────────────────────────────────────────────────
// Focus soundscape catalog. Audio files live in client/public/audio/
// so they deploy with the site and stream directly — `src` is the
// public URL the global player loads.
// `image` is an atmospheric photo (Unsplash CDN); the gradient is
// the fallback / tint behind it while it loads.
// ─────────────────────────────────────────────────────────────────

export const FOCUS_CATEGORIES = [
  { id: 'all',      label: 'All sounds' },
  { id: 'calm',     label: 'Rest your mind' },
  { id: 'meditate', label: 'Inner peace' },
  { id: 'flute',    label: 'Bansuri' },
  { id: 'nature',   label: 'Nature' },
]

// Cool clinical gradients — used as album-art fallbacks and tints
const G = {
  terracotta: 'linear-gradient(135deg, #F4813F 0%, #6FA0BE 100%)',
  gold:       'linear-gradient(135deg, #E06B28 0%, #D98E78 100%)',
  dusk:       'linear-gradient(135deg, #E06B28 0%, #6E8CA0 100%)',
  sage:       'linear-gradient(135deg, #2E7D5B 0%, #86B49A 100%)',
  river:      'linear-gradient(135deg, #35667F 0%, #7FB0C6 100%)',
  plum:       'linear-gradient(135deg, #5C4FA8 0%, #A99ECB 100%)',
  ember:      'linear-gradient(135deg, #E06B28 0%, #D98E78 100%)',
  moss:       'linear-gradient(135deg, #46765C 0%, #82A98F 100%)',
}

const img = (id, w = 640) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=60`

export const FOCUS_TRACKS = [
  // ── Rest your mind ──────────────────────────────────────────────
  { id: 'rest-your-mind-1', title: 'Rest Your Mind I',   subtitle: 'A soft place to land when the day gets loud.',        emoji: '🌙', gradient: G.terracotta, duration: '2:34', category: 'calm', src: '/audio/rest-your-mind-1.mp3', image: img('photo-1455390582262-044cdead277a', 1200) },
  { id: 'rest-your-mind-2', title: 'Rest Your Mind II',  subtitle: 'Slow, warm tones for unwinding.',                     emoji: '🕯️', gradient: G.dusk,       duration: '3:14', category: 'calm', src: '/audio/rest-your-mind-2.mp3', image: img('photo-1517842645767-c639042777db') },
  { id: 'rest-your-mind-3', title: 'Rest Your Mind III', subtitle: 'Gentle drift for quiet evenings.',                    emoji: '🌘', gradient: G.plum,       duration: '3:12', category: 'calm', src: '/audio/rest-your-mind-3.mp3', image: img('photo-1519681393784-d120267933ba') },
  { id: 'rest-your-mind-4', title: 'Rest Your Mind IV',  subtitle: 'Let your thoughts settle like dust in sunlight.',     emoji: '🫖', gradient: G.gold,       duration: '3:09', category: 'calm', src: '/audio/rest-your-mind-4.mp3', image: img('photo-1507525428034-b723cf961d3e') },
  { id: 'rest-your-mind-5', title: 'Rest Your Mind V',   subtitle: 'The long exhale at the end of the day.',              emoji: '🌌', gradient: G.ember,      duration: '3:32', category: 'calm', src: '/audio/rest-your-mind-5.mp3', image: img('photo-1470770841072-f978cf4d019e') },

  // ── Inner peace ─────────────────────────────────────────────────
  { id: 'inner-peace-1',        title: 'Inner Peace I',        subtitle: 'Stillness you can sink into while you write.', emoji: '🧘', gradient: G.sage,  duration: '2:49', category: 'meditate', src: '/audio/inner-peace-1.mp3', image: img('photo-1518495973542-4542c06a5843') },
  { id: 'inner-peace-2',        title: 'Inner Peace II',       subtitle: 'Deep calm for slow breathing.',                emoji: '🌾', gradient: G.moss,  duration: '3:30', category: 'meditate', src: '/audio/inner-peace-2.mp3', image: img('photo-1499209974431-9dddcece7f88') },
  { id: 'inner-peace-3',        title: 'Inner Peace III',      subtitle: 'A quiet center in a busy day.',                emoji: '🪷', gradient: G.plum,  duration: '3:05', category: 'meditate', src: '/audio/inner-peace-3.mp3', image: img('photo-1472396961693-142e6e269027') },
  { id: 'inner-peace-4',        title: 'Inner Peace IV',       subtitle: 'Soft light through a closed eyelid.',          emoji: '🌸', gradient: G.dusk,  duration: '2:43', category: 'meditate', src: '/audio/inner-peace-4.mp3', image: img('photo-1490730141103-6cac27aaab94') },
  { id: 'inner-peace-5',        title: 'Inner Peace V',        subtitle: 'For meditation, or simply being still.',       emoji: '🕊️', gradient: G.river, duration: '2:59', category: 'meditate', src: '/audio/inner-peace-5.mp3', image: img('photo-1475924156734-496f6cac6ec1') },
  { id: 'sound-of-inner-peace', title: 'The Sound of Inner Peace', subtitle: 'A long, unhurried soundscape of calm.',    emoji: '💫', gradient: G.gold,  duration: '3:22', category: 'meditate', src: '/audio/sound-of-inner-peace.mp3', image: img('photo-1419242902214-272b3f66ee7a') },
  { id: 'tibetan-healing-1',    title: 'Tibetan Healing Sounds I',  subtitle: 'Singing bowls that clear the air.',       emoji: '🎐', gradient: G.ember, duration: '2:48', category: 'meditate', src: '/audio/tibetan-healing-1.mp3', image: img('photo-1472214103451-9374bd1c798e') },
  { id: 'tibetan-healing-2',    title: 'Tibetan Healing Sounds II', subtitle: 'Resonant bowls, slow and grounding.',     emoji: '🔔', gradient: G.terracotta, duration: '3:04', category: 'meditate', src: '/audio/tibetan-healing-2.mp3', image: img('photo-1506905925346-21bda4d32df4') },

  // ── Bansuri ─────────────────────────────────────────────────────
  { id: 'bansuri-1', title: 'Bansuri I',    subtitle: 'Bamboo flute, tender and unhurried.',       emoji: '🎋', gradient: G.sage,       duration: '2:41', category: 'flute', src: '/audio/bansuri-1.mp3', image: img('photo-1447752875215-b2761acb3c5d') },
  { id: 'bansuri-2', title: 'Bansuri II',   subtitle: 'A melody that wanders like a river.',       emoji: '🪈', gradient: G.river,      duration: '3:03', category: 'flute', src: '/audio/bansuri-2.mp3', image: img('photo-1469474968028-56623f02e42e') },
  { id: 'bansuri-3', title: 'Bansuri III',  subtitle: 'Morning raga for fresh starts.',            emoji: '🌅', gradient: G.gold,       duration: '2:34', category: 'flute', src: '/audio/bansuri-3.mp3', image: img('photo-1501785888041-af3ef285b470') },
  { id: 'bansuri-4', title: 'Bansuri IV',   subtitle: 'Breath turned into song.',                  emoji: '🍃', gradient: G.moss,       duration: '2:40', category: 'flute', src: '/audio/bansuri-4.mp3', image: img('photo-1426604966848-d7adac402bff') },
  { id: 'bansuri-5', title: 'Bansuri V',    subtitle: 'Flute over a still evening.',               emoji: '🌆', gradient: G.dusk,       duration: '3:08', category: 'flute', src: '/audio/bansuri-5.mp3', image: img('photo-1454496522488-7a8e488e8606') },
  { id: 'bansuri-6', title: 'Bansuri VI',   subtitle: 'Long, low notes for deep focus.',           emoji: '🎶', gradient: G.terracotta, duration: '3:30', category: 'flute', src: '/audio/bansuri-6.mp3', image: img('photo-1433086966358-54859d0ed716') },
  { id: 'bansuri-7', title: 'Bansuri VII',  subtitle: 'Light as air, steady as breath.',           emoji: '🦚', gradient: G.plum,       duration: '2:38', category: 'flute', src: '/audio/bansuri-7.mp3', image: img('photo-1465146344425-f00d5f5c8f07') },
  { id: 'bansuri-8', title: 'Bansuri VIII', subtitle: 'The longest journey of the flute set.',     emoji: '🌠', gradient: G.ember,      duration: '3:40', category: 'flute', src: '/audio/bansuri-8.mp3', image: img('photo-1464822759023-fed622ff2c3b') },

  // ── Nature ──────────────────────────────────────────────────────
  { id: 'rain-river-1',       title: 'Rain & River I',            subtitle: 'Rainfall meeting moving water.',           emoji: '🌧️', gradient: G.river, duration: '3:04', category: 'nature', src: '/audio/rain-river-1.mp3', image: img('photo-1515694346937-94d85e41e6f0') },
  { id: 'rain-river-2',       title: 'Rain & River II',           subtitle: 'A steady downpour over the current.',      emoji: '💧', gradient: G.dusk,  duration: '2:47', category: 'nature', src: '/audio/rain-river-2.mp3', image: img('photo-1506744038136-46273834b3fb') },
  { id: 'rain-river-3',       title: 'Rain & River III',          subtitle: 'Water on water, endlessly patient.',       emoji: '🌊', gradient: G.moss,  duration: '3:13', category: 'nature', src: '/audio/rain-river-3.mp3', image: img('photo-1470071459604-3b5ec3a7fe05') },
  { id: 'mountain-stream',    title: 'Mountain Stream Serenade',  subtitle: 'A clear stream tumbling downhill.',        emoji: '⛰️', gradient: G.sage,  duration: '2:49', category: 'nature', src: '/audio/mountain-stream.mp3', image: img('photo-1444464666168-49d633b86797') },
  { id: 'whispering-pines-1', title: 'Whispering Pines I',        subtitle: 'Wind moving through tall trees.',          emoji: '🌲', gradient: G.moss,  duration: '2:12', category: 'nature', src: '/audio/whispering-pines-1.mp3', image: img('photo-1418065460487-3e41a6c84dc5') },
  { id: 'whispering-pines-2', title: 'Whispering Pines II',       subtitle: 'The forest, breathing slowly.',            emoji: '🌫️', gradient: G.sage,  duration: '2:29', category: 'nature', src: '/audio/whispering-pines-2.mp3', image: img('photo-1441974231531-c6227db76b6e') },
  { id: 'autumn-leaves-1',    title: 'Autumn Leaves I',           subtitle: 'Warm, wistful tones for golden hours.',    emoji: '🍂', gradient: G.gold,  duration: '2:52', category: 'nature', src: '/audio/autumn-leaves-1.mp3', image: img('photo-1476820865390-c52aeebb9891') },
  { id: 'autumn-leaves-2',    title: 'Autumn Leaves II',          subtitle: 'Falling slowly, landing softly.',          emoji: '🍁', gradient: G.ember, duration: '2:57', category: 'nature', src: '/audio/autumn-leaves-2.mp3', image: img('photo-1470252649378-9c29740c9fa8') },
]
