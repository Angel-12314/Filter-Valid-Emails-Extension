function extractEmails() {
  const emails = new Set();
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  // Extract from page text
  const textEmails = document.body.innerText.match(emailRegex);
  if (textEmails) textEmails.forEach((e) => emails.add(e.trim()));

  // Extract from mailto: links
  const mailtoLinks = Array.from(document.querySelectorAll('a[href^="mailto:"]'));
  mailtoLinks.forEach((link) => {
    const hrefEmail = link.getAttribute("href").replace("mailto:", "").split("?")[0];
    if (hrefEmail.match(emailRegex)) emails.add(hrefEmail.trim());
  });

  //console.log("All Emails Found:", Array.from(emails));
  return Array.from(emails);
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "getEmails") {
    const emails = extractEmails();
    sendResponse({ emails }); 
  }
  
});
