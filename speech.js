const speech = (() => {
  const synth = window.speechSynthesis;
  let voices = [];
  let voicePreference = 'us'; // 'us' | 'uk-female'

  function loadVoices() { voices = synth.getVoices(); }
  loadVoices();
  // Chrome loads voices asynchronously — must use this event or getVoices() returns []
  if ('onvoiceschanged' in synth) synth.onvoiceschanged = loadVoices;

  function bestVoice() {
    if (voicePreference === 'uk-female') {
      return (
        voices.find(v => v.name === 'Google UK English Female') ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0] || null
      );
    }
    return (
      voices.find(v => v.name === 'Google US English') ||
      voices.find(v => /Microsoft.*Natural/.test(v.name) && v.lang === 'en-US') ||
      voices.find(v => v.name.startsWith('Google') && v.lang === 'en-US') ||
      voices.find(v => v.lang === 'en-US') ||
      voices.find(v => v.lang.startsWith('en')) ||
      voices[0] || null
    );
  }

  function setVoicePreference(pref) { voicePreference = pref; }

  function listVoices() {
    console.table(voices.map(v => ({ name: v.name, lang: v.lang, local: v.localService })));
  }

  function utter(text, rate = 0.85, pitch = 1.1) {
    const u = new SpeechSynthesisUtterance(text);
    u.voice = bestVoice();
    u.rate  = rate;
    u.pitch = pitch;
    return u;
  }

  // Speak a single phrase (cancels anything in progress)
  function speak(text) {
    synth.cancel();
    synth.speak(utter(text));
  }

  // Speak just the word clearly — no letter-by-letter follow-up
  function speakWord(word) {
    speak(word);
  }

  return { speak, speakWord, setVoicePreference, listVoices };
})();
