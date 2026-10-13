/* Página de preguntas frecuentes: las preguntas ya vienen en el HTML (para Google); aquí solo se activa el clic.
   Todas empiezan cerradas y se abren solo con un clic. */
(function () {
  "use strict";
  HC.listo.then((datos) => {
    HC.montarAcordeon(HC.$("#acordeon"), datos.faq);
    HC.pintarIconos();
  });
})();
