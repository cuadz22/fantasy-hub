let studioRenderer;
function loadStudioRenderer() {
  if (window.html2canvas) return Promise.resolve();
  if (!studioRenderer)
    studioRenderer = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "vendor/html2canvas.min.js";
      script.onload = resolve;
      script.onerror = () => {
        studioRenderer = null;
        script.remove();
        reject(new Error("Export renderer unavailable"));
      };
      document.head.appendChild(script);
    });
  return studioRenderer;
}
document.addEventListener("click", async (event) => {
  if (!event.target.closest("#studio-export")) return;
  const button = document.querySelector("#studio-export");
  const status = document.querySelector("#export-status");
  button.disabled = true;
  status.textContent = "Preparing your image…";
  try {
    await loadStudioRenderer();
    await document.fonts.ready;
    const node = document.querySelector("#studio-canvas");
    await Promise.all(
      [...node.querySelectorAll("img")].map((i) => i.decode().catch(() => {})),
    );
    const canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: getComputedStyle(document.body).backgroundColor,
      useCORS: true,
      logging: false,
      imageTimeout: 5000,
    });
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) throw new Error("Image unavailable");
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `CFN-${document.querySelector("#studio-league").value}-week-${requestedWeek()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    status.textContent = "PNG downloaded. Nothing was published.";
  } catch {
    status.textContent = "The export could not finish. Please try again.";
  } finally {
    button.disabled = false;
  }
});
