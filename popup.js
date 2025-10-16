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

document.getElementById("findEmailsBtn").addEventListener("click", async () => {
  try {
    const emailList = document.getElementById("emailList");
    emailList.innerHTML = "";

    // ✅ Get all currently open tabs (active windows only)
    const tabs = await chrome.tabs.query({ status: "complete" });

    // ✅ Reset everything before a new scan
    const allEmails = new Set();

    if (tabs.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No open tabs detected.";
      emailList.appendChild(li);
      return;
    }

    for (const tab of tabs) {
      if (!tab.url) continue;

      const restrictedPrefixes = [
        "chrome://",
        "chrome-extension://",
        "edge://",
        "about://",
        "https://chromewebstore.google.com",
      ];

      if (restrictedPrefixes.some(prefix => tab.url.startsWith(prefix))) {
        console.warn("Skipping restricted page:", tab.url);
        continue;
      }

      // ✅ Verify the tab is still open before processing
      const isTabStillOpen = await new Promise((resolve) => {
        chrome.tabs.get(tab.id, (t) => resolve(!!t));
      });

      if (!isTabStillOpen) {
        console.warn("Tab closed before processing:", tab.id);
        continue;
      }

      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["content.js"],
        });
      } catch (err) {
        console.warn("Could not inject script into tab:", tab.id, err);
        continue;
      }

      const response = await new Promise((resolve) => {
        let responded = false;

        chrome.tabs.sendMessage(tab.id, { action: "getEmails" }, (res) => {
          responded = true;
          resolve(res);
        });

        // Timeout if tab does not respond in 1s (likely closed)
        setTimeout(() => {
          if (!responded) resolve(null);
        }, 1000);
      });

      if (!response || !response.emails) continue;

      for (const email of response.emails) {
        if (allEmails.has(email)) continue;
        allEmails.add(email);

        try {
          const res = await fetch("https://filter-valid-emails-extension.onrender.com/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          });

          if (!res.ok) {
            console.error("Server error:", res.status, await res.text());
            continue;
          }

          const data = await res.json();
          console.log("Response from server:", data);

          const li = document.createElement("li");
          li.textContent = email;
          li.style.color = data.valid ? "green" : "red";
          emailList.appendChild(li);
        } catch (err) {
          console.error("Error validating email:", email, err);
        }
      }
    }

    // ✅ Only display "no emails" if nothing found at all
    if (allEmails.size === 0) {
      const li = document.createElement("li");
      li.textContent = "No emails found on any open tab.";
      emailList.appendChild(li);
    }
  } catch (err) {
    console.error("Error in findEmailsBtn handler:", err);
  }
});
