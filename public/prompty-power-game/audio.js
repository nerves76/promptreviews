/**
 * Audio System for Prompty Power Game
 * Handles all sound effects and melodies using Web Audio API
 */

// Global audio context
let audioContext = null;
let audioInitialized = false;

// Sound cooldown system to prevent too much audio
let lastShootTime = 0;
let lastHitTime = 0;
let lastEmojiHitTime = 0;
let lastBounceTime = 0;
const SHOOT_COOLDOWN = 200; // 200ms between shoot sounds
const HIT_COOLDOWN = 150; // 150ms between hit sounds
const EMOJI_HIT_COOLDOWN = 100; // 100ms between emoji hit sounds
const BOUNCE_COOLDOWN = 300; // 300ms between bounce sounds

// Melody definitions (frequency sequences using C major scale)
const melodies = {
    shoot: [523, 659, 784], // C, E, G (C major triad)
    hit: [523, 494, 440], // C, B, A (descending)
    convert: [523, 659, 784, 1047], // C, E, G, C (ascending C major)
    laser: [220, 196, 175, 147], // A, G, F, D (descending ominous)
    karenHit: [147, 131, 117, 98], // D, C, B, G (very low descending)
    gameOver: [131, 117, 98, 87], // C, B, G, F (very low descending)
    doorOpen: [523, 659, 784, 1047], // C, E, G, C (ascending)
    bounce: [659, 784, 1047, 1175], // E, G, C, D (bouncy ascending)
    levelUp: [523, 659, 784, 1047, 1175, 1319, 1047, 784, 659, 523], // Full C major scale up and down
    spawn: [784, 1047, 1175, 1319], // G, C, D, E (ascending)
    hurt: [220, 196, 175, 147], // A, G, F, D (low descending)
    oof: [147, 131, 117, 98], // D, C, B, G (very low descending)
    emojiHit: [440, 494, 523, 587], // A, B, C, D (medium ascending)
    talking: [349, 392, 440, 392, 349], // F, G, A, G, F (conversational)
    doorCreak: [196, 175, 147, 131], // G, F, D, C (low descending)
    karenAppear: [98, 147, 196, 147, 98, 87], // G, D, G, D, G, F (ominous)
    ouch: [196, 175, 147, 131] // G, F, D, C (low descending)
};

// Initialize audio context on first user interaction
function initAudio() {
    if (!audioInitialized) {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioInitialized = true;
            console.log('Audio context initialized successfully');
        } catch (error) {
            console.error('Failed to initialize audio context:', error);
        }
    }
}

// Create a single note with envelope
function createNote(frequency, startTime, duration = 0.1, waveType = 'sine') {
    if (!audioContext) return;
    
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(frequency, startTime);
    oscillator.type = waveType;
    
    // Create envelope for natural sound
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
}

// Play a melody (sequence of notes)
function playMelody(melodyName) {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }
    
    const frequencies = melodies[melodyName];
    if (!frequencies) {
        console.warn('Melody not found:', melodyName);
        return;
    }
    
    const startTime = audioContext.currentTime;
    const noteDuration = 0.12; // Longer notes for more musical sound
    const noteGap = 0.03; // Slightly longer gap between notes
    
    // Choose wave type based on melody
    let waveType = 'sine';
    if (melodyName === 'laser' || melodyName === 'karenAppear') {
        waveType = 'sawtooth'; // More ominous for laser and Karen
    } else if (melodyName === 'levelUp' || melodyName === 'convert') {
        waveType = 'triangle'; // More musical for positive events
    } else if (melodyName === 'hit' || melodyName === 'hurt' || melodyName === 'ouch') {
        waveType = 'square'; // More percussive for impact sounds
    }
    
    frequencies.forEach((frequency, index) => {
        const noteStartTime = startTime + (index * (noteDuration + noteGap));
        createNote(frequency, noteStartTime, noteDuration, waveType);
    });
}

// Play sound function (now plays melodies instead of single frequencies)
function playSound(soundName) {
    try {
        const currentTime = Date.now();
        
        // Apply cooldowns for frequent sounds
        if (soundName === 'shoot') {
            if (currentTime - lastShootTime < SHOOT_COOLDOWN) {
                return; // Skip if too soon
            }
            lastShootTime = currentTime;
        } else if (soundName === 'hit') {
            if (currentTime - lastHitTime < HIT_COOLDOWN) {
                return; // Skip if too soon
            }
            lastHitTime = currentTime;
        } else if (soundName === 'emojiHit') {
            if (currentTime - lastEmojiHitTime < EMOJI_HIT_COOLDOWN) {
                return; // Skip if too soon
            }
            lastEmojiHitTime = currentTime;
        } else if (soundName === 'bounce') {
            if (currentTime - lastBounceTime < BOUNCE_COOLDOWN) {
                return; // Skip if too soon
            }
            lastBounceTime = currentTime;
        }
        
        playMelody(soundName);
    } catch (error) {
        console.error('Error playing sound:', soundName, error);
    }
}

// Special function for triple ouch sound (plays 3 times quickly)
function playTripleOuch() {
    try {
        // Simplified to prevent timing issues
        playMelody('ouch');
    } catch (error) {
        console.error('Error playing triple ouch:', error);
    }
}

// Special function for level up melody (more complex and celebratory)
function playLevelUpMelody() {
    if (!audioContext) {
        initAudio();
        if (!audioContext) return;
    }
    
    try {
        // Simplified level up melody to prevent freezes
        const startTime = audioContext.currentTime;
        
        // Create a simple victory melody
        const melody = [
            { freq: 523, duration: 0.2 }, // C
            { freq: 659, duration: 0.2 }, // E
            { freq: 784, duration: 0.3 }  // G
        ];
        
        melody.forEach((note, index) => {
            const noteStartTime = startTime + (index * 0.25);
            createNote(note.freq, noteStartTime, note.duration, 'triangle');
        });
    } catch (error) {
        console.error('Error playing level up melody:', error);
    }
}

// Test individual sound function
function testSound(soundName) {
    console.log('=== Testing melody:', soundName, '===');
    playSound(soundName);
}

// Test all sounds function
function testAllSounds() {
    console.log('=== Starting comprehensive melody test ===');
    
    // Initialize audio first
    initAudio();
    
    const testSounds = Object.keys(melodies);
    
    console.log('Testing all melodies...');
    testSounds.forEach((sound, index) => {
        setTimeout(() => {
            console.log('Testing melody:', sound, `(${index + 1}/${testSounds.length})`);
            playSound(sound);
        }, index * 1000); // Play each melody 1 second apart for better testing
    });
}

// Export functions for use in other files
window.playSound = playSound;
window.playTripleOuch = playTripleOuch;
window.playLevelUpMelody = playLevelUpMelody;
window.testSound = testSound;
window.testAllSounds = testAllSounds;
window.initAudio = initAudio; 