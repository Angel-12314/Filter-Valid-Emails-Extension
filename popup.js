// document.getElementById("findEmailsBtn").addEventListener("click", async () => {
//   try {
//     const tabs = await chrome.tabs.query({}); // Get all open tabs
//     const emailList = document.getElementById("emailList");
//     emailList.innerHTML = "";

//     const allEmails = new Set();

//     for (const tab of tabs) {

//       if (!tab.url) continue;

//       const restrictedPrefixes = [
//         "chrome://",
//         "chrome-extension://",
//         "edge://",
//         "about://",
//         "https://chromewebstore.google.com",
//       ];

//       //if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) {
//       if (restrictedPrefixes.some(prefix => tab.url.startsWith(prefix))) {
//         console.warn("Skipping restricted page:", tab.url);
//         continue;
//       }

      
//       try {
//         await chrome.scripting.executeScript({
//           target: { tabId: tab.id },
//           files: ["content.js"],
//         });
//       } catch (err) {
//         console.warn("Could not inject script into tab:", tab.id, err);
//       }

      
//       const response = await new Promise((resolve) => {
//         chrome.tabs.sendMessage(tab.id, { action: "getEmails" }, (res) => resolve(res));
//       });

//       if (!response || !response.emails) continue;

//       for (const email of response.emails) {
//         if (allEmails.has(email)) continue;
//         allEmails.add(email);

//         try {
//           //const res = await fetch("http://127.0.0.1:5000/validate", {
//           const res = await fetch("https://filter-valid-emails-extension.onrender.com/validate", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ email }),
//           });

//           if (!res.ok) {
//             console.error("Server error:", res.status, await res.text());
//             continue;
//           }
          
//           const data = await res.json();
//           console.log("Response from server:", data);
//           const li = document.createElement("li");
//           li.textContent = email;
//           li.style.color = data.valid ? "green" : "red";
//           emailList.appendChild(li);
//         } catch (err) {
//           console.error("Error validating email:", email, err);
//         }
//       }
//     }

//     if (allEmails.size === 0) {
//       const li = document.createElement("li");
//       li.textContent = "No emails found on any open tab.";
//       emailList.appendChild(li);
//     }
//   } catch (err) {
//     console.error("Error in findEmailsBtn handler:", err);
//   }
// });

// document.getElementById("findEmailsBtn").addEventListener("click", async () => {
//   try {
//     const emailList = document.getElementById("emailList");
//     emailList.innerHTML = "";

//     // ✅ Get all currently open tabs (active windows only)
//     const tabs = await chrome.tabs.query({ status: "complete" });

//     // ✅ Reset everything before a new scan
//     const allEmails = new Set();

//     if (tabs.length === 0) {
//       const li = document.createElement("li");
//       li.textContent = "No open tabs detected.";
//       emailList.appendChild(li);
//       return;
//     }

//     for (const tab of tabs) {
//       if (!tab.url) continue;

//       const restrictedPrefixes = [
//         "chrome://",
//         "chrome-extension://",
//         "edge://",
//         "about://",
//         "https://chromewebstore.google.com",
//       ];

//       if (restrictedPrefixes.some(prefix => tab.url.startsWith(prefix))) {
//         console.warn("Skipping restricted page:", tab.url);
//         continue;
//       }

//       // ✅ Verify the tab is still open before processing
//       const isTabStillOpen = await new Promise((resolve) => {
//         chrome.tabs.get(tab.id, (t) => resolve(!!t));
//       });

//       if (!isTabStillOpen) {
//         console.warn("Tab closed before processing:", tab.id);
//         continue;
//       }

//       try {
//         await chrome.scripting.executeScript({
//           target: { tabId: tab.id },
//           files: ["content.js"],
//         });
//       } catch (err) {
//         console.warn("Could not inject script into tab:", tab.id, err);
//         continue;
//       }

//       const response = await new Promise((resolve) => {
//         let responded = false;

//         chrome.tabs.sendMessage(tab.id, { action: "getEmails" }, (res) => {
//           responded = true;
//           resolve(res);
//         });

//         // Timeout if tab does not respond in 1s (likely closed)
//         setTimeout(() => {
//           if (!responded) resolve(null);
//         }, 1000);
//       });

//       if (!response || !response.emails) continue;

//       for (const email of response.emails) {
//         if (allEmails.has(email)) continue;
//         allEmails.add(email);

//         try {
//           const res = await fetch("https://filter-valid-emails-extension.onrender.com/validate", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ email }),
//           });

//           if (!res.ok) {
//             console.error("Server error:", res.status, await res.text());
//             continue;
//           }

//           const data = await res.json();
//           console.log("Response from server:", data);

//           const li = document.createElement("li");
//           li.textContent = email;
//           li.style.color = data.valid ? "green" : "red";
//           emailList.appendChild(li);
//         } catch (err) {
//           console.error("Error validating email:", email, err);
//         }
//       }
//     }

//     // ✅ Only display "no emails" if nothing found at all
//     if (allEmails.size === 0) {
//       const li = document.createElement("li");
//       li.textContent = "No emails found on any open tab.";
//       emailList.appendChild(li);
//     }
//   } catch (err) {
//     console.error("Error in findEmailsBtn handler:", err);
//   }
// });

document.addEventListener("DOMContentLoaded", () => {
  const currentTabBtn = document.getElementById("currentTabBtn");
  const previousTabBtn = document.getElementById("previousTabBtn");
  const currentTab = document.getElementById("currentTab");
  const previousTab = document.getElementById("previousTab");
  const emailList = document.getElementById("emailList");
  const emailListTotal = document.getElementById("emailListTotal");
  const storedEmails = document.getElementById("storedEmails");
  const findEmailsBtn = document.getElementById("findEmailsBtn");
  const copyAllBtn = document.getElementById("copyAllBtn");
  const prevList = document.getElementById("previousEmailList");
  const clearPrevBtn = document.getElementById("clearPrevBtn");
  const copyAllemails = document.getElementById("copyAllemails");

  //Tab Switching
  currentTabBtn.addEventListener("click", () => {
    currentTabBtn.classList.add("active");
    previousTabBtn.classList.remove("active");
    currentTab.classList.add("active");
    previousTab.classList.remove("active");
  });

  previousTabBtn.addEventListener("click", () => {
    previousTabBtn.classList.add("active");
    currentTabBtn.classList.remove("active");
    previousTab.classList.add("active");
    currentTab.classList.remove("active");
    loadPreviousEmails();
  });

  // Find Emails Button
  findEmailsBtn.addEventListener("click", async () => {
    try {
      emailList.innerHTML = "";
      emailListTotal.textContent = "";
      storedEmails.textContent = "";
      const tabs = await chrome.tabs.query({});

      const allEmails = new Set();

      for (const tab of tabs) {
        if (!tab.id || !tab.url) continue;

        // Skip restricted pages
        const restrictedPrefixes = [
          "chrome://",
          "chrome-extension://",
          "edge://",
          "about://"
        ];
        if (restrictedPrefixes.some(prefix => tab.url.startsWith(prefix))) continue;

        try {
          // Ensure content.js is injected before messaging
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          });

          // get emails from the page
          const response = await new Promise((resolve) => {
            let done = false;
            chrome.tabs.sendMessage(tab.id, { action: "getEmails" }, (res) => {
              done = true;
              resolve(res);
            });
            setTimeout(() => {
              if (!done) resolve(null);
            }, 1000);
          });

          if (response && response.emails && Array.isArray(response.emails)) {
            response.emails.forEach((email) => allEmails.add(email));
          }
        } catch (err) {
          console.warn("Could not get emails from tab:", tab.id, err);
        }
      }

      const validEmails = Array.from(allEmails).filter(
        (email) => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
      );

      if (validEmails.length === 0) {
        //copyAllBtn.style.display = "none";
        const li = document.createElement("li");
        li.textContent = "No valid emails found.";
        emailList.appendChild(li);
        emailListTotal.textContent = "";
        return;
      }

      // Save to localStorage
      localStorage.setItem("savedEmails", JSON.stringify(validEmails));
      
      emailListTotal.textContent = `Total: ${validEmails.length}`;
      validEmails.forEach((email) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = email;

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.innerHTML = "&#128203; Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(email);
          copyBtn.innerHTML = "&#9989; Copied";
          setTimeout(() => (copyBtn.innerHTML = "&#128203; Copy"), 1500);
        });

        li.appendChild(span);
        li.appendChild(copyBtn);
        emailList.appendChild(li);
      });
    } catch (error) {
      console.error("Error fetching emails:", error);
    }
  });

  copyAllBtn.addEventListener("click", () => {
    const listItems = emailList.querySelectorAll("li span");
    const allEmails = Array.from(listItems).map((li) => li.textContent);
    if (allEmails.length === 0) {
      alert("No emails to copy!");
      return;
    }
    navigator.clipboard.writeText(allEmails.join("\n"));
    copyAllBtn.textContent = "All Copied";
    setTimeout(() => (copyAllBtn.textContent = "Copy All Emails"), 1500);
  });

  // previous emails
  function loadPreviousEmails() {
    prevList.innerHTML = "";
    const stored = JSON.parse(localStorage.getItem("savedEmails")) || [];

    if (stored.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No previously saved emails.";
      storedEmails.textContent = "";
      prevList.appendChild(li);
      copyAllemails.style.display = "none"; // hide copy button if no saved emails
    } else {
      storedEmails.textContent = `Total: ${stored.length}`;
      copyAllemails.style.display = "block"; // show if available
      stored.forEach((email) => {
        const li = document.createElement("li");
        const span = document.createElement("span");
        span.textContent = email;

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-btn";
        copyBtn.innerHTML = "&#128203; Copy";
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(email);
          copyBtn.innerHTML = "&#9989; Copied";
          setTimeout(() => (copyBtn.innerHTML = "&#128203; Copy"), 1500);
        });

        li.appendChild(span);
        li.appendChild(copyBtn);
        prevList.appendChild(li);
      });
    }
  }

  // === COPY ALL (PREVIOUS TAB) ===
  copyAllemails.addEventListener("click", () => {
    const stored = JSON.parse(localStorage.getItem("savedEmails")) || [];
    if (stored.length === 0) {
      alert("No saved emails to copy!");
      return;
    }
    navigator.clipboard.writeText(stored.join("\n"));
    copyAllemails.textContent = "All Copied";
    setTimeout(() => (copyAllemails.textContent = "Copy All Emails"), 1500);
  });

  // === CLEAR SAVED EMAILS ===
  clearPrevBtn.addEventListener("click", () => {
    localStorage.removeItem("savedEmails");
    prevList.innerHTML = "";
    const li = document.createElement("li");
    li.textContent = "No previously saved emails.";
    storedEmails.textContent = "";
    prevList.appendChild(li);
    copyAllemails.style.display = "none";
  });
});

