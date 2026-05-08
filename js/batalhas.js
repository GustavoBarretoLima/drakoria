window.onload = function () {
  const classe = localStorage.getItem("classeEscolhida");
  const genero = localStorage.getItem("generoEscolhido");

  if (classe && genero) {
    document.getElementById("infoPersonagem").textContent =
      `Você está jogando como ${classe} (${genero})`;
  } else {
    document.getElementById("infoPersonagem").textContent =
      "Nenhum personagem selecionado.";
  }
};
