import React, { useState, useRef } from "react";
import "./App.css";

const SUGGESTIONS_HOME = [
  "Tell me a joke",
  "Generate a sunset image",
  "Sing me a happy tune",
  "Write a poem about AI",
  "Draw a cat astronaut"
];
const SUGGESTIONS_CHAT = [
  "What's the weather?",
  "Tell me a joke.",
  "Explain quantum computing simply.",
  "Summarize latest tech news.",
  "What is Everything-AI?"
];
const SUGGESTIONS_IMAGE = [
  "A cyberpunk cityscape at night",
  "Van Gogh style sunflower field",
  "Astronaut cat on Mars",
  "A magical forest with glowing plants",
  "Futuristic underwater city"
];
const SUGGESTIONS_VOICE = [
  "Read a bedtime story",
  "Sing happy birthday",
  "Give me a fun fact",
  "Make me laugh",
  "Say hello in French"
];
const MODES = ["chat", "image", "voice", "video"];
const MODE_LABELS = { chat: "Chat", image: "Image", voice: "Voice", video: "Video" };

function App() {
  // Local states for each section—a true isolation fix!
  const [mode, setMode] = useState(null);

  // Home search state
  const [homeInput, setHomeInput] = useState("");

  // These suggestion/autofill props are now removed from global state,
  // handled LOCALLY in each section, so output isn't shared across modes.
  const sectionRefs = {
    chat: useRef(),
    image: useRef(),
    voice: useRef(),
  };

  // Mode-switch: resets mode and separate page states
  function goHome() {
    setMode(null);
    setHomeInput("");
  }

  // Home search (functional): sends to chat page with input value
  function handleHomeSearch() {
    if (homeInput.trim()) {
      setMode("chat");
      setTimeout(() => {
        if (sectionRefs.chat.current) sectionRefs.chat.current.autofillAndSend(homeInput.trim());
      }, 30);
    }
  }
  // If Enter in home input, send to chat
  function handleHomeKey(e) {
    if (e.key === "Enter" && homeInput.trim()) handleHomeSearch();
  }
  // Suggestion on home: pick best mode and send immediately
  function handleHomeSuggestion(text) {
    let nextMode = "chat";
    if (/image|draw|picture/i.test(text)) nextMode = "image";
    else if (/song|sing|tune|voice/i.test(text)) nextMode = "voice";
    setMode(nextMode);
    setTimeout(() => {
      if (sectionRefs[nextMode] && sectionRefs[nextMode].current)
        sectionRefs[nextMode].current.autofillAndSend(text);
    }, 40);
  }

  return (
    <div className="app-shell">
      <header className="nav">
        <button className="brand home-btn" onClick={goHome} aria-label="Home">
          <span className="brand-logo" aria-hidden>⌂</span> Everything⚛AI
        </button>
        <div className="nav-btns">
          {MODES.map(m => (
            <button
              key={m}
              className={`nav-btn${mode === m ? " active" : ""}${m === "video" ? " disabled" : ""}`}
              disabled={false}
              onClick={() => setMode(m)}
              tabIndex={0}
              aria-current={mode === m}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      </header>
      <main className="main">
        {!mode && (
          <HomePage
            searchValue={homeInput}
            setSearchValue={setHomeInput}
            onHomeKey={handleHomeKey}
            onHomeSearch={handleHomeSearch}
            suggestions={SUGGESTIONS_HOME}
            onSuggestionClick={handleHomeSuggestion}
          />
        )}
        {mode === "chat" && (
          <ChatPage
            ref={sectionRefs.chat}
            goHome={goHome}
            suggestions={SUGGESTIONS_CHAT}
          />
        )}
        {mode === "image" && (
          <ImagePage
            ref={sectionRefs.image}
            goHome={goHome}
            suggestions={SUGGESTIONS_IMAGE}
          />
        )}
        {mode === "voice" && (
          <VoicePage
            ref={sectionRefs.voice}
            goHome={goHome}
            suggestions={SUGGESTIONS_VOICE}
          />
        )}
        {mode === "video" && <VideoPage goHome={goHome} />}
      </main>
    </div>
  );
}

// --- HOME PAGE (search is live and functional) ---
function HomePage({ searchValue, setSearchValue, onHomeKey, onHomeSearch, suggestions, onSuggestionClick }) {
  return (
    <section className="home-wrap">
      <div className="center-col">
        <h1 className="huge-header">Everything⚛AI</h1>
        <div className="subheading">Type once. Get a Chat, Image, or Voice reply — all in one place.</div>
        <div className="search-bar-row">
          <input
            type="text"
            placeholder="type a message.."
            className="search-input"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onKeyDown={onHomeKey}
          />
          <button
            className="search-send-btn"
            onClick={onHomeSearch}
            disabled={!searchValue.trim()}
            tabIndex={0}
            aria-label="Search"
          >
            <span role="img" aria-label="search">➤</span>
          </button>
        </div>
        <div className="suggest">
          <div className="suggest-label">Suggestions:</div>
          <div className="suggest-bar">
            {suggestions.map((sug, i) => (
              <button className="suggest-pill" key={i} onClick={() => onSuggestionClick(sug)}>
                {sug}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// --- CHAT PAGE ---
const ChatPage = React.forwardRef(function ChatPage({ goHome, suggestions }, ref) {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { from: "ai", text: "Hello! How can I help you?" }
  ]);
  const [loading, setLoading] = useState(false);

  // For autofilling from Home suggestions, exposes a method to parent!
  React.useImperativeHandle(ref, () => ({
    autofillAndSend: (text) => {
      setInput(text);
      setTimeout(() => handleSend(text), 40);
    }
  }));

  async function handleSend(txt) {
    const val = (typeof txt === "string" ? txt : input).trim();
    if (!val) return;
    setMessages(msgs => [...msgs, { from: "user", text: val }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch(`https://text.pollinations.ai/${encodeURIComponent(val)}`);
      const aiText = await res.text();
      setMessages(msgs => [...msgs, { from: "ai", text: aiText }]);
    } catch {
      setMessages(msgs => [...msgs, { from: "ai", text: "Network error." }]);
    }
    setLoading(false);
  }
  function clearAll() {
    setMessages([{ from: "ai", text: "Hello! How can I help you?" }]);
    setInput("");
  }
  function handleSuggestClick(sug) {
    setInput(sug);
    setTimeout(() => handleSend(sug), 40);
  }
  return (
    <div className="mode-page chat-templ">
      <button className="back-btn" onClick={goHome}>⬅ Home</button>
      <h2 className="page-title">Chat</h2>
      <div className="chat-bubbles">
        {messages.map((msg, i) => (
          <div key={i} className={"bubble" + (msg.from === "user" ? " right" : "")}>
            {msg.text}
          </div>
        ))}
        {loading && <div className="bubble">...</div>}
      </div>
      <div className="input-row">
        <input
          placeholder="Type a message.."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          className="input"
          disabled={loading}
        />
        <button className="button" onClick={handleSend} disabled={loading || !input.trim()}>Send ➤</button>
        <button className="button clear" onClick={clearAll}>Clear ⌫ </button>
      </div>
      <div className="section-suggest-bar">
        <div className="suggest-label">Suggestions:</div>  
        {suggestions.map((sug, i) => (
          <button className="suggest-pill" key={i} onClick={() => handleSuggestClick(sug)}>
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
});

// --- IMAGE PAGE ---
const ImagePage = React.forwardRef(function ImagePage({ goHome, suggestions }, ref) {
  const [input, setInput] = useState("");
  const [imgUrl, setImgUrl] = useState(null);

  React.useImperativeHandle(ref, () => ({
    autofillAndSend: (text) => {
      setInput(text);
      setTimeout(() => handleGen(text), 40);
    }
  }));

  function handleGen(val) {
    const text = (typeof val === "string" ? val : input).trim();
    if (!text) return;
    setImgUrl(`https://image.pollinations.ai/prompt/${encodeURIComponent(text)}`);
  }
  function clearAll() {
    setInput("");
    setImgUrl(null);
  }
  function handleSuggestClick(sug) {
    setInput(sug);
    setTimeout(() => handleGen(sug), 40);
  }
  return (
    <div className="mode-page image-templ">
      <button className="back-btn" onClick={goHome}>⬅ Home</button>
      <h2 className="page-title">Image</h2>
      <div className="input-row">
        <input
          placeholder="Type a message.."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleGen()}
          className="input"
        />
        <button className="button" onClick={handleGen} disabled={!input.trim()}>Generate ✦︎</button>
        <button className="button clear" onClick={clearAll}>Clear ⌫</button>
      </div>
      <div style={{ minHeight: "5px", margin: "24px 0" }}>
        {imgUrl &&
          <div>
            <img src={imgUrl} alt="Output" className="image-output" />
            <a href={imgUrl} download="image.png" className="button">Download ⬇︎</a>
          </div>
        }
      </div>
      <div className="section-suggest-bar">
        <div className="suggest-label">Suggestions:</div>
        {suggestions.map((sug, i) => (
          <button className="suggest-pill" key={i} onClick={() => handleSuggestClick(sug)}>
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
});

// --- VOICE PAGE ---
const VoicePage = React.forwardRef(function VoicePage({ goHome, suggestions }, ref) {
  const [input, setInput] = useState("");
  const [voiceUrl, setVoiceUrl] = useState(null);

  React.useImperativeHandle(ref, () => ({
    autofillAndSend: (text) => {
      setInput(text);
      setTimeout(() => handleGen(text), 40);
    }
  }));

  function handleGen(val) {
    const text = (typeof val === "string" ? val : input).trim();
    if (!text) return;
    setVoiceUrl(`https://text.pollinations.ai/${encodeURIComponent(text)}?model=openai-audio&voice=alloy`);
  }
  function clearAll() {
    setInput("");
    setVoiceUrl(null);
  }
  function handleSuggestClick(sug) {
    setInput(sug);
    setTimeout(() => handleGen(sug), 40);
  }
  return (
    <div className="mode-page song-templ">
      <button className="back-btn" onClick={goHome}>⬅ Home</button>
      <h2 className="page-title">Voice</h2>
      <div className="input-row">
        <input
          placeholder="Type a message.."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleGen()}
          className="input"
        />
        <button className="button" onClick={handleGen} disabled={!input.trim()}>Generate ✦︎</button>
        <button className="button clear" onClick={clearAll}>Clear ⌫</button>
      </div>
      <div style={{ minHeight: "5px", margin: "10px 0" }}>
        {voiceUrl &&
          <div className="audio-bar">
            <audio controls src={voiceUrl} className="audio-output" />
            <a href={voiceUrl} download="voice.mp3" className="button">Download ⬇︎</a>
          </div>
        }
      </div>
      <div className="section-suggest-bar">
        <div className="suggest-label">Suggestions:</div>
        {suggestions.map((sug, i) => (
          <button className="suggest-pill" key={i} onClick={() => handleSuggestClick(sug)}>
            {sug}
          </button>
        ))}
      </div>
    </div>
  );
});

// --- VIDEO PAGE w/ CLEAR button ---
function VideoPage({ goHome }) {
  const [_, setClear] = useState(false);
  function clearAll() { setClear(c => !c); }
  return (
    <div className="mode-page video-templ">
      <button className="back-btn" onClick={goHome}>⬅ Home</button>
      <h2 className="page-title">Video</h2>
      <div className="video-coming-box">
        <span className="coming-soon-icon">▶</span>
        <div className="coming-soon-main">Coming soon..</div>
        <div className="coming-soon-desc">AI-powered video tools will arrive soon.</div>
      </div>
      <button className="button clear" onClick={clearAll} style={{marginTop:32}}>Clear</button>
    </div>
  );
}

export default App;
