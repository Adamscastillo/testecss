$(document).ready(function () {
  montaPedeCPF();
});

function montaPedeCPF() {
  new Cadastro({
    dados: {},
    item: { objCabecalho: {}, pai: {} },
    naoVinculaComItem: true,
    onde: obj('areaCadastro'),
    iniciaEditando: true,
    botoes: [{ tipo: 'padrao', conteudo: 'enviar', classe: 'botPadrao enviar', funcao: 'enviar', id: 'enviar' }],
    campos: [
      {
        label: "CPF do aluno a ser matriculado", id: 'cpf', tipo: CampoCpf, cmp: 'naoGrava', max: 14, quebra: true,
        eventos: { 'keyup': { obj: 'cadastro', 'funcao': 'clique' } }, valorInicial: '87222640789'
      },
    ],
    enviar: function () { enviaCPF.call(this); },
    clique: function (e) { cliqueCPF.call(this, e) }
  });
}

function cliqueCPF(e) {
  if (e.keyCode == 13) enviaCPF.call(this);
}

function enviaCPF() {
  // o this desta função é o cadastro do envio de CPF
  const campoCPF = this.camposID['cpf'].objetoCampo;
  const valida = campoCPF.validaEspecifico();
  const cpf = campoCPF.valor;
  if (cpf == '') aviso.call(this, 'Por favor preencha o CPF');
  else if (valida && valida.aviso) aviso.call(this, valida.aviso);
  else {
    const bot = this.botoes.find(bot => bot.id == "enviar").objBotao;
    bot.desabilita();
    const url = "matriculaonline/cadCpf.php";
    //const info = JSON.stringify({ cpf: cpf, idEsc: _idEsc });
    const info = "cpf=" + cpf + "&idEsc=" + _idEsc;
    const esteCadastro = this;
    new cnx.carrega(url, function () { retornoCPF.call(esteCadastro, this.resposta) }, null, "POST", info);
  }
}

function aviso(msg, classe) {
  // o this desta função é o cadastro
  const bot = this.botoes[0].objBotao.elementoDom; // o primeiro botão do cadastro
  classe = (classe) ? " " + classe : "";
  const divAviso = $("<div class='aviso" + classe + "'>" + msg + "</div>").insertAfter(bot);
  setTimeout(function () { divAviso.remove() }, 3000);
}

function retornoCPF(retorno) {
  retorno = jQuery.parseJSON(retorno);
  let paramAluno = { dados: retorno };
  paramAluno.dados["cpf"] = formataCPF(this.camposID['cpf'].objetoCampo.valor);
  if (retorno['erro']) {
    paramAluno.titulo = 'Por favor informe seus dados:';
    montaEditAluno.call(this, paramAluno);
  } else {
    paramAluno.titulo = 'Olá ' + retorno.nome + ', informe seus dados de acesso para continuar o processo:';
    pedeSenha.call(this, paramAluno);
  }
}

function retornoLoginMatricOnline(retorno) {
  const cadastro = login.cadastroOriginal;
  let paramAluno = { dados: retorno };
  paramAluno.dados["cpf"] = formataCPF(cadastro.camposID['cpf'].objetoCampo.valor);
  paramAluno.titulo = 'Por favor confira seus dados e atualize-os se necessário:';
  montaEditAluno.call(cadastro, paramAluno);
}

function pedeSenha(parametros) {
  const campos = [
    { label: 'CPF', id: 'cpf', tipo: CampoCpf, tab: 20, sqlTipo: "texto", quebra: true },
    { label: 'digite seu nome de usuário', id: 'divUsu', tipo: CampoTexto, cmp: "nome", quebra: true, obrigatorio: true, valorInicial:'alunonovo', }, 
    { label: 'digite sua senha', id: 'divSen', tipo: CampoSenha, cmp: "email", quebra: true, obrigatorio: true, valorInicial:'mzmu7477' }
  ];
  const botEnviar = {
    tipo: 'padrao', conteudo: 'enviar', classe: 'botPadrao', tip: 'enviar', id: 'enviar',
    funcao: 'enviaSenha', enviaSenha: function () { }
  };
  return montaCadastro.call(this, parametros, 'pedeSenha', campos, null, [ botEnviar ]);
}

function hoje() {
  const dataAtual = new Date();
  const dia = dataAtual.getDate();
  const mes = (dataAtual.getMonth()) + 1;
  const ano = dataAtual.getFullYear();
  const data = formataData(dia + "/" + mes + "/" + ano, null, true);
  return data;
}

function montaEditAluno(parametros) {
  const campos = [
    {
      id: "cadastroCompilado", tipo: CampoSemCampo, tab: 20, cmp: "cadastroCompilado", sqlTipo: "num",
      gravaSeAlterouTabela: true, valorInicial: 1
    },
    { label: 'nome', id: 'nome', tipo: CampoTexto, tab: 20, cmp: "nome", sqlTipo: "texto", quebra: true, obrigatorio: true },
    { label: 'e-mail', id: 'email', tipo: CampoEmail, tab: 20, cmp: "email", sqlTipo: "texto", quebra: true, obrigatorio: true },
    { label: 'CPF', id: 'cpf', tipo: CampoCpf, tab: 20, sqlTipo: "texto", quebra: true },
    {
      label: "DDI", id: "ddiFone", tipo: CampoSelect, tab: 20, lista: parametros.dados.ddiPais, cmp: "paisFone", sqlTipo: "num",
      quebra: true, classeEspecial: "ddi"
    },
    { label: "DDD", id: "dddFone", tipo: CampoNumerico, tab: 20, cmp: "dddFone", sqlTipo: "num", quebra: true, classeEspecial: "ddd" },
    { label: "numero", id: "fone", tipo: CampoTexto, tab: 20, cmp: "fone", sqlTipo: "num", quebra: true },
    {
      label: "DDI", id: "ddiCel", tipo: CampoSelect, tab: 20, lista: parametros.dados.ddiPais, cmp: "paisCel", sqlTipo: "num",
      quebra: true, classeEspecial: "ddi"
    },
    { label: "DDD", id: "dddCel", tipo: CampoNumerico, tab: 20, cmp: "dddCel", sqlTipo: "num", quebra: true, classeEspecial: "ddd", obrigatorio: true },
    { label: "numero", id: "cel", tipo: CampoTexto, tab: 20, cmp: "cel", sqlTipo: "num", quebra: true, obrigatorio: true },
    { label: 'rua', id: "rua", tipo: CampoTexto, max: 250, tab: 20, cmp: "rua", sqlTipo: "texto", quebra: true, obrigatorio: true },
    { label: 'numero', id: "num", tipo: CampoTexto, tab: 20, cmp: "num", sqlTipo: "texto", quebra: true, obrigatorio: true },
    { label: 'complemento', id: "compl", tipo: CampoTexto, tab: 20, cmp: "compl", sqlTipo: "texto", quebra: true },
    { label: 'bairro', id: "bairro", tipo: CampoTexto, max: 250, tab: 20, cmp: "bairro", sqlTipo: "texto", quebra: true, obrigatorio: true },
    { label: 'pais', id: "pais", tipo: CampoSelect, tab: 20, lista: parametros.dados.paises, cmp: "naoGrava", sqlTipo: "num", quebra: true },
    { label: 'estado', id: "est", tipo: CampoSelect, tab: 20, cmp: "naoGrava", sqlTipo: "num", basearEm: "pais", quebra: true },
    { label: 'cidade', id: "cid", tipo: CampoCidade, tab: 20, cmp: "id_cid", sqlTipo: "num", basearEm: "est", quebra: true },
    {
      label: 'CEP', id: "cep", tipo: CampoCep, tab: 20, cmp: "cep", sqlTipo: "texto", quebra: true, obrigatorio: true,
      camposEnd: { "rua": "rua", "compl": "compl", "bairro": "bairro", "cid": "cid", "est": "est", "pais": "pais" }
    }
  ];
  const botoes = [{ tipo: 'gravar', conteudo: 'gravar', classe: 'botPadrao', id: 'gravar' }];
  if (parametros.dados.id == 'novo_aluno') {
    campos.push({ id: "id_perf", tipo: CampoSemCampo, tab: 30, cmp: "id_perf", sqlTipo: "num", valorInicial: parametros.dados.setup["perfilPadrao"], gravaSempre: true });
    campos.push({ id: "ini", tipo: CampoSemCampo, tab: 30, cmp: "ini", sqlTipo: "data", valorInicial: hoje(), gravaSempre: true });
    campos.push({ id: "fim", tipo: CampoSemCampo, tab: 30, cmp: "fim", sqlTipo: "data", valorInicial: hoje(), gravaSempre: true });
  } else {
    botoes.unshift({ tipo: 'padrao', conteudo: 'não alterar', classe: 'botPadrao', id: 'naoAlterar', 
      funcao: 'naoAlterar', naoAlterar: function() { naoAlterar.call(this.pai) } });
  }
  const gruposCampos = [
    { id: "foneCompleto", legenda: "telefone", campos: ["ddiFone", "dddFone", "fone"], naoClear: true, colocaAntesCampo: "cadPor", classeEspecial: "foneCompleto" },
    { id: "celCompleto", legenda: "celular", campos: ["ddiCel", "dddCel", "cel"], naoClear: true, colocaAntesCampo: "cadPor", classeEspecial: "foneCompleto" },
    { id: 'endereco', legenda: 'Endereço', campos: ["cep", "rua", "num", "compl", "bairro", "pais", "est", "cid"] },
  ];
  montaCadastro.call(this, parametros, 'cadAluno', campos, gruposCampos, botoes);
}

function montaCadastro(parametros, classe, campos, gruposCampos, botoes) {
  $("#intro").hide(); // show()
  limpaAreaCadastro();
  const areaCadastro = obj('areaCadastro');
  colocaClasse(areaCadastro, classe);

  botoes.unshift({ tipo: 'padrao', conteudo: 'cancelar', classe: 'botPadrao', tip: 'cancelar', id: 'cancelar', funcao: 'testaCancelar' });

  const cadastro = new Cadastro({
    dados: parametros.dados,
    item: { objCabecalho: {}, pai: {}, li: { childNodes: [] } },
    naoVinculaComItem: true,
    onde: areaCadastro,
    iniciaEditando: true,
    naoRemontaAoGravar: true,
    acaoBusca: 380,
    botoes: botoes,
    avisoExcluir: 'Deseja cancelar ao processo de matrícula online?',
    incluiGravaGet: { pag: 40 }, // pagina de alunos para o cadastro do aluno
    campos: campos,
    gruposCampos: gruposCampos,
    classe: classe,
    antesDeExcluir: function () { return cancelar.call(this) },
    antesMontar: function () { this.incluiGravaPost = { idLicen: this.dados.idLicen } },
    aposMontar: function () { aposMontar.call(this, parametros.titulo) },
    aposGravar: function (retorno) { gravouDadosAluno.call(this, retorno) },
    testaCancelar: function () { testaCancelar.call(this) }
  });

  return cadastro;
}

function limpaAreaCadastro() {
  const areaCadastro = obj('areaCadastro');
  limpaConteudo(areaCadastro);
  tiraClasse(areaCadastro, 'cadAluno');
  tiraClasse(areaCadastro, 'pedeSenha');
  tiraClasse(areaCadastro, 'pedeEmail');
  //tiraClasse(areaCadastro, 'valores');
}

function testaCancelar() {
  // troca o id se for novo para não excluir direto, pedir a confirmação antes
  const idOld = this.dados.id;
  if (this.dados.id.toString().substring(0, 4) == 'novo') this.dados.id = this.dados.id.substring(2);
  this.testaExclusao.call(this);
  this.dados.id = idOld;
}

function cancelar() {
  // aplica o "cancelar" não deixando passar para a função de exclusão padrão do cadastro
  // volta ao início
  $("#intro").show();
  limpaAreaCadastro();
  montaPedeCPF();
  return false;
}

function aposMontar(msg) {
  colocaTitulo.call(this, msg);
  const campoCPF = this.camposID["cpf"];
  campoCPF.objetoCampo.cmp = "cpf";
  campoCPF.objetoCampo.gravaSempre = true;
  if (this.classe == 'pedeSenha') {
    const este = this;
    const campoSenha = this.camposID["divSen"].objetoCampo.elementoDiv;
    $("<a class='botaoDoCampo recupSenha' title='recupere sua senha'>recupere sua senha</a>")
      .appendTo(campoSenha).on("click", function () { pedeEmailParaSenha.call(este) });
    ajustaParaLogin.call(this);
  }
}

function ajustaParaLogin() {
  // coloca o ID "bot" no botão de enviar
  const botEnviar = this.objBotoes.listaBotoes.find(bot => bot.objBotao.funcao == 'enviaSenha');
  botEnviar.objBotao.elementoDom.setAttribute('id', 'bot');
  // cria um form inócuo
  $("<form id='form'></form>").appendTo(this.divCadastro);
  // troca o ID dos campos de usuário e senha
  this.camposID['divUsu'].objetoCampo.campo.setAttribute('id', 'usu');
  this.camposID['divSen'].objetoCampo.campo.setAttribute('id', 'sen');
  // incializa os campos de login
  login.ini();
  // ajusta os parâmetros
  login.url = "func/login.php";
  login.origem = "matriculaonline";
  login.text.botEntra = 'enviar';
  login.idUsu = this.dados.id;
  login.cadastroOriginal = this;
}

function colocaTitulo(msg) {
  this.titulo = $("<h6 class='titulo'>" + msg + "</h6>").appendTo(this.onde);
}

function gravouDadosAluno(retorno) {
  if (retorno.grava != 1) {
    // deu erro na gravação. informar ao usuário
  } else {
    this.dados.id = retorno.id;
    // gravou com sucesso -> próximo passo
    buscaCursos.call(this);
  }
}

function buscaCursos() {
  limpaAreaCadastro();
  $("<h6 class='titulo'>Escolha o curso e a turma que irá cursar:</h6>").appendTo($("#areaCadastro"));
  this.divCarregando = $("<div class='carregando'>buscando os cursos disponíveis. Por favor aguarde...</div>").appendTo($('#areaCadastro'));
  const url = 'matriculaonline/escCurso.php';
  const info = "acao=turmas&idEsc=" + _idEsc;
  const esteCadastro = this;
  new cnx.carrega(url, function () { retornoCursos.call(esteCadastro, this.resposta) }, null, "POST", info);
}

function retornoCursos(retorno) {
  retorno = jQuery.parseJSON(retorno);
  this.divCarregando.remove();
  if (retorno['erro']) {
    aviso.call(this, 'entre em contato com a escola');
  } else {
    infoCursos.call(this, retorno);
  }
}

function infoCursos(parametros) {
  const cursos = {};
  const estagios = {};
  const esteCadastro = this;
  const listaCursos = $("<ul class='cursos'></ul>")
    .on("click", "ul.turmas>li:not(.mostraValores)", function() { buscaValores.call(esteCadastro, this) })
    .on("click", "ul.turmas a.confirmar", function() { confirmaMatric.call(esteCadastro, this) })
    .on("click", "ul.turmas a.cancelar", function() { cancelaMatric.call(esteCadastro, this) });
  var listaEstagios, listaTurmas;
  //log(parametros);
  parametros.map(turma => {
    if (!cursos[turma.idCurs]) {
      const liCurso = $("<li></li>").appendTo(listaCursos);
      liCurso.append($("<h5>" + turma.curso + "</h5>"));
      if (turma.objCurso) liCurso.append($("<span class='obj'>" + turma.objCurso + "</span>"));
      listaEstagios = $("<ul class='estagios'></ul>").appendTo(liCurso);
      cursos[turma.idCurs] = turma.curso;
    }
    if (!estagios[turma.idEst]) {
      const liEstagio = $("<li></li>").appendTo(listaEstagios);
      if (turma.estagio) {
        liEstagio.append($("<h6>" + turma.estagio + "</h6>"));
        if (turma.objEstagio) liEstagio.append($("<span class='obj'>" + turma.objEstagio + "</span>"));
      }
      listaTurmas = $("<ul class='turmas'></ul>").appendTo(liEstagio);
      estagios[turma.idEst] = turma.estagio;
    }
    const liTurma = $("<li id='turm_" + turma.idTurm + "'></li>").appendTo(listaTurmas);
     
    liTurma.append($("<div class='nome'><label>turma:</label><span>" + turma.turma + "</span><div class='limpa'></div></div>"));
    if (turma.obsTurma) liTurma.append($("<span class='obj'>" + turma.obsTurma + "</span>"));
    if (turma.ini) liTurma.append($("<div class='data'><label>início:</label><span>" + turma.ini + "</span><div class='limpa'></div></div>"));
    if (turma.fim) liTurma.append($("<div class='data'><label>término:</label><span>" + turma.fim + "</span><div class='limpa'></div></div>"));
    if (turma.horarios) {
      const horarios = $("<ul class='horarios'>horários turma: </ul>");
      turma.horarios.map(horario => { horarios.append($("<li>" + horario.dia + " das " + horario.ini + " às " + horario.fim + "</li>")) });
      liTurma.append(horarios);
    }
  });
  
  $("#areaCadastro").append(listaCursos);
}


function pedeEmailParaSenha() {
  const parametros = { dados: { id: this.dados.id }, titulo: 'Por favor informe seu e-mail para recuperar a senha' };
  parametros.dados["cpf"] = formataCPF(this.camposID['cpf'].objetoCampo.valor);
  const campos = [
    { label: 'CPF', id: 'cpf', tipo: CampoCpf, tab: 20, sqlTipo: "texto", quebra: true },
    { label: 'informe seu e-mail cadastrado', id: 'email', tipo: CampoEmail, cmp: "email", quebra: true, obrigatorio: true, 
      posLabel: 'Se não lembra seu e-mail cadastrado, por favor entre em contato com a escola' },
  ];
  const botEnviar = {
    tipo: 'padrao', conteudo: 'enviar', classe: 'botPadrao enviar', tip: 'enviar', id: 'enviar',
    funcao: 'enviaEmailParaSenha', enviaEmailParaSenha: function () { enviaEmailParaSenha.call(this.pai) }
  };
  montaCadastro.call(this, parametros, 'pedeEmail', campos, null, [ botEnviar ]);
};

function enviaEmailParaSenha() {
  const campoEmail = this.camposID['email'].objetoCampo;
  const valida = campoEmail.validaEspecifico();
  const email = campoEmail.valor;

  if (email == '') aviso.call(this, 'por favor informe seu e-mail cadastrado', 'emailVazio');
  else if (valida && valida.aviso) aviso.call(this, valida.aviso);
  else {
    this.botEnviar = this.botoes.find(bot => bot.id == "enviar").objBotao;
    this.botEnviar.desabilita();
    const url = 'matriculaonline/buscaEmail.php';
    const info = 'email=' + email + '&id=' + this.dados.id + "&idEsc=" + _idEsc;
    const esteCadastro = this;
    new cnx.carrega(url, function () { retornaEmailSenha.call(esteCadastro, this.resposta) }, null, "POST", info);
  }  
};

function retornaEmailSenha(retorno) {
  retorno = jQuery.parseJSON(retorno);
  if (retorno.erro > 0) {
    aviso.call(this, retorno.msg || retorno.erro);
    this.botEnviar.habilita();
  } else if (retorno.envio == 1) {
    let nome = retorno.emails.split('<')[0];
    nome = nome.substr(0, nome.length - 1);
    let email = retorno.emails.split('<')[1];
    email = email.substr(0, email.length - 1);
    let paramAluno = { dados: { id: this.dados.id, cpf: this.dados.cpf } };
    paramAluno.titulo = 'Olá ' + nome + ', informe seus dados de acesso para continuar o processo:';
    const novoCadastro = pedeSenha.call(this, paramAluno);
    aviso.call(novoCadastro, 'O e-mail de senha foi enviado para ' + email);

  } else {
    aviso.call(this, 'O e-mail não pôde ser enviado. Por favor tente novamente.');
    this.botEnviar.habilita();
  }

};

function naoAlterar() {
  const idUsu = this.dados.id;
  buscaCursos.call(this, idUsu);
}

function buscaValores(li) {
  colocaClasse(li, 'mostraValores');
  $("<div class='carregando'>buscando valores...</div>").appendTo(li);
  const idTurm = li.getAttribute("id").split("_")[1];
  const url = 'matriculaonline/escCurso.php';
  const info = "acao=valores&idTurm=" + idTurm;
  const esteCadastro = this;
  new cnx.carrega(url, function () { retornoValores.call(esteCadastro, this.resposta, li, idTurm) }, null, "POST", info);
}

function retornoValores(retorno, li, idTurm) {
  retorno = jQuery.parseJSON(retorno);
  $(li).find("div.carregando").remove();
  if (!retorno.idTurm) {
    // deu algum erro, informar ao usuário
  } else {
    if (retorno.idTurm == idTurm) infoValores.call(this, retorno.valores, li, idTurm); 
  }
}

function infoValores(valores, li, idTurm) {
  const divValores = $("<div class='valores'></div>");
  const listaValores = $("<ul class='info_'></ul>").appendTo(divValores);
  const taxaMatricula = valores.filter(val => val.idCat == 1);
  if (taxaMatricula.length > 0) listaValores.append(valoresPorTipo("taxa de matrícula", taxaMatricula, 'txMat', idTurm));
  const matDidat = valores.filter(val => val.idCat == 48);
  if (matDidat.length > 0) listaValores.append(valoresPorTipo("material didático", matDidat, 'matDid', idTurm));
  const pagamentos = valores.filter(val => val.idCat != 1 && val.idCat != 48);
  if (pagamentos.length > 0) listaValores.append(valoresPorTipo("pagamentos", pagamentos, 'pagtos', idTurm));
  
  
  var texto = "Confirma a matrícula nesta turma";
  if (taxaMatricula.length > 0 || matDidat.length > 0 || pagamentos.length > 0) {
    if (taxaMatricula.length > 1 || matDidat.length > 1 || pagamentos.length > 1) {
      texto += " com os valores selecionados";
    } else {
      texto += " com os valores indicados";
    }
  }
  divValores.append($("<label class='msgConfirma'>" + texto + "?</label>"));

  $("<div class='botoes'>" +
      "<a class='botPadrao cancelar'>cancelar</a>" +
      "<a class='botPadrao confirmar' id='gravar'>confirmar</a>" +
    "</div>").appendTo(divValores);
    
  divValores.appendTo(li);
}

function valoresPorTipo(titulo, lista, nome, idTurm) {
  const li = $("<li><h7>" + titulo + "</h7></li>");
  const ul = $("<ul></ul>").appendTo(li);
  const quant = lista.length;
  lista.map(val => {
    const liValor = $("<li class='valoresTipo'></li>");
    if (quant > 1) $("<input type='radio' name='" + idTurm + "_" + nome + "' class='check' id='val_" + val.id + "' />").appendTo(liValor);
    const labelValor = $("<label" + ((quant > 1) ? " for='val_" + val.id + "' class='comInput'" : "") + "></label>").appendTo(liValor);
    if (val.nome.length > 0) $("<span class='nome'>" + val.nome + ":</span>").appendTo(labelValor);
    if (val.valor.length > 0) $("<span class='valor'>R$" + val.valor + "</span>").appendTo(labelValor);
    if (val.vezes.length > 0) $("<span class='vezes'>em " + val.vezes + " " + ((val.vezes > 1) ? "vezes" : "vez") + "</span>").appendTo(labelValor);
    liValor.appendTo(ul);
  });
  return li;
}

function confirmaMatric(bot) {
  const divValores = $(bot).closest("div.valores");
  const inputs = divValores.find("input");
  if (inputs.length > 0) {
    const grupos = [];
    inputs.each((cont, input) => grupos[input.getAttribute("name")] = true);
    const avisos = [];
    Object.keys(grupos).map(nome => {
      const grupo = inputs.filter("[name='" + nome + "']");
      const selecionadosGrupo = grupo.filter(":checked");
      if (selecionadosGrupo.length == 0) {
        const titulo = grupo.first().closest('li:not(.valoresTipo)').find('h7').html();
        avisos.push(" *Selecione uma opção de " + titulo);    
      }
    });   
    if (avisos.length == 0) { 
      gravaMatricula.call(this, bot);
    } else {
      const divAviso = $("<div class='aviso'>" + avisos.join("<br>") + "</div>");
      $(bot).before(divAviso);
      inputs.on('click', function () { divAviso.remove(); }); 
    }
  } else { 
    gravaMatricula.call(this, bot);
  }

}

function cancelaMatric(bot) {
  const liTurma = $(bot).closest("li");
  liTurma.removeClass('mostraValores');
  liTurma.find("div.valores").remove();
}

function gravaMatricula(bot) {
  const divBotoes = $(bot).parent();
  const idTurm = divBotoes.closest('li').first().attr("id").split("_")[1];
  const idUsu = this.dados.id;
  const divValores = divBotoes.parent();
  const idsTaxas = [];
  divValores.find("input:checked").each((cont, input) => idsTaxas.push(input.getAttribute("id").split("_")[1]));
  divBotoes.empty();
  this.divCarregando = $("<div class='carregando gravando'>gravando matricula</div>").appendTo(divBotoes);
  const url = 'matriculaonline/escCurso.php';
  const info = "acao=matric&idUsu=" + idUsu + "&idTurm=" + idTurm + "&idTaxa=" + idsTaxas.join(",");
  const esteCadastro = this;
  new cnx.carrega(url, function () { gravouMatric.call(esteCadastro, this.resposta) }, null, "POST", info);
}

function gravouMatric(retorno) {
  log(retorno);
}

