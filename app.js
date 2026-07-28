/* 크리스탈 볼 비디오 인코더
 * 영상 → 480x480 H.264 MP4 또는 GIF (ffmpeg.wasm)
 * 사진 → 480x480 JPG (Canvas, 즉시 변환)
 * 모든 처리는 로컬에서 이루어지며 파일이 서버로 전송되지 않는다. */

const OUTPUT_SIZE = 480;
const AUDIO_BITRATE_KBPS = 128;
const SIZE_WARN_BYTES = 500 * 1024 * 1024;
const GIF_DURATION_WARN_SEC = 120;
const GIF_BYTES_PER_FRAME_EST = 35 * 1024; // 480x480 GIF 프레임당 대략적인 크기

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
  previewImage: $("previewImage"),
  circleToggle: $("circleToggle"),
  circleOverlay: $("circleOverlay"),
  formatSetting: $("formatSetting"),
  outFormat: $("outFormat"),
  fitMode: $("fitMode"),
  bitrate: $("bitrate"),
  fps: $("fps"),
  audio: $("audio"),
  gifFps: $("gifFps"),
  jpgQuality: $("jpgQuality"),
  estimate: $("estimate"),
  encodeBtn: $("encodeBtn"),
  progressCard: $("progressCard"),
  progressBar: $("progressBar"),
  progressText: $("progressText"),
  cancelBtn: $("cancelBtn"),
  logOutput: $("logOutput"),
  resultCard: $("resultCard"),
  resultVideo: $("resultVideo"),
  resultImage: $("resultImage"),
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
let mediaType = "video"; // 'video' | 'image'
let outFormat = "mp4"; // 'mp4' | 'gif' (영상일 때만)
let fitMode = "cover";
let encoding = false;
let cancelled = false;
let resultUrl = null;
let logLines = [];

function activeFormat() {
  return mediaType === "image" ? "jpg" : outFormat;
}

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

function isImageFile(file) {
  if (file.type.startsWith("image/")) return true;
  return /\.(jpe?g|png|webp|bmp|gif|avif)$/i.test(file.name);
}

function selectFile(file) {
  currentFile = file;
  currentDuration = 0;
  mediaType = isImageFile(file) ? "image" : "video";

  let warn = "";
  if (mediaType === "video" && file.size > SIZE_WARN_BYTES) {
    warn = "<br>⚠️ 파일이 큽니다. 휴대폰에서는 메모리 부족으로 실패할 수 있어요.";
  }
  const icon = mediaType === "image" ? "🖼️" : "📁";
  els.fileInfo.hidden = false;
  els.fileInfo.innerHTML = `${icon} <strong>${escapeHtml(file.name)}</strong> · ${formatBytes(file.size)}${warn}`;

  const url = URL.createObjectURL(file);
  if (mediaType === "image") {
    els.previewVideo.removeAttribute("src");
    els.previewVideo.hidden = true;
    els.previewImage.hidden = false;
    els.previewImage.src = url;
  } else {
    els.previewImage.hidden = true;
    els.previewImage.removeAttribute("src");
    els.previewVideo.hidden = false;
    els.previewVideo.src = url;
    els.previewVideo.onloadedmetadata = () => {
      currentDuration = els.previewVideo.duration || 0;
      els.fileInfo.innerHTML = `${icon} <strong>${escapeHtml(file.name)}</strong> · ${formatBytes(file.size)} · ${formatDuration(currentDuration)}${warn}`;
      updateEstimate();
    };
    els.previewVideo.onerror = () => {
      // 브라우저가 미리보기를 못 해도(예: 일부 AVI/MKV) 변환은 가능하다
      els.fileInfo.innerHTML += "<br>ℹ️ 이 형식은 미리보기가 안 되지만 변환은 시도할 수 있습니다.";
    };
  }

  els.settingsCard.hidden = false;
  els.resultCard.hidden = true;
  els.progressCard.hidden = true;
  updateSettingsVisibility();
  updateEncodeButton();
  updateEstimate();
  els.settingsCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ---------- 설정 ---------- */

els.outFormat.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.outFormat.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    outFormat = btn.dataset.value;
    updateSettingsVisibility();
    updateEstimate();
  });
});

els.fitMode.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    els.fitMode.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    fitMode = btn.dataset.value;
    els.previewFrame.className = "preview-frame fit-" + fitMode;
  });
});

function updateSettingsVisibility() {
  const fmt = activeFormat();
  els.formatSetting.hidden = mediaType === "image";
  document.querySelectorAll(".setting[data-for]").forEach((el) => {
    el.hidden = el.dataset.for !== fmt;
  });
  els.encodeBtn.textContent =
    fmt === "jpg" ? "⚡ JPG로 변환" : fmt === "gif" ? "⚡ GIF로 변환" : "⚡ MP4로 변환";
}

els.circleToggle.addEventListener("change", () => {
  els.circleOverlay.hidden = !els.circleToggle.checked;
});
els.resultCircleToggle.addEventListener("change", () => {
  els.resultCircleOverlay.hidden = !els.resultCircleToggle.checked;
});

[els.bitrate, els.audio, els.gifFps].forEach((el) => el.addEventListener("change", updateEstimate));

function updateEstimate() {
  const fmt = activeFormat();
  if (!currentFile || fmt === "jpg" || !currentDuration) {
    els.estimate.textContent = "";
    return;
  }
  if (fmt === "gif") {
    const fps = parseInt(els.gifFps.value, 10);
    const bytes = GIF_BYTES_PER_FRAME_EST * fps * currentDuration;
    let text = `예상 출력 크기: 대략 ${formatBytes(bytes)} (GIF는 내용에 따라 편차 큼)`;
    if (currentDuration > GIF_DURATION_WARN_SEC) {
      text += ` · ⚠️ ${GIF_DURATION_WARN_SEC}초가 넘는 영상은 GIF로 만들면 파일이 매우 커집니다`;
    }
    els.estimate.textContent = text;
  } else {
    const vKbps = parseInt(els.bitrate.value, 10);
    const aKbps = els.audio.value === "none" ? 0 : AUDIO_BITRATE_KBPS;
    const bytes = ((vKbps + aKbps) * 1000 / 8) * currentDuration;
    els.estimate.textContent = `예상 출력 크기: 약 ${formatBytes(bytes)}`;
  }
}

function updateEncodeButton() {
  const needsEngine = mediaType === "video";
  els.encodeBtn.disabled = encoding || !currentFile || (needsEngine && !engineReady);
}

/* ---------- 인코딩 (영상) ---------- */

function scaleChain() {
  const s = OUTPUT_SIZE;
  if (fitMode === "cover") {
    return `scale=${s}:${s}:force_original_aspect_ratio=increase:flags=lanczos,crop=${s}:${s}`;
  }
  if (fitMode === "contain") {
    return `scale=${s}:${s}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${s}:${s}:(ow-iw)/2:(oh-ih)/2:black`;
  }
  return `scale=${s}:${s}:flags=lanczos`;
}

function inputFileName() {
  const m = currentFile.name.match(/\.([A-Za-z0-9]{1,5})$/);
  return "input" + (m ? "." + m[1].toLowerCase() : ".mp4");
}

els.encodeBtn.addEventListener("click", () => {
  if (activeFormat() === "jpg") convertImage();
  else startEncode();
});

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

function buildMp4Args(inName, outName) {
  const vKbps = parseInt(els.bitrate.value, 10);
  const maxrate = Math.min(4000, Math.round(vKbps * 1.5));
  const fps = parseInt(els.fps.value, 10);
  const args = [
    "-i", inName,
    "-vf", `${scaleChain()},fps=${fps},format=yuv420p`,
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
  return args;
}

function buildGifArgs(inName, outName) {
  const fps = parseInt(els.gifFps.value, 10);
  // 팔레트 생성 + 적용을 한 번에: 256색 최적화, 베이어 디더링
  const fc =
    `[0:v]${scaleChain()},fps=${fps},split[s0][s1];` +
    `[s0]palettegen=max_colors=256:stats_mode=diff[p];` +
    `[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`;
  return ["-i", inName, "-filter_complex", fc, "-loop", "0", "-an", "-y", outName];
}

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

  const isGif = outFormat === "gif";
  const inName = inputFileName();
  const outName = isGif ? "output.gif" : "output.mp4";

  try {
    await ffmpeg.writeFile(inName, await FFmpegUtil.fetchFile(currentFile));

    const args = isGif ? buildGifArgs(inName, outName) : buildMp4Args(inName, outName);

    els.progressText.textContent = "변환 중… 0%";
    const code = await ffmpeg.exec(args);
    if (code !== 0) throw new Error("ffmpeg 종료 코드 " + code);

    const data = await ffmpeg.readFile(outName);
    await cleanupFs(inName, outName);

    const blob = new Blob([data.buffer], { type: isGif ? "image/gif" : "video/mp4" });
    const suffix = isGif ? "_480x480.gif" : "_480x480.mp4";
    const info = isGif
      ? `<strong>${formatBytes(blob.size)}</strong> · 480×480 · GIF · ${els.gifFps.value}fps · 무한 반복`
      : `<strong>${formatBytes(blob.size)}</strong> · 480×480 · H.264 · ${els.fps.value}fps` +
        (els.audio.value === "none" ? " · 무음" : ` · ${els.audio.value.toUpperCase()} 44.1kHz`);
    showResult(blob, suffix, info, isGif ? "image" : "video");

    encoding = false;
    els.progressCard.hidden = true;
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

/* ---------- 변환 (사진 → JPG, Canvas 사용으로 즉시 처리) ---------- */

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      // EXIF 회전 반영 (지원 브라우저)
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch (_) {
      try { return await createImageBitmap(file); } catch (_) {}
    }
  }
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("이미지를 열 수 없습니다"));
    img.src = URL.createObjectURL(file);
  });
}

async function convertImage() {
  if (!currentFile || encoding) return;
  encoding = true;
  updateEncodeButton();
  try {
    const img = await decodeImage(currentFile);
    const iw = img.width, ih = img.height;
    const s = OUTPUT_SIZE;

    const canvas = document.createElement("canvas");
    canvas.width = s;
    canvas.height = s;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, s, s);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (fitMode === "cover") {
      const scale = Math.max(s / iw, s / ih);
      const w = iw * scale, h = ih * scale;
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
    } else if (fitMode === "contain") {
      const scale = Math.min(s / iw, s / ih);
      const w = iw * scale, h = ih * scale;
      ctx.drawImage(img, (s - w) / 2, (s - h) / 2, w, h);
    } else {
      ctx.drawImage(img, 0, 0, s, s);
    }
    if (img.close) img.close();

    const quality = parseFloat(els.jpgQuality.value);
    const blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("JPG 생성 실패"))), "image/jpeg", quality)
    );

    const saved = currentFile.size > 0 ? Math.min(99, Math.round((1 - blob.size / currentFile.size) * 100)) : 0;
    const savedText = saved > 0 ? ` · 원본 대비 ${saved}% 감소` : "";
    showResult(
      blob,
      "_480x480.jpg",
      `<strong>${formatBytes(blob.size)}</strong> · 480×480 · JPG ${Math.round(quality * 100)}%${savedText}`,
      "image"
    );
    encoding = false;
  } catch (err) {
    console.error(err);
    encoding = false;
    els.fileInfo.innerHTML += "<br>❌ 이 이미지 형식은 변환할 수 없습니다. JPG/PNG/WEBP 파일로 시도해주세요.";
  } finally {
    updateEncodeButton();
  }
}

/* ---------- 결과 표시 ---------- */

function showResult(blob, suffix, infoHtml, kind) {
  if (resultUrl) URL.revokeObjectURL(resultUrl);
  resultUrl = URL.createObjectURL(blob);

  const base = currentFile.name.replace(/\.[^.]+$/, "");
  els.downloadBtn.href = resultUrl;
  els.downloadBtn.download = base + suffix;
  els.resultInfo.innerHTML = infoHtml;

  if (kind === "image") {
    els.resultVideo.hidden = true;
    els.resultVideo.removeAttribute("src");
    els.resultImage.hidden = false;
    els.resultImage.src = resultUrl;
  } else {
    els.resultImage.hidden = true;
    els.resultImage.removeAttribute("src");
    els.resultVideo.hidden = false;
    els.resultVideo.src = resultUrl;
  }

  els.resultCard.hidden = false;
  els.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

/* ---------- 다시 시작 ---------- */

els.restartBtn.addEventListener("click", () => {
  els.fileInput.value = "";
  els.resultCard.hidden = true;
  window.scrollTo({ top: 0, behavior: "smooth" });
  els.fileInput.click();
});

/* ---------- 시작 ---------- */

updateSettingsVisibility();
loadEngine();
