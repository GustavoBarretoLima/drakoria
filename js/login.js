document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;

  if (!usuario || !senha) {
    alert("Por favor, preencha todos os campos!");
    return;
  }

  const isGitHubPages = window.location.hostname.endsWith("github.io");
  const basePath = isGitHubPages ? "/drakoria/" : "/";

  window.location.href = `${basePath}pages/personagens.html`;
});
