/* 크리스탈 볼 비디오 인코더
 * 브라우저 안에서 ffmpeg.wasm으로 480x480 / H.264 / 30fps MP4를 만든다.
 * 모든 처리는 로컬에서 이루어지며 파일이 서버로 전송되지 않는다. */

const OUTPUT_SIZE = 480;
const AUDIO_BITRATE_KBPS = 128;
const SIZE_WARN_BYTES = 500 * 1024 * 1024;

const $ = (id) => document.getElementById(id);

const els = {
  engineDot: $("engineDot"),
  engineText: $("engineText"),
  dropzone: $("dropzone"),
  fileInput: $("fileInput"),
  fileInfo: $("fileInfo"),
  settingsCard: $("settingsCard"),
  previewFrame: $("previewFrame"),
  previewVideo: $("previewVideo"),
  circleToggle: $("circleToggle"),
  circleOverlay: $("circleOverlay"),
  fitMode: $("fitMode"),
  bitrate: $("bitrate"),
  fps: $("fps"),
  audio: $("audio"),
  estimate: $("estimate"),
  encodeBtn: $("encodeBtn"),
  progressCard: $("progressCard"),
  progressBar: $("progressBar"),
  progressText: $("progressText"),
  cancelBtn: $("cancelBtn"),
  logOutput: $("logOutput"),
  resultCard: $("resultCard"),
  resultVideo: $("resultVideo"),
  resultCircleToggle: $("resultCircleToggle"),
  resultCircleOverlay: $("resultCircleOverlay"),
  resultInfo: $("resultInfo"),
  downloadBtn: $("downloadBtn"),
  restartBtn: $("restartBtn"),
};

let ffmpeg = null;
let engineReady = false;
let currentFile = null;
let currentDuration = 0; // 초
let encoding = false;
let cancelled = false;
let resultUrl = null;
let logLines = [];

/* ---------- 엔진 로딩 ---------- */

function setEngineStatus(state, text) {
  els.engineDot.className = "dot " + state;
  els.engineText.textContent = text;
}

async function loadEngine() {
  setEngineStatus("loading", "인코딩 엔진 로딩 중… (최초 1회, 약 32MB)");
  try {
    ffmpeg = new FFmpegWASM.FFmpeg();
    ffmpeg.on("log", ({ message }) => {
      logLines.push(message);
      if (logLines.length > 400) logLines.shift();
      els.logOutput.textContent = logLines.join("\n");
    });
    ffmpeg.on("progress", ({ progress }) => {
      if (!encoding) return;
      const pct = Math.max(0, Math.min(100, Math.round(progress * 100)));
      els.progressBar.style.width = pct + "%";
      els.progressText.textContent = `변환 중… ${pct}%`;
    });
    await ffmpeg.load({
      coreURL: new URL("vendor/ffmpeg/ffmpeg-core.js", location.href).href,
      wasmURL: new URL("vendor/ffmpeg/ffmpeg-core.wasm", location.href).href,
    });
    engineReady = true;
    setEngineStatus("ready", "인코딩 엔진 준비 완료");
    updateEncodeButton();
  } catch (err) {
    console.error(err);
    setEngineStatus("error", "엔진 로딩 실패 — 새로고침 해주세요. (지원 브라우저: 최신 Chrome/Safari/Edge)");
  }
}

/* ---------- 파일 선택 ---------- */

els.dropzone.addEventListener("click", () => els.fileInput.click());
els.fileInput.addEventListener("change", () => {
  if (els.fileInput.files.length) selectFile(els.fileInput.files[0]);
});
["dragover", "dragenter"].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropzone.classList.add("dragover");
  })
);
["dragleave", "drop"].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    els.dropzone.classList.remove("dragover");
  })
);
els.dropzone.addEventListener("drop", (e) => {
  const file = e.dataTransfer.files && e.dataTransfer.files[0];
  if (file) selectFile(file);
});

function formatBytes(bytes) {
  if (bytes >= 1024 * 1024 * 1024) return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
  if (bytes >= 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

function formatDuration(sec) {
  if (!isFinite(sec) || sec <= 0) return "알 수 없음";
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return m > 0 ? `${m}분 ${s}초` : `${s}초`;
}

function selectFile(file) {
  currentFile = file;
  currentDuration = 0;

  let warn = "";
  if (file.size > SIZE_WARN_BYTES) {
    warn = "<br>⚠️ 파일이 큽니다. 휴대폰에서는 메모리 부족으로 실패할 수 있어요.";
  }
  els.fileInfo.hidden = false;
  els.fileInfo.innerHTML = `📁 <strong>${escapeHtml(file.name)}</strong> · ${formatBytes(file.size)}${warn}`;

  const url = URL.createObjectURL(file);
  els.previewVideo.src = url;
  els.previewVideo.onloadedmetadata = () => {
    currentDuration = els.previewVideo.duration || 0;
    els.fileInfo.innerHTML = `📁 <strong>${escapeHtml(file.name)}</strong> · ${formatBytes(file.size)} · ${formatDuration(currentDuration)}${warn}`;
    updateEstimate();
  };
  els.previewVideo.onerror = () => {
    // 브라우저가 미리보기를 못 해도(예: 일부 AVI/MKV) 변환은 가능하다
    els.fileInfo.innerHTML += "<br>ℹ️ 이 형식은 미리보기가 안 되지만 변환은 시도할 수 있습니다.";
  };

  els.settingsCard.hidden = false;
  els.resultCard.hidden = true;
  els.progressCard.hidden = true;
  updateEncodeButton();
  updateEstimate();
  els.settingsCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- 설정 ---------- */

let fitMode = "cover";
els.fitMode.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.fitMode.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    fitMode = btn.dataset.value;
    els.previewFrame.className = "preview-frame fit-" + fitMode;
  });
});

els.circleToggle.addEventListener("change", () => {
  els.circleOverlay.hidden = !els.circleToggle.checked;
});
els.resultCircleToggle.addEventListener("change", () => {
  els.resultCircleOverlay.hidden = !els.resultCircleToggle.checked;
});

[els.bitrate, els.audio].forEach((el) => el.addEventListener("change", updateEstimate));

function updateEstimate() {
  if (!currentFile || !currentDuration) {
    els.estimate.textContent = "";
    return;
  }
  const vKbps = parseInt(els.bitrate.value, 10);
  const aKbps = els.audio.value === "none" ? 0 : AUDIO_BITRATE_KBPS;
  const bytes = ((vKbps + aKbps) * 1000 / 8) * currentDuration;
  els.estimate.textContent = `예상 출력 크기: 약 ${formatBytes(bytes)}`;
}

function updateEncodeButton() {
  els.encodeBtn.disabled = !(engineReady && currentFile) || encoding;
}

/* ---------- 인코딩 ---------- */

function buildVideoFilter() {
  const s = OUTPUT_SIZE;
  const fps = parseInt(els.fps.value, 10);
  let scale;
  if (fitMode === "cover") {
    scale = `scale=${s}:${s}:force_original_aspect_ratio=increase:flags=lanczos,crop=${s}:${s}`;
  } else if (fitMode === "contain") {
    scale = `scale=${s}:${s}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${s}:${s}:(ow-iw)/2:(oh-ih)/2:black`;
  } else {
    scale = `scale=${s}:${s}:flags=lanczos`;
  }
  return `${scale},fps=${fps},format=yuv420p`;
}

function inputFileName() {
  const m = currentFile.name.match(/\.([A-Za-z0-9]{1,5})$/);
  return "input" + (m ? "." + m[1].toLowerCase() : ".mp4");
}

els.encodeBtn.addEventListener("click", startEncode);
els.cancelBtn.addEventListener("click", async () => {
  if (!encoding) return;
  cancelled = true;
  try { ffmpeg.terminate(); } catch (_) {}
  encoding = false;
  els.progressText.textContent = "취소됨. 엔진을 다시 준비하는 중…";
  engineReady = false;
  updateEncodeButton();
  await loadEngine();
  els.progressCard.hidden = true;
});

async function startEncode() {
  if (!engineReady || !currentFile || encoding) return;
  encoding = true;
  cancelled = false;
  logLines = [];
  els.logOutput.textContent = "";
  updateEncodeButton();

  els.progressCard.hidden = false;
  els.resultCard.hidden = true;
  els.progressBar.style.width = "0%";
  els.progressText.textContent = "파일 읽는 중…";
  els.progressCard.scrollIntoView({ behavior: "smooth", block: "start" });

  const inName = inputFileName();
  const outName = "output.mp4";

  try {
    await ffmpeg.writeFile(inName, await FFmpegUtil.fetchFile(currentFile));

    const vKbps = parseInt(els.bitrate.value, 10);
    const maxrate = Math.min(4000, Math.round(vKbps * 1.5));

    const args = [
      "-i", inName,
      "-vf", buildVideoFilter(),
      "-c:v", "libx264",
      "-profile:v", "main",
      "-level:v", "3.1",
      "-preset", "veryfast",
      "-b:v", `${vKbps}k`,
      "-maxrate", `${maxrate}k`,
      "-bufsize", `${vKbps * 2}k`,
      "-movflags", "+faststart",
    ];

    const audio = els.audio.value;
    if (audio === "none") {
      args.push("-an");
    } else if (audio === "mp3") {
      args.push("-c:a", "libmp3lame", "-b:a", `${AUDIO_BITRATE_KBPS}k`, "-ar", "44100", "-ac", "2");
    } else {
      args.push("-c:a", "aac", "-b:a", `${AUDIO_BITRATE_KBPS}k`, "-ar", "44100", "-ac", "2");
    }
    args.push("-y", outName);

    els.progressText.textContent = "변환 중… 0%";
    const code = await ffmpeg.exec(args);
    if (code !== 0) throw new Error("ffmpeg 종료 코드 " + code);

    const data = await ffmpeg.readFile(outName);
    await cleanupFs(inName, outName);

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    const blob = new Blob([data.buffer], { type: "video/mp4" });
    resultUrl = URL.createObjectURL(blob);

    const base = currentFile.name.replace(/\.[^.]+$/, "");
    els.downloadBtn.href = resultUrl;
    els.downloadBtn.download = `${base}_480x480.mp4`;
    els.resultVideo.src = resultUrl;
    els.resultInfo.innerHTML =
      `<strong>${formatBytes(blob.size)}</strong> · 480×480 · H.264 · ${els.fps.value}fps` +
      (audio === "none" ? " · 무음" : ` · ${audio.toUpperCase()} 44.1kHz`);

    encoding = false;
    els.progressCard.hidden = true;
    els.resultCard.hidden = false;
    els.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error(err);
    encoding = false;
    if (cancelled) return;
    let msg = "변환에 실패했습니다.";
    const log = logLines.join("\n");
    if (/Unknown encoder 'libmp3lame'/.test(log)) {
      msg = "이 엔진 빌드는 MP3 인코딩을 지원하지 않습니다. 오디오를 AAC로 바꾸고 다시 시도해주세요.";
    } else if (/out of memory|Cannot allocate|OOM/i.test(log + String(err))) {
      msg = "메모리가 부족합니다. 더 짧거나 작은 영상으로 시도하거나 PC 브라우저를 이용해주세요.";
    }
    els.progressText.textContent = "❌ " + msg + " (상세 로그 참고)";
    els.progressBar.style.width = "0%";
    await cleanupFs(inName, outName);
  } finally {
    updateEncodeButton();
  }
}

async function cleanupFs(...names) {
  for (const n of names) {
    try { await ffmpeg.deleteFile(n); } catch (_) {}
  }
}

/* ---------- 다시 시작 ---------- */

els.restartBtn.addEventListener("click", () => {
  els.fileInput.value = "";
  els.resultCard.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  els.fileInput.click();
});

/* ---------- 시작 ---------- */

loadEngine();
