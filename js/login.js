document.getElementById("loginForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const usuario = document.getElementById("usuario").value;
  const senha = document.getElementById("senha").value;

  console.log(`Usuário: ${usuario}, Senha: ${senha}`);

  // Simulação de login bem-sucedido
  if (usuario && senha) {
    window.location.href = "personagens.html";
  } else {
    alert("Por favor, preencha todos os campos!");
  }
});
