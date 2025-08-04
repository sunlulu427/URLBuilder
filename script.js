// Save data to localStorage
function saveData() {
  const data = {
    baseUrl: document.getElementById("baseUrl").value,
    params: []
  };
  
  document.querySelectorAll(".param-row").forEach((row) => {
    const key = row.querySelector(".param-key").value;
    const value = row.querySelector(".param-value").value;
    const encode = row.querySelector(".encode-check").checked;
    
    if (key || value) {
      data.params.push({
        key: key,
        value: value,
        encode: encode
      });
    }
  });
  
  localStorage.setItem("urlBuilderData", JSON.stringify(data));
}

// Load data from localStorage
function loadData() {
  const savedData = localStorage.getItem("urlBuilderData");
  if (!savedData) return;
  
  try {
    const data = JSON.parse(savedData);
    
    // Load base URL
    if (data.baseUrl) {
      document.getElementById("baseUrl").value = data.baseUrl;
    }
    
    // Load parameters
    if (data.params && data.params.length > 0) {
      const container = document.getElementById("paramsContainer");
      container.innerHTML = ""; // Clear existing rows
      
      data.params.forEach((param, index) => {
        addParameterRow(param.key, param.value, param.encode, index);
      });
    }
  } catch (e) {
    console.error("Failed to load saved data:", e);
  }
}

// Add parameter row with optional initial values
function addParameterRow(key = "", value = "", encode = true, index = null) {
  const container = document.getElementById("paramsContainer");
  const rowIndex = index !== null ? index : container.children.length;

  const newRow = document.createElement("div");
  newRow.className = "param-row";
  newRow.innerHTML = `
    <input type="text" class="param-key" placeholder="Key" value="${key}">
    <div class="param-value-container">
      <input type="text" class="param-value" placeholder="Value" value="${value}">
    </div>
    <div class="encode-option">
      <input type="checkbox" class="encode-check" id="encode${rowIndex}" ${encode ? 'checked' : ''}>
      <label for="encode${rowIndex}">URL Encode</label>
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
    saveData();
  });

  // Add input listeners
  newRow.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", debounce(() => {
      generateUrl();
      saveData();
    }, 300));
  });
}

// Add parameter row
document.getElementById("addParam").addEventListener("click", () => {
  addParameterRow();
});

// Initialize existing parameter rows
function initializeExistingRows() {
  // Add input listeners to existing rows
  document.querySelectorAll(".param-row input").forEach((input) => {
    input.addEventListener("input", debounce(() => {
      generateUrl();
      saveData();
    }, 300));
  });
}

// Initial remove buttons
document.querySelectorAll(".btn-remove").forEach((btn) => {
  btn.addEventListener("click", function () {
    this.parentElement.remove();
    generateUrl();
    saveData();
  });
});

// Initial input listeners for the first parameter row
document.querySelectorAll(".param-row input").forEach((input) => {
  input.addEventListener("input", debounce(() => {
    generateUrl();
    saveData();
  }, 300));
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
function initializeCopyButton() {
  const copyBtn = document.getElementById("copyUrl");
  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const url = document.getElementById("generatedUrl").textContent;
      if (!url || url === "URL will appear here" || url === "Please enter a base URL") {
        return;
      }

      const originalText = copyBtn.textContent;
      
      // Check if modern clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(url);
          
          // Visual feedback
          copyBtn.textContent = "✓ Copied!";
          copyBtn.style.background = "#27ae60";
          copyBtn.style.transform = "scale(1.05)";
          
          // Reset button after 2 seconds
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = "";
            copyBtn.style.transform = "";
          }, 2000);
          
        } catch (err) {
          console.error("Modern clipboard API failed:", err);
          // Fall through to fallback method
        }
      }
      
      // Fallback for older browsers or when modern API fails
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        
        if (successful) {
          // Visual feedback
          copyBtn.textContent = "✓ Copied!";
          copyBtn.style.background = "#27ae60";
          copyBtn.style.transform = "scale(1.05)";
          
          // Reset button after 2 seconds
          setTimeout(() => {
            copyBtn.textContent = originalText;
            copyBtn.style.background = "";
            copyBtn.style.transform = "";
          }, 2000);
        } else {
          console.error("Fallback copy method failed");
        }
        
      } catch (fallbackErr) {
        console.error("Copy failed:", fallbackErr);
      }
    });
  }
}

// Download QR code function
function initializeDownloadButton() {
  const downloadBtn = document.getElementById("downloadQR");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const canvas = document.querySelector("#qrcode canvas");
      if (!canvas) {
        return;
      }

      const originalText = downloadBtn.textContent;
      
      try {
        const link = document.createElement("a");
        link.download = "url-qrcode.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
        
        // Visual feedback
        downloadBtn.textContent = "✓ Downloaded!";
        downloadBtn.style.background = "#27ae60";
        downloadBtn.style.transform = "scale(1.05)";
        
        // Reset button after 2 seconds
        setTimeout(() => {
          downloadBtn.textContent = originalText;
          downloadBtn.style.background = "";
          downloadBtn.style.transform = "";
        }, 2000);
        
      } catch (err) {
        console.error("Download failed:", err);
      }
    });
  }
}

// Base URL input listener
document
  .getElementById("baseUrl")
  .addEventListener("input", debounce(() => {
    generateUrl();
    saveData();
  }, 300));

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

// Load saved data and generate initial URL
loadData();
initializeExistingRows();
initializeCopyButton();
initializeDownloadButton();
generateUrl();
