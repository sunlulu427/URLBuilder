// Add parameter row
document.getElementById("addParam").addEventListener("click", () => {
  const container = document.getElementById("paramsContainer");
  const index = container.children.length;

  const newRow = document.createElement("div");
  newRow.className = "param-row";
  newRow.innerHTML = `
    <input type="text" class="param-key" placeholder="Key">
    <input type="text" class="param-value" placeholder="Value">
    <div class="encode-option">
      <input type="checkbox" class="encode-check" id="encode${index}" checked>
      <label for="encode${index}">URL Encode</label>
    </div>
    <button class="btn-remove">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 6L6 18" stroke="white" stroke-width="2" stroke-linecap="round"/>
        <path d="M6 6L18 18" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  `;
  container.appendChild(newRow);

  // Add remove functionality
  newRow.querySelector(".btn-remove").addEventListener("click", () => {
    newRow.remove();
    generateUrl();
  });

  // Add input listeners
  newRow.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", debounce(generateUrl, 300));
  });
});

// Initial remove buttons
document.querySelectorAll(".btn-remove").forEach((btn) => {
  btn.addEventListener("click", function () {
    this.parentElement.remove();
    generateUrl();
  });
});

// Initial input listeners for the first parameter row
document.querySelectorAll(".param-row input").forEach((input) => {
  input.addEventListener("input", debounce(generateUrl, 300));
});

// Generate URL function
function generateUrl() {
  const baseUrl = document.getElementById("baseUrl").value.trim();
  if (!baseUrl) {
    document.getElementById("generatedUrl").textContent =
      "Please enter a base URL";
    document.getElementById("qrcode").innerHTML = "";
    return;
  }

  const params = [];
  document.querySelectorAll(".param-row").forEach((row) => {
    const key = row.querySelector(".param-key").value.trim();
    const value = row.querySelector(".param-value").value.trim();
    const encode = row.querySelector(".encode-check").checked;

    if (key) {
      const encodedKey = encodeURIComponent(key);
      const encodedValue = encode ? encodeURIComponent(value) : value;
      params.push(`${encodedKey}=${encodedValue}`);
    }
  });

  const queryString = params.length ? `?${params.join("&")}` : "";
  const fullUrl = baseUrl + queryString;

  // Display result
  document.getElementById("generatedUrl").textContent = fullUrl;

  // Generate QR code
  const qrContainer = document.getElementById("qrcode");
  qrContainer.innerHTML = "";

  if (fullUrl.length > 1000) {
    qrContainer.innerHTML =
      '<p class="error">URL too long to generate QR code</p>';
    return;
  }

  try {
    new QRCode(qrContainer, {
      text: fullUrl,
      width: 200,
      height: 200,
      colorDark: "#2c3e50",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  } catch (e) {
    qrContainer.innerHTML = `<p class="error">QR generation failed: ${e.message}</p>`;
  }
}

// Copy URL function
document.getElementById("copyUrl").addEventListener("click", () => {
  const url = document.getElementById("generatedUrl").textContent;
  if (!url || url === "URL will appear here") return;

  navigator.clipboard
    .writeText(url)
    .then(() => {
      alert("URL copied to clipboard!");
    })
    .catch((err) => {
      console.error("Copy failed:", err);
      alert("Failed to copy, please copy manually");
    });
});

// Download QR code function
document.getElementById("downloadQR").addEventListener("click", () => {
  const canvas = document.querySelector("#qrcode canvas");
  if (!canvas) {
    alert("Please generate the QR code first");
    return;
  }

  const link = document.createElement("a");
  link.download = "url-qrcode.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// Bind generate button
document.getElementById("generateUrl").addEventListener("click", generateUrl);

// Base URL input listener
document
  .getElementById("baseUrl")
  .addEventListener("input", debounce(generateUrl, 300));

// Debounce function
function debounce(func, wait) {
  let timeout;
  return function () {
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

// Initial generation
generateUrl();
