import React, { useState } from "react";

const App = () => {
  const [url, setUrl] = useState("");
  const [seoData, setSeoData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzePage = async () => {
    setLoading(true);
    setError(null);
    setSeoData(null);

    try {
      const corsProxy = "https://api.allorigins.win/raw?url=";
      const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`);
      const html = await response.text();

      // Parsează HTML-ul folosind DOMParser
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      // Extrage informațiile principale
      const title =
        doc.querySelector("title")?.textContent.trim() || "Fără titlu";
      const metaDescription =
        doc.querySelector("meta[name='description']")?.content.trim() ||
        "Fără meta descriere";

      const wordCount = doc.body.textContent.trim().split(/\s+/).length;

      const images = [...doc.querySelectorAll("img")];
      const imagesWithoutAlt = images.filter((img) => !img.getAttribute("alt"));

      const https = url.startsWith("https");

      // Construiește URL-ul pentru robots.txt
      const domain = new URL(url).origin;
      const robotsUrl = `${domain}/robots.txt`;

      const robotsTxt = await fetch(robotsUrl, { method: "HEAD" })
        .then((res) => {
          if (res.status === 200) {
            return "Present";
          } else if (res.status === 404) {
            return "Absent";
          } else if (res.status === 403) {
            return "Restricționat";
          } else {
            return "Indisponibil";
          }
        })
        .catch(() => "Indisponibil");

      // Analiza headingurilor
      const headings = [...doc.querySelectorAll("h1, h2, h3, h4, h5, h6")].map(
        (heading) => ({
          tag: heading.tagName,
          content: heading.textContent.trim(),
        })
      );

      const emptyHeadings = headings.filter((h) => h.content === "");
      const headingLevels = [...new Set(headings.map((h) => h.tag))];
      const missingLevels = [];

      for (let i = 1; i <= 6; i++) {
        if (!headingLevels.includes(`H${i}`)) {
          missingLevels.push(`H${i}`);
        }
      }

      // Scoring și sfaturi
      let score = 100;
      const tips = [];

      if (title === "Fără titlu") {
        score -= 10;
        tips.push("Pagina nu are un titlu.");
      }
      if (metaDescription === "Fără meta descriere") {
        score -= 10;
        tips.push("Pagina nu are o meta descriere.");
      }
      if (wordCount < 300) {
        score -= 15;
        tips.push("Pagina are conținut prea mic (sub 300 de cuvinte).");
      }
      if (imagesWithoutAlt.length > 0) {
        score -= 10;
        tips.push(
          `${imagesWithoutAlt.length} imagini nu au atributul ALT setat.`
        );
      }
      if (!https) {
        score -= 20;
        tips.push("Pagina nu folosește HTTPS (conexiune sigură).");
      }
      if (robotsTxt === "Absent") {
        score -= 5;
        tips.push("Fișierul robots.txt lipsește.");
      } else if (robotsTxt === "Restricționat") {
        tips.push(
          "Fișierul robots.txt este restricționat și nu poate fi accesat public."
        );
      } else if (robotsTxt === "Indisponibil") {
        tips.push("Fișierul robots.txt nu poate fi accesat.");
      }

      // Heading analysis
      if (headings.length > 100) {
        score -= 10;
        tips.push(
          "Pagina are prea multe headinguri. Recomandăm mai puțin de 100."
        );
      }
      if (emptyHeadings.length > 0) {
        score -= 10;
        tips.push(
          `${emptyHeadings.length} headinguri sunt goale. Adăugați conținut în ele.`
        );
      }
      if (missingLevels.length > 0) {
        score -= 10;
        tips.push(
          `Lipsesc nivelele de headinguri: ${missingLevels.join(", ")}.`
        );
      }

      setSeoData({
        title,
        metaDescription,
        wordCount,
        imagesCount: images.length,
        imagesWithoutAlt: imagesWithoutAlt.length,
        https,
        robotsTxt,
        robotsUrl,
        headings,
        emptyHeadings,
        missingLevels,
        score,
        tips,
      });
    } catch (err) {
      setError(
        "Eroare la accesarea paginii. Verifică URL-ul sau folosește o pagină fără restricții CORS."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>SEO Checker</h1>
      <input
        type="text"
        placeholder="Introduceți URL-ul"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <button onClick={analyzePage} disabled={loading}>
        Analizează
      </button>
      {loading && <p>Se încarcă...</p>}
      {error && <p className="error">{error}</p>}
      {seoData && (
        <div className="results">
          <h2>Rezultate SEO</h2>
          <p>
            <strong>Scor:</strong> {seoData.score}/100
          </p>
          <p>
            <strong>Titlu:</strong> {seoData.title}
          </p>
          <p>
            <strong>Meta descriere:</strong> {seoData.metaDescription}
          </p>
          <p>
            <strong>Număr de cuvinte:</strong> {seoData.wordCount}
          </p>
          <p>
            <strong>Imagini fără ALT:</strong> {seoData.imagesWithoutAlt}/
            {seoData.imagesCount}
          </p>
          <p>
            <strong>HTTPS:</strong> {seoData.https ? "Da" : "Nu"}
          </p>
          <p>
            <strong>Robots.txt:</strong> {seoData.robotsTxt}
          </p>
          <p>
            <strong>URL Robots.txt:</strong> {seoData.robotsUrl}
          </p>
          <h3>Analiza headingurilor:</h3>
          <p>
            <strong>Total headinguri:</strong> {seoData.headings.length}
          </p>
          <p>
            <strong>Headinguri goale:</strong> {seoData.emptyHeadings.length}
          </p>
          <p>
            <strong>Nivele lipsă:</strong>{" "}
            {seoData.missingLevels.join(", ") || "Niciun nivel lipsă"}
          </p>
          <h3>Sfaturi:</h3>
          <ul>
            {seoData.tips.map((tip, index) => (
              <li key={index}>{tip}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default App;
