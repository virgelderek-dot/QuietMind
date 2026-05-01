export function createWavHeader(pcmLength: number, sampleRate: number = 24000) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + pcmLength, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, pcmLength, true);

  return header;
}

export function wrapPcmInWav(base64Pcm: string, sampleRate: number = 24000): string | null {
  try {
    const binaryString = atob(base64Pcm);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Ensure we have an even number of bytes for 16-bit PCM (2 bytes per sample)
    const pcmData = bytes.length % 2 === 0 ? bytes : bytes.slice(0, -1);
    
    const wavHeader = createWavHeader(pcmData.length, sampleRate);
    const wavBlob = new Blob([wavHeader, pcmData], { type: 'audio/wav' });
    return URL.createObjectURL(wavBlob);
  } catch (e) {
    console.error("Error wrapping PCM in WAV:", e instanceof Error ? e.message : String(e));
    return null;
  }
}

export const cn = (...classes: (string | boolean | undefined)[]) => {
  return classes.filter(Boolean).join(' ');
};

export const getWordCount = (text: string) => text.split(/\s+/).filter(w => w.length > 0).length;
