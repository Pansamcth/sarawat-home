/**
 * =========================================================================
 * 🔔 SI-ROSTER AUDIO ENGINE (Apple-Style Minimalist Soft Chimes)
 * =========================================================================
 * - Uses Web Audio API for zero-latency, zero-bandwidth crystal clear sound
 * - Automatic audio context unlocking on user interaction (iOS/Android/Desktop)
 * - Minimalist soft tones designed specifically for school & quiet environments
 * =========================================================================
 */
(function (root) {
  'use strict';

  var AudioCtxClass = window.AudioContext || window.webkitAudioContext;
  var ctx = null;
  var isUnlocked = false;
  var lastPlayTimes = {};

  function getAudioContext() {
    if (!AudioCtxClass) return null;
    if (!ctx) {
      ctx = new AudioCtxClass();
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(function () {});
    }
    return ctx;
  }

  // Pre-unlock AudioContext on first user touch/click/key
  function unlockAudio() {
    if (isUnlocked) return;
    var c = getAudioContext();
    if (c) {
      if (c.state === 'suspended') {
        c.resume().then(function () {
          isUnlocked = true;
        }).catch(function () {});
      } else {
        isUnlocked = true;
      }
    }
    // Remove listeners once unlocked
    ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (evt) {
      window.removeEventListener(evt, unlockAudio, true);
    });
  }

  ['pointerdown', 'touchstart', 'click', 'keydown'].forEach(function (evt) {
    window.addEventListener(evt, unlockAudio, { once: true, passive: true, capture: true });
  });

  // Debounce check so sounds don't overlap awkwardly
  function shouldThrottle(soundKey, throttleMs) {
    var now = Date.now();
    var last = lastPlayTimes[soundKey] || 0;
    if (now - last < (throttleMs || 280)) {
      return true;
    }
    lastPlayTimes[soundKey] = now;
    return false;
  }

  /**
   * Play synthesized harmonic chime
   * @param {Array<{freq: number, delay: number, dur: number, gain: number, type?: OscillatorType}>} notes 
   * @param {number} masterVol Master volume scalar (default 0.28)
   */
  function synthesizeChime(notes, masterVol) {
    try {
      var c = getAudioContext();
      if (!c) return;

      if (c.state === 'suspended') {
        c.resume().catch(function () {});
      }

      var now = c.currentTime;
      var vol = typeof masterVol === 'number' ? masterVol : 0.28;

      var masterGain = c.createGain();
      masterGain.gain.setValueAtTime(vol, now);
      masterGain.connect(c.destination);

      notes.forEach(function (note) {
        var osc = c.createOscillator();
        var gain = c.createGain();
        var startTime = now + (note.delay || 0);
        var dur = note.dur || 0.7;
        var peakGain = note.gain || 0.35;

        osc.type = note.type || 'sine';
        osc.frequency.setValueAtTime(note.freq, startTime);

        // Soft attack to eliminate clicking sound
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.018);
        // Long, natural exponential decay (glass chime bell resonance)
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime);
        osc.stop(startTime + dur + 0.05);

        // Optional soft second harmonic overtone for warm acoustic realism
        if (note.harmonics) {
          var harmOsc = c.createOscillator();
          var harmGain = c.createGain();
          harmOsc.type = 'sine';
          harmOsc.frequency.setValueAtTime(note.freq * 2, startTime);
          harmGain.gain.setValueAtTime(0.0001, startTime);
          harmGain.gain.exponentialRampToValueAtTime(peakGain * 0.16, startTime + 0.015);
          harmGain.gain.exponentialRampToValueAtTime(0.0001, startTime + (dur * 0.55));
          harmOsc.connect(harmGain);
          harmGain.connect(masterGain);
          harmOsc.start(startTime);
          harmOsc.stop(startTime + dur + 0.05);
        }
      });
    } catch (e) {
      console.warn('[RosterAudio] Synthesize note error:', e);
    }
  }

  var RosterAudio = {
    /**
     * 1. ลงหน้าที่สำเร็จ (Duty Signup Success)
     * - Minimalist soft Apple-style glass chime (C6 -> E6 -> G6 -> C7)
     * - Sparkling, delightful, uplifting upward arpeggio
     */
    playSuccess: function () {
      if (shouldThrottle('success', 350)) return;
      synthesizeChime([
        { freq: 1046.50, delay: 0.00, dur: 0.95, gain: 0.40, harmonics: true }, // C6
        { freq: 1318.51, delay: 0.08, dur: 1.05, gain: 0.42, harmonics: true }, // E6
        { freq: 1567.98, delay: 0.16, dur: 1.20, gain: 0.45, harmonics: true }, // G6
        { freq: 2093.00, delay: 0.24, dur: 1.35, gain: 0.35, harmonics: true }  // C7
      ], 0.28);
    },

    /**
     * 2. ตรวจพบกิจกรรมใหม่ในหน้า Feed / มีการสร้างกิจกรรมใหม่ (New Activity Created / Announced)
     * - Pleasant modern dual-tone notification ping (A5 -> E6)
     * - Soft, polite bell ring
     */
    playNewActivity: function () {
      if (shouldThrottle('newActivity', 500)) return;
      synthesizeChime([
        { freq: 880.00,  delay: 0.00, dur: 0.65, gain: 0.38, harmonics: true }, // A5
        { freq: 1318.51, delay: 0.11, dur: 1.10, gain: 0.45, harmonics: true }  // E6
      ], 0.26);
    },

    /**
     * 3. แจ้งเตือนข้อผิดพลาด เช่น ลงชื่อซ้ำ หรือระบบแจ้งเตือน Error (Soft Warning)
     * - Gentle low-frequency double chime (Eb4 -> C4)
     * - Non-harsh, elegant soft bump
     */
    playError: function () {
      if (shouldThrottle('error', 350)) return;
      synthesizeChime([
        { freq: 311.13, delay: 0.00, dur: 0.25, gain: 0.25, harmonics: false }, // Eb4
        { freq: 261.63, delay: 0.10, dur: 0.45, gain: 0.30, harmonics: false }  // C4
      ], 0.24);
    },

    /**
     * 4. แอดมินสร้างหรือบันทึกกิจกรรมสำเร็จในระบบหลังบ้าน (Admin Action)
     * - Confident affirmative chime (F5 -> A5 -> C6)
     * - Crisp, clean, authoritative
     */
    playAdmin: function () {
      if (shouldThrottle('admin', 350)) return;
      synthesizeChime([
        { freq: 698.46,  delay: 0.00, dur: 0.55, gain: 0.35, harmonics: true }, // F5
        { freq: 880.00,  delay: 0.08, dur: 0.70, gain: 0.40, harmonics: true }, // A5
        { freq: 1046.50, delay: 0.16, dur: 0.95, gain: 0.42, harmonics: true }  // C6
      ], 0.28);
    },

    /**
     * Manual unlock helper
     */
    unlock: function () {
      unlockAudio();
    }
  };

  root.RosterAudio = RosterAudio;
})(window);
