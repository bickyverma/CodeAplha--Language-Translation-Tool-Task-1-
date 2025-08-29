    const LIBRE_ENDPOINT = "https://libretranslate.com/translate"; 
    const API_KEY = "4520f3ca3a9a9a747e79"; // API key used
    // iss website ka api use kiya hai link => https://libretranslate.com/?utm_source=chatgpt.com

   
    const toLibreCode = (code) => {
      if (code === "auto") return null;
      return code;
    };

    const $ = (id) => document.getElementById(id);
    const setBusy = (busy, note="") => {
      $("translateBtn").disabled = busy;
      $("translateBtn").textContent = busy ? "Translating..." : "Translate";
      $("status").textContent = note;
    };

    async function translateViaLibre(text, source, target) {
      const body = {
        q: text,
        source: toLibreCode(source) || "auto",
        target: toLibreCode(target),
        format: "text",
        api_key: API_KEY
      };
      const res = await fetch(LIBRE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error(`LibreTranslate error: ${res.status}`);
      const data = await res.json();
      if (!data || typeof data.translatedText !== "string") {
        throw new Error("LibreTranslate: unexpected response");
      }
      return data.translatedText;
    }

    async function translateViaMyMemory(text, source, target) {
      const pair = `${source === "auto" ? "auto" : source}|${target}`;
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${pair}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`MyMemory error: ${res.status}`);
      const data = await res.json();
      return data?.responseData?.translatedText || "";
    }

    async function translateText() {
      const text = $("sourceText").value.trim();
      const source = $("sourceLang").value;
      const target = $("targetLang").value;

      if (!text) { alert("Please enter some text."); return; }
      if (source !== "auto" && source === target) { alert("Source and target are the same."); return; }

      setBusy(true, "Using LibreTranslate…");
      $("result").textContent = "";

      try {
        const translated = await translateViaLibre(text, source, target);
        $("result").textContent = translated;
        setBusy(false, "Translated with LibreTranslate ✓");
      } catch (e) {
        // Fallback
        console.warn(e);
        setBusy(true, "Primary failed, trying MyMemory…");
        try {
          const translated = await translateViaMyMemory(text, source, target);
          $("result").textContent = translated;
          setBusy(false, "Translated with MyMemory ✓ (fallback)");
        } catch (err) {
          console.error(err);
          setBusy(false, "Translation failed.");
          alert("Translation failed. Please try again or check your internet/API key.");
        }
      }
    }

    function copyText() {
      const t = $("result").textContent.trim();
      if (!t) return alert("Nothing to copy yet.");
      navigator.clipboard.writeText(t).then(() => alert("Copied!"));
    }

    function speakText() {
      const t = $("result").textContent.trim();
      if (!t) return alert("Nothing to speak yet.");
      const u = new SpeechSynthesisUtterance(t);
      
      const target = $("targetLang").value;
      const voices = speechSynthesis.getVoices();
      const pick = voices.find(v => v.lang && v.lang.toLowerCase().startsWith(target));
      if (pick) u.voice = pick;
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
    }

    $("translateBtn").addEventListener("click", translateText);
    $("copyBtn").addEventListener("click", copyText);
    $("speakBtn").addEventListener("click", speakText);

    window.speechSynthesis?.addEventListener?.("voiceschanged", ()=>{});