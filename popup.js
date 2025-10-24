document.addEventListener("DOMContentLoaded", () => {
  const previousTabBtn = document.getElementById("previousTabBtn");
  const currentTab = document.getElementById("currentTab");
  const emailList = document.getElementById("emailList");
  const emailListTotal = document.getElementById("emailListTotal");
  const findEmailsBtn = document.getElementById("findEmailsBtn");
  const copyAllBtn = document.getElementById("copyAllBtn");
  const prevList = document.getElementById("previousEmailList");
  const clearPrevBtn = document.getElementById("clearPrevBtn");
  const copyAllemails = document.getElementById("copyAllemails");

  // Reusable function to find and display emails
  async function findAndDisplayEmails() {
    try {
      emailList.innerHTML = "";
      emailListTotal.textContent = "";

      const tabs = await chrome.tabs.query({});
      const allEmails = new Set();

      for (const tab of tabs) {
        if (!tab.id || !tab.url) continue;

        const restrictedPrefixes = [
          "chrome://",
          "chrome-extension://",
          "edge://",
          "about://"
        ];
        if (restrictedPrefixes.some(prefix => tab.url.startsWith(prefix))) continue;

        try {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
          });

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
        const li = document.createElement("li");
        li.textContent = "No valid emails found.";
        emailList.appendChild(li);
        emailListTotal.textContent = "";
        return;
      }

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
  }

  // Run automatically when popup opens
  findAndDisplayEmails();

  // Also run when "Find Emails" button is clicked
  findEmailsBtn.addEventListener("click", findAndDisplayEmails);

  // Copy all button logic (unchanged)
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
});
