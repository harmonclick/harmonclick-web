/* Página de preguntas frecuentes: todas cerradas; se abren solo con un clic */
(function () {
  "use strict";
  HC.listo.then((datos) => {
    HC.montarAcordeon(HC.$("#acordeon"), datos.faq);
    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify({
      "@context": "https://schema.org", "@type": "FAQPage",
      mainEntity: datos.faq.map((f) => ({ "@type": "Question", name: f.p, acceptedAnswer: { "@type": "Answer", text: f.r } }))
    });
    document.head.appendChild(ld);
    HC.pintarIconos();
  });
})();
