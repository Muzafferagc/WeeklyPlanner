// Generate a 1-second 880Hz/1760Hz digital alarm chime WAV file as a base64 Data URI
const fs = require('fs');

function generateWavDataUri() {
  const sampleRate = 22050;
  const duration = 1.0;
  const numSamples = Math.floor(sampleRate * duration);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Generate double beep (880Hz A5 & 1760Hz A6)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sample = 0;

    // Beep 1: 0.0s to 0.15s (880Hz)
    if (t >= 0.0 && t < 0.15) {
      sample = Math.sin(2 * Math.PI * 880 * t) * 0.7;
    }
    // Beep 2: 0.2s to 0.35s (1760Hz)
    else if (t >= 0.2 && t < 0.35) {
      sample = Math.sin(2 * Math.PI * 1760 * t) * 0.8;
    }
    // Beep 3: 0.4s to 0.55s (880Hz)
    else if (t >= 0.4 && t < 0.55) {
      sample = Math.sin(2 * Math.PI * 880 * t) * 0.7;
    }
    // Beep 4: 0.6s to 0.75s (1760Hz)
    else if (t >= 0.6 && t < 0.75) {
      sample = Math.sin(2 * Math.PI * 1760 * t) * 0.8;
    }

    const intSample = Math.floor(sample * 32767);
    buffer.writeInt16LE(Math.max(-32768, Math.min(32767, intSample)), 44 + i * 2);
  }

  const base64 = buffer.toString('base64');
  return `data:audio/wav;base64,${base64}`;
}

const dataUri = generateWavDataUri();
console.log(dataUri);
fs.writeFileSync('scratch/alarm_data_uri.txt', dataUri);
