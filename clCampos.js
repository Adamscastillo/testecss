
// *******************************************************************************************************************************
// Classe que gerencia cada Campo utlizado em cadastro, filtro, parâmetro, etc...
// *******************************************************************************************************************************
function clCampo(atrib, pai) {
	this.pai = pai;
	for (var i in atrib) {
		this[i] = atrib[i];
	}
	this.invalido = false;
	if (this.trataCampoInicio) this.trataCampoInicio();
	this.campoVisu = cria('span', { className: 'campo', innerHTML: '&nbsp;' });
	this.$campoVisu = $(this.campoVisu);
}

clCampo.prototype.cria = function() {
	if (this.condicao && !this.condicao()) {
		this.trocaTag = function() {};
		return;
	}
	var cadastro = this.pai;
	while (cadastro && cadastro.classeObjeto != "cadastro") cadastro = cadastro.pai;
	this.cadastro = cadastro;
	var controle = (cadastro && cadastro.controle) ? cadastro.controle : "";
	var divID = controle + this.id;
	var div = this.elementoDiv = cria("div", { id: divID, className: "campo " + this.id });
	if (this.quebra) colocaClasse(div, "quebra");
	if (this.classeEspecial) colocaClasse(div, ((typeof(this.classeEspecial) == "function") ? this.classeEspecial.call(this) : this.classeEspecial));
	this.idCampo = "campo_" + divID;
	if (this.pai && this.pai.dados && this.pai.dados.id) this.idCampo += "_" + this.pai.dados.id;
	this.colocaLabel();
	this.campo = this.criaCampo();
	if (this.tabindex) this.campo.setAttribute("tabindex", this.tabindex);
	// se tiver o this.tipConteudo coloca o conteudo do campo no title
	if (typeof(this.tip) == "function") this.tip = this.tip();
	if ((!this.semTitle && this.label && typeof(this.label) == "string") || this.tip || this.tipConteudo) 
		this.elementoDiv.title = (this.tip) ? this.tip : ((this.tipConteudo) ? (this.nomeSelecionado || this.campo.value || "") : this.label.replace(/:$/, ""));
	if (this.inverte && div.firstChild) div.insertBefore(this.campo, div.firstChild); else div.appendChild(this.campo);
	this.campo.id = this.idCampo; // coloca id no campo para o htmlFor do label
	for (var i in this.atrib) this.campo.setAttribute(i, this.atrib[i]); // se tem atributos específicos, coloca no campo
	if (this.placeholder) this.campo.setAttribute('placeholder', this.placeholder);
	var esteCampo = this;
	if (this.mascara) adicionaEvento(this.campo, "keyup", function(e) { if (e.keyCode != "8") esteCampo.mascara.apply(esteCampo); });
	adicionaEvento(this.campo, "focus", function() { esteCampo.foca.apply(esteCampo); });
	adicionaEvento(this.campo, "blur", function() { esteCampo.desfoca.apply(esteCampo); });
	if (this.valorInicial != undefined || this.gravaSempre) {
		this.colocaValorOriginal();
		if (this.ajustaSelects) this.ajustaSelects();
	}
	if (this.desabilitado) this.desabilita();
	var valorDoCampo = this.valorOriginal();
	if (this.soMostraComConteudo === true && (valorDoCampo == 0 || valorDoCampo.length === 0)) colocaClasse(div, "some");
	// se o campo já inicia com valor, roda o desfoca para atualizar o objeto
	if (valorDoCampo != undefined && valorDoCampo != null) this.desfoca();
	this.verificaBasearEm();
	// se tem método para tratar o campo, chama depois de ter sido criado
	if (this.aposCriarCampo) this.aposCriarCampo();
	// se tem método para tratar o campo, chama depois de ter sido criado
	if (this.aposAposCriarCampo) this.aposAposCriarCampo();
	if (this.posLabel) this.colocaPosLabel();
	if (this.dica) this.colocaDica();
	this.colocaEvento();
	return div;
};

clCampo.prototype.criaCampo = function() {
	// método padrão que deve ser sobreposto pelo método de cada tipo de campo
	return cria('div');
};

clCampo.prototype.colocaLabel = function(novoLabel) {
	if (novoLabel) this.label = novoLabel;
	if (this.pai && this.pai.cadastroSemLabel && !this.sempreColocaLabel) return;
	if (typeof(this.label) == "function") this.label = this.label.call(this); 
	if (this.obrigatorio) this.label = (this.label) ? '*' + this.label : '*';
	if (this.label && this.label.length > 0) {
		if (this.campoLabel) {
			// já tem label inserido, então apenas troca o conteúdo do label
			$(this.campoLabel).html(this.label);
			//this.campoLabel = this.elementoDiv.appendChild(this.campoLabel);	
		} else {
			// ainda não tem label, coloca
			this.campoLabel = this.elementoDiv.appendChild(cria('label', { htmlFor: this.idCampo, innerHTML: this.label }));		
			if (this.inverte) this.campoLabel.className = 'inverte';
		}
	}
};

clCampo.prototype.colocaPosLabel = function() {
	this.campoPosLabel = this.elementoDiv.appendChild(cria('label', { className: 'posLabel', htmlFor: this.idCampo, innerHTML: this.posLabel }));
};

clCampo.prototype.colocaDica = function() {
	this.campoDica = this.elementoDiv.appendChild(cria('div', { className: 'dica', htmlFor: this.idCampo, innerHTML: this.dica }));
};

clCampo.prototype.colocaEvento = function() {
	var esteCampo = this;
	for (var evento in this.eventos) {
		var funcao = this.eventos[evento];
		var origem = (funcao.origem) ? funcao.origem : "campo";
		var objeto = this;
		var parametros = funcao.param;
		if (typeof(funcao) != 'string') {
			if (funcao.obj) {
				objeto = funcao.obj;
				var objetoSeparado = objeto.split(".");
				var objetoGlobal = window[objeto];
				var objetoFilho = this[objeto];
				for (var i = 1; i < objetoSeparado.length; i++) {
					if (objetoGlobal) objetoGlobal = (objetoGlobal[objetoSeparado[i]]) ? objetoGlobal[objetoSeparado[i]] : false;
					if (objetoFilho) objetoFilho = (objetoFilho[objetoSeparado[i]]) ? objetoFilho[objetoSeparado[i]] : false;
				}
				objeto = (objetoFilho) ? objetoFilho : objetoGlobal;
			}	
			var ehGlobal = (objetoFilho) ? false : true;
			funcao = funcao.funcao;
		}
		var temporiza = false;
		if (funcao.substr(0, 10) == 'temporiza:') {
			temporiza = true;
			funcao = funcao.substr(10, funcao.length);
		}
		var dados = { "funcao": funcao, "objeto": objeto, "temporiza": temporiza, "ehGlobal": ehGlobal, "parametros": parametros };
		$(this[origem]).on(evento, dados, function(e) { esteCampo.passaEvento.call(esteCampo, e) });
	}
};

clCampo.prototype.passaEvento = function(e) {
	var objeto = e.data.objeto;
	var funcao = e.data.funcao;
	var temporiza = e.data.temporiza;
	var ehGlobal = e.data.ehGlobal;
	var parametros = e.data.parametros;
	var tempo = 1000;
	clearTimeout(this.temporizador);
	var funcaoSeparada = funcao.split(".");
	var funcaoGlobal = window[funcaoSeparada[0]];
	var funcaoNoObjeto = objeto[funcaoSeparada[0]];
	for (var i = 1; i < funcaoSeparada.length; i++) {
		if (funcaoGlobal) funcaoGlobal = (funcaoGlobal[funcaoSeparada[i]]) ? funcaoGlobal[funcaoSeparada[i]] : false;
		if (funcaoNoObjeto) funcaoNoObjeto = (funcaoNoObjeto[funcaoSeparada[i]]) ? funcaoNoObjeto[funcaoSeparada[i]] : false;
	}	
	var funcaoFinal = (funcaoNoObjeto) ? funcaoNoObjeto : funcaoGlobal;
	var objetoThis = (ehGlobal) ? this : objeto;
	if (temporiza) this.temporizador = setTimeout(function(e) { funcaoFinal.call(objetoThis, e, parametros) }, tempo);
	else funcaoFinal.call(objetoThis, e, parametros);
};

clCampo.prototype.colocaTextoMax = function() {
	var div = $(this.elementoDiv);
	if (!this.campoLabel) this.campoLabel = $("<label></label>").prependTo(div)[0];
	var $label = div.children('label');
	this.digitados = this.campo.value.length;
	$label.append("<span class='max'>" + this.digitados + " carac.(máx " + this.max + ")</span>");
};

clCampo.prototype.trocaTextoMax = function(e) {
	if (!this.max) return;
	caracteresInvalidos = [16, 17, 18, 20, 27, 37, 38, 39, 40, 91, 93, 113, 115, 117, 118, 119, 120, 121, 122, 123, 144];
	if (in_array(e.keyCode, caracteresInvalidos) === false) {
		this.digitados = this.campo.value.length;
		var $label = $(this.elementoDiv).children('label');
		$label.children('span').text(this.digitados + " carac.(máx " + this.max + ")");
	}
};

clCampo.prototype.foca = function() {
	this.campo.focus();
	if (!temClasse(this.campo, 'focado')) colocaClasse(this.campo, 'focado');
	return this;
};

clCampo.prototype.verificaAlteracao = function() {
	var cadastro = this.pai;
	// se não tiver os botoes no pai (cadastro) busca no cabecalho
	while (cadastro && cadastro.classeObjeto != 'cadastro') cadastro = cadastro.pai;
	if (cadastro && cadastro.antesVerificaAlteracao) cadastro.antesVerificaAlteracao();
	if (this.alterouCampo) {
		// se o campo tem um método "alterouCampo", chama. Senão tiver, continua o processo para alteração de cadastro
		this.alterouCampo.call(this.pai, this);
		return;
	}
	if (!cadastro || this.naoVerificaCampo) return;
	var valorInserido = (this.campo && this.campo.tagName.toLowerCase() == "textarea") ? this.campo.value : this.pegaValor();
	var objBotoes = cadastro.objBotoes;
	if (cadastro.objGrava) objBotoes = cadastro.objGrava.objBotoes;
	if ((!objBotoes || !objBotoes.temGravar) && cadastro.item && cadastro.item.objCabecalho) objBotoes = cadastro.item.objCabecalho.objBotoes;
	if (cadastro.objBotoesUsados) objBotoes = cadastro.objBotoesUsados;
	if (!objBotoes || !objBotoes.temGravar) return;
	if (cadastro.item || cadastro.onde) {
		if (cadastro.camposAlterados) {
			if (cadastro.camposAlterados(true).length > 0) {
				this.colocaAlteracao();
				temAlteracao.colocaAlterado(cadastro);
				if(cadastro.colocaAlteradoNoBotao != null) cadastro.colocaAlteradoNoBotao(objBotoes);
				if (objBotoes) objBotoes.habilita('gravar');	
				cadastro.foiAlterado = true;
			} else {
				if (cadastro.avisoSalve) cadastro.avisoSalve.fecha();
				temAlteracao.retiraAlterado(cadastro);				
				if(cadastro.retiraAlteradoNoBotao != null) cadastro.retiraAlteradoNoBotao(objBotoes);
				if (objBotoes) objBotoes.desabilita('gravar');
				cadastro.foiAlterado = true;
			}
		} else {
			if (valorInserido != this.valorOriginal()) this.colocaAlteracao();
		}
	}
	if (cadastro && cadastro.aposVerificaAlteracao) cadastro.aposVerificaAlteracao();
};

clCampo.prototype.colocaAlteracao = function() {
	//var cadastro  = (this.pai.objBotoes) ? this.pai : this.pai.pai.pai;
	var cadastro = this.pai;
	while (cadastro && cadastro.classeObjeto != 'cadastro') cadastro = cadastro.pai;
	var seguraAviso = (cadastro.baseAviso) ? cadastro.baseAviso : ((cadastro.objTipo == 'lista') ? cadastro.item.cabecalho : ((cadastro.ondeAviso) ? cadastro.ondeAviso : cadastro.onde));
	if (cadastro.objGrava) seguraAviso = cadastro.objGrava.onde;

	if (!cadastro.avisoSalve) {
		var classeAviso = "salve";
		if (cadastro.classeAviso) classeAviso += " " + cadastro.classeAviso;
		let textoAviso = (cadastro.avisoGravarEspecifico) ? cadastro.avisoGravarEspecifico : fnLang("avisoGravar");
		if (cadastro.avisoGravarExtra) textoAviso += cadastro.avisoGravarExtra;
		cadastro.avisoSalve = new clAviso( { avisos: { aviso: textoAviso }, classe: classeAviso } );
		seguraAviso.appendChild(cadastro.avisoSalve.cria());
		cadastro.avisoSalve.mostra();
	} else if (!cadastro.avisoSalve.visivel) {
		seguraAviso.appendChild(cadastro.avisoSalve.cria());
		cadastro.avisoSalve.mostra();
	}
	if (cadastro.aposAvisoSalve) cadastro.aposAvisoSalve.call(this.cadastro);
};

clCampo.prototype.desfoca = function() {
	if (temClasse(this.campo, 'focado')) tiraClasse(this.campo, 'focado');
	this.valor = this.pegaValor();
	this.validaCampo();
	if (this.trataCampo) this.trataCampo();
	if (this.pai && this.pai.desfoca) this.pai.desfoca.call(this.pai);
	return this;
};		
 
clCampo.prototype.validaCampo = function(avisos) {
	var retorno = false;
	if (this.oculto) return false;
	if (this.obrigatorio) retorno = this.testaObrigatorio();
	if (this.obrigatorioCondicional) retorno = this.testaObrigatorioCondicional();
	// se pode estar vazio ou não está vazio (retorno = false) e tiver sido alterado, se tiver teste específico do campo, testa
	if (!retorno && this.validaEspecifico && this.valor) retorno = this.validaEspecifico();
	//if (!retorno && this.unico) retorno = this.testaUnico();	
	if (retorno && avisos) avisos.push(retorno);
	if (!avisos) return retorno;
	else return avisos;
};

clCampo.prototype.testaObrigatorio = function() {
	var txtAviso = fnLang("campoObrigatorio");
	var valor = this.pegaValor("testaObrigatorio");
	if (!valor || valor.length < 0 || valor == '' || (this.tipoCampo == "select" && valor == "|novo|")) {		
		this.colocaAvisoIndividual(txtAviso);
		if (this.labelObrigatorio) return { label: ((typeof(this.labelObrigatorio) == "function") ? this.labelObrigatorio() : this.labelObrigatorio), aviso: txtAviso };
		else return { label: ((typeof(this.label) == "function") ? this.label() : this.label), aviso: txtAviso };
	} else {		
		this.tiraAvisoIndividual(txtAviso);		
		return false;
	}
};

clCampo.prototype.testaObrigatorioCondicional = function() {
	var lista = this.obrigatorioCondicional;
	if (typeof(lista) == 'string') lista = lista.split(",");
	var obrigatorio = false;
	var campos = this.pai.camposID;
	if (!campos) return;
	for (var i = 0, t = lista.length; t--; i++) if (campos[lista[i]].objetoCampo.valor.length) obrigatorio = true;
	//this.obrigatorio = obrigatorio;
	return (obrigatorio) ? this.testaObrigatorio() : false;
};

clCampo.prototype.testaUnico = function() {
	//var txtAviso = 'valor já cadastrado';
	// verificar se este campo está em um cadastro que está em uma coleção (se não estiver retorna false)
	// passar pela coleção e verificar se em cada cadastro da coleção este mesmo campo tem um valor igual a este
	// se nenhum tiver o mesmo valor, retorna false. Se algum tiver este valor, retorna o aviso
	// return { label: this.label, aviso: txtAviso };
	return false;
};

clCampo.prototype.colocaAvisoIndividual = function(txtAviso, tipo) {
	//var divPai = this.campo.parentNode;
	var divPai = this.elementoDiv;
	if (!temClasse(divPai, 'invalida')) {
		// se não tiver texto de aviso, coloca uma classe diferenciada para ter um formato especial e não marca o campo
		var spanAviso = divPai.appendChild(cria('span', { className: 'aviso ' + this.campo.className, innerHTML: txtAviso }));
		if (txtAviso.length > 0) {
			this.invalido = true;
			colocaClasse(divPai, 'invalida');
		} else {	
			colocaClasse(spanAviso, 'soIndica');
			$(spanAviso).animate({ right: '15%' }, 200, function() { $(this).animate({ right: '7%' }, 300, function() { $(this).animate({ right: '10%' }, 400) }) });
		}
		var esteCampo = this;
		if (tipo) colocaClasse(spanAviso, tipo);
		if (this.tempoAviso == undefined) this.tempoAviso = 3000;
		if (this.tempoAviso > 0) this.tempoAvisoContando = setTimeout(function() { esteCampo.tiraAvisoIndividual.call(esteCampo) }, this.tempoAviso);
	}
};

clCampo.prototype.tiraAvisoIndividual = function(txtAviso) {
	this.invalido = false;
	if (this.campo) var divPai = this.campo.parentNode;
	if (!divPai) return;
	var spanAviso = $(divPai).find('.aviso');
	if (txtAviso && spanAviso.length > 0 && spanAviso.text() != txtAviso) return;
	if (spanAviso.length > 0) {
		spanAviso.fadeOut(300, function(){ 
			removeObj(this);
			tiraClasse(divPai, 'invalida');
		});
	} else {
		tiraClasse(divPai, 'invalida');
	}
};

clCampo.prototype.valorOriginal = function(doBanco) {
	var valorCampo;	
	// this.pai.dadosOriginal é usado no caso de itens do CampoColecao
	if (this.pai && this.pai.dadosOriginal) valorCampo = this.pai.dadosOriginal[this.id];
	else if (this.pai && this.pai.dados && this.id) valorCampo = this.pai.dados[this.id];
	//log(this.id, doBanco);
	if (!doBanco) {
		// se for um campo de filtro, só coloca o valor inicial se for na primeira busca
		var valorInicial = (this.valorInicial && (!this.campoDoFiltro || this.campoDoFiltro.pai.primeiraBusca)) ? this.valorInicial : "";
		if (valorCampo === undefined || valorCampo === null) valorCampo = valorInicial;
		if (valorCampo === undefined || valorCampo === null) valorCampo = '';
	}
	// for(var i = 0, t = this.lista.length; t--; i++){
		// var campos = this.lista[i];
		// if(campos.pai.objCampo.valorInicial) valorCampo = 1
	// }
	return valorCampo;
};

clCampo.prototype.colocaValorOriginal = function(trocaVisu) {
	var valor = this.valorOriginal();
	this.campo.value = valor;
	if (trocaVisu) $(this.campoVisu).text(valor);
	this.desfoca();
};

clCampo.prototype.pegaValor = function() {
	return this.campo.value;
};

clCampo.prototype.trocaTag = function() {
	esteCampo = this;
	this.tiraAvisoIndividual();
	$elementoDiv = $(this.elementoDiv);
	// só torna o campo editável se tiver o atributo cmp (ou se for campo de filtro)
	if (this.pai.ehFiltro || (this.pai.editando && this.cmp && !this.naoEditavel) ) {
		// edita
		removeObj(this.campoVisu);
		if (this.inverte && this.elementoDiv.firstChild) {
			this.elementoDiv.insertBefore(this.campo, this.elementoDiv.firstChild); 
		} else if (this.campoLabel) {
			$(this.campo).insertAfter(this.campoLabel);  
		} else if (this.posLabel || this.dica) {
			$(this.campo).insertAfter(this.elementoDiv.firstChild); 
		} else if ($elementoDiv.children().last().hasClass("limpa")) {
			$(this.campo).insertBefore($elementoDiv.children().last());
		} else this.elementoDiv.appendChild(this.campo);
		if (this.preencheListaFilhos) this.preencheListaFilhos();
		if (this.aposColocarDOM) {
			this.aposColocarDOM();
		}
		if (this.max && !this.naoColocaTextoMax) this.colocaTextoMax();
		if (this.aposEditar) this.aposEditar();
	//	if (this.tipoCampo == "imagem") { this.habilita(); }
	} else {
		// visualiza
		if (this.campo.nextSibling && temClasse(this.campo.nextSibling, "retornaSelect")) removeObj(this.campo.nextSibling);
		if (this.tipoCampo == "html" && this.editorMCE) tinymce.remove(this.editorMCE);
	//	if (this.tipoCampo == "imagem") { this.desabilita(); }
		removeObj(this.campo);
		$elementoDiv.find('label span.max').remove();		
		if (this.inverte && this.elementoDiv.firstChild) {
			this.elementoDiv.insertBefore(this.campoVisu, this.elementoDiv.firstChild); 
		} else {
			if (this.campoPosLabel) this.elementoDiv.insertBefore(this.campoVisu, this.campoPosLabel);
			if (this.campoDica) {
				this.elementoDiv.insertBefore(this.campoVisu, this.campoDica); 
			}
			else if (!this.campoPosLabel) this.elementoDiv.appendChild(this.campoVisu);
		}
		// tira os botões (desde que não seja de filtros dentro de campos - como no CampoColecao)
		$elementoDiv.find('.botao:not(.objFiltro .botao)').remove();
		var conteudo = this.valorOriginal();
		if (this.campo.tagName.toLowerCase() != "textarea") {
			if (this.tipoCampo == "check") this.mantemValorOriginal();
			else if (this.tipoCampo != "arquivo") this.campo.value = conteudo;	
		} else {
			if (temClasse(this.elementoDiv.firstChild, "limpa")) removeObj(this.elementoDiv.firstChild);
			this.elementoDiv.appendChild(cria('div', { className: 'limpa' }));
			this.campo.value = conteudo.replace(/\<br\s?\\?\/?\>/gi, '\n');
			// se o texto for maior que o span ou se tiver quebra de linha, mostra tudo quando passar o mouse
			if (!this.naoLimitaAltura) {
				var tamanhoMostrado = this.$campoVisu.width();
				var divTamanho = $('<div></div>').css('visibility', 'hidden').css('position', 'absolute').html(conteudo).appendTo($(document.body));
				var tamanhoTotal = divTamanho.width();
				divTamanho.remove();
				if (tamanhoMostrado < tamanhoTotal || /\<br\s?\\?\/?\>/gi.test(conteudo)) {
					var campoSpan = $elementoDiv.addClass('comExpansao');
					this.$campoVisu.hover(function() { campoSpan.addClass('veInteiro'); }, 
														function() { campoSpan.removeClass('veInteiro'); });
				}
			}
		}
		if (this.aposVisualizar) this.aposVisualizar();	
	}
	if (this.aposTrocaTag) this.aposTrocaTag.call(this);
	if (this.txtVazio) this.colocaTxtVazio();
};

clCampo.prototype.colocaTxtVazio = function() {
	
};

clCampo.prototype.exibe = function(mantemEspaco) {
	if (mantemEspaco) $(this.elementoDiv).css('visibility', 'visible');
	else $(this.elementoDiv).css('display', 'block');
	this.oculto = false;
	return this;
};

clCampo.prototype.oculta = function(mantemEspaco) {
	if (mantemEspaco) $(this.elementoDiv).css('visibility', 'hidden');
	else $(this.elementoDiv).css('display', 'none');
	this.oculto = true;
	return this;
};

clCampo.prototype.colocaNaoGrava = function() {
	if (!this.cmpOld) this.cmpOld = this.cmp;
	this.cmp = "naoGrava";
	return this;
};

clCampo.prototype.tiraNaoGrava = function() {
	if (this.cmpOld) this.cmp = this.cmpOld;
	return this;
};

clCampo.prototype.colocaEditavel = function() {
	if (this.cmpOld) {
		this.cmp = this.cmpOld;
		delete(this.cmpOld);
		this.trocaTag();
		this.colocaValor(this.valor);
	}
	return this;
};

clCampo.prototype.tiraEditavel = function() {
	this.cmpOld = this.cmp;
	delete(this.cmp);
	this.trocaTag();
	this.colocaValor(this.valor, true);
	return this;
};

clCampo.prototype.trocaLabel = function(label) {
	if (this.campoLabel)this.campoLabel.innerHTML = label;
};

clCampo.prototype.desabilita = function() {
	$(this.elementoDiv).addClass('desabilitado');
	$(this.campo).attr('disabled', 'disabled').addClass('desabilitado');
	this.desabilitado = true;
	return this;
};

clCampo.prototype.habilita = function() {
	$(this.elementoDiv).removeClass('desabilitado');
	$(this.campo).removeAttr('disabled').removeClass('desabilitado');
	delete(this.desabilitado);
	return this;
};

clCampo.prototype.verificaBasearEm = function() {
	// se o campo tem o parâmetro "basearEm", coloca o evento no elemento do qual ele depende
	// pode se basear em mais de um campo (uma lista de IDs de campos)
	if (this.basearEm) {		
		var todosCampos = this.pai.campos;
		var esteCampo = this;		
		if (typeof(this.basearEm) == 'string') this.basearEm = [this.basearEm];
		for (var cadaCampoPai = 0; cadaCampoPai < this.basearEm.length; cadaCampoPai++) {
			var idCampoPai = this.basearEm[cadaCampoPai];
			for (var j = 0; j < todosCampos.length; j++) {
				if (todosCampos[j].id == idCampoPai) {
					var campoPai = todosCampos[j].objetoCampo || todosCampos[j].objCampo;
					var elementoDomPai = campoPai.campo;
					campoPai.temDependente = true;
					adicionaEvento(elementoDomPai, 'change', function() { esteCampo.verificaLista.call(esteCampo, campoPai); });
					this.verificaLista(campoPai);
				}
			}
		}
		//testa a permissao pois remonta a lista por causa do basearEm
		//if (this.pai.aba.perm < 2) this.desabilita();
	}
};

clCampo.prototype.verificaLista = function(campoPai) {
	// para campoSelect e para campoHTML este método é substituído
	// o this desta função é o campo filho
	// considerando que o campoPai é sempre um select
	//console.log(campoPai, campoPai.lista);
};

clCampo.prototype.retornoBasearEm = function(retorno, campoPai) {
	var textoRetorno = this.trataRetorno(retorno.resposta);
	retorno = jQuery.parseJSON(textoRetorno);
	if (campoPai.id) {
		if (retorno.listaDocs != campoPai.pegaValor.call(campoPai)) return;
	} else {
		for (var i = 0; i < campoPai.length; i++) {
			if ( campoPai[i]) {
				var campoTestado = campoPai[i].id;
				if (retorno[campoTestado] != campoPai[i].pegaValor.call(campoPai[i])) return;
			}
		}
	}
	this.colocaValorOriginal(retorno.conteudo);
	if (!this.desabilitado) this.campo.removeAttribute('disabled');
};

clCampo.prototype.trataRetorno = function(texto) {
	// só modifica este método nos campos que precisam de tratamento especial do retorno
	return texto;
};

clCampo.prototype.removeDom = function() {
	//remove o campo do DOM
	//nao remove do this para não perder os dados
	if (this.elementoDiv) this.elementoDiv.remove();
	return this;
};

clCampo.prototype.foiAlterado = function() {
	// Para saber se é um item novo, sobe ao pai. 
	// Se o pai não for um cadastro, já é o itemCampoColecao, senão sobe ao item do cadastro
	if (this.oculto) return false; 
	if (this.cmp == 'compl2' && this.valor == this.pai.dados.compl2) return false;
	var paiEhNovo = (this.pai && this.pai.ehNovo); 
	if (!this.vinculo) { 
		if (this.tab && this.cmp && this.cmp != 'naoGrava') { 
			var valor = this.valor;
			var original = this.originalTratado();
			//log(this.id, '|', valor, '|', original, '|', (this.gravaSempre || (((paiEhNovo && valor.length > 0) || valor != original) && valor != undefined && !this.carregando)));
			if (this.comparaFloat) {
				if (valor) valor = parseFloat(valor.toString().replace(",", "."));
				if (original) original = parseFloat(original.toString().replace(",", "."));
			}
			//log(this.id, '|', valor, '|', original, '|', (this.gravaSempre || (((paiEhNovo && valor.length > 0) || valor != original) && valor != undefined && !this.carregando)));
			if (this.gravaSempre || ((paiEhNovo || valor != original) && valor != undefined && !this.carregando)) {
				return this.dadosGravacaoCampo();
			}
		}
	}
	return false;
};

clCampo.prototype.dadosGravacaoCampo = function() {
	var valorEnviado = this.valor;
	if (this.tipoCampo == "radio" && this.campoUnico) { valorEnviado = this.valorRadioSelecionado(); this.fixaValor = true; }
	valorEnviado = (this.tipoCampo == "arquivo") ? this.nomeArquivo() : ((this.fixaValor) ? valorEnviado : ((this.valorParaGravar) ? this.valorParaGravar() : this.pegaValor()));
	delete this.fixaValor;
	if (this.gravaValorInvertido) valorEnviado = 1 - valorEnviado;
	if (this.prefixoValor) valorEnviado = this.prefixoValor + valorEnviado;
	var dadosCampo = { "tab": this.tab, "cmp": this.cmp, "val": valorEnviado, "tipo": this.sqlTipo };
	if (this.pai.chave) dadosCampo.chv = this.pai.chave[this.tab];
	if (this.tabNovo) dadosCampo.tabNovo = this.tabNovo;
	if (this.fk) dadosCampo.fk = this.fk; 
	return dadosCampo;
};
	
clCampo.prototype.originalTratado = function() {
	// este método é utilizado para comparar o valor original com o valor atual (no método foiAlterado)
	// e pode ser sobrescrito pelas sub-classes que tem trataValor (cujo valor atual é tratado)
	return this.valorOriginal();
};

clCampo.prototype.atualiza = function() {
	//nos casos que precisa ser chamado o desfoca em conjunto com o verificaAlteracao
	this.desfoca();
	this.verificaAlteracao();
	return this;
};

clCampo.prototype.colocaValor = function(valor, semAtualizar) {
	this.campo.value = valor;
	if (this.campoVisu) this.campoVisu.innerText = valor;
	if (this.tipConteudo) {
		this.elementoDiv.setAttribute("title", valor);
		this.elementoDiv.setAttribute("tip", valor);
	}
	if (!semAtualizar) this.atualiza();
	return this;
};

clCampo.prototype.transfereValor = function(e, idOutroCampo) {
	// por enquanto o idOutroCampo é único. Depois podemos trazer uma lista de campo.
	// por enquanto a condição para alterar o outro campo é fixa. Depois podemos trazer como parâmetro.
	var outroCampo = this.pai.camposID[idOutroCampo].objCampo;
	if (this.condicaoTransfereValor(outroCampo)) outroCampo.colocaValor(this.valor);
};

clCampo.prototype.condicaoTransfereValor = function(outroCampo) {
	return !outroCampo.valor;
};

clCampo.prototype.mantemValorOriginal = function() {
	var valorInicial = this.valorOriginal();
	$(this.campo).val(valorInicial);
};

// *******************************************************************************************************************************
// sub-classes de tipos de campos
// *******************************************************************************************************************************

// *******************************************************************************************************************************
// campo do tipo "texto"
// *******************************************************************************************************************************
function CampoTexto (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoTexto.prototype = new clCampo;
	CampoTexto.prototype.constructor = CampoTexto;
	CampoTexto.prototype.tipoCampo = 'texto';

	CampoTexto.prototype.criaCampo = function() {
		var esteCampo = this;
		var valorOriginal = this.valorOriginal();
		var input = cria('input', { type: 'text', value: valorOriginal,
			onkeyup: function(e) {
				esteCampo.atualiza.call(esteCampo); 
				esteCampo.trocaTextoMax.call(esteCampo, e);
				if (esteCampo.buscaCadastrados) esteCampo.buscaOutros.call(esteCampo);
			},			
		});
		
		adicionaEvento(input, 'focus', function() { esteCampo.colocaTxtVazio.call(esteCampo,true); });
		adicionaEvento(input, 'blur', function() { esteCampo.colocaTxtVazio.call(esteCampo); });
		
		if (esteCampo.keydown) {
			var funcao = esteCampo.keydown;
			input.onkeydown = function() { return esteCampo.keydown() };	
		}
		
		if (esteCampo.disabled) { input.setAttribute('disabled', 'disabled'); }
		if (this.max) input.maxLength = this.max;
		this.$campoVisu.html(valorOriginal);
		return input;
	};

	CampoTexto.prototype.colocaTxtVazio = function(limpa) { 
		var valorOriginal = this.valorOriginal();
		if (limpa && (!this.valor || this.valor == this.txtVazio)) {			
			$(this.campo).val(valorOriginal).removeClass("txtVazio");
		} else {			
			if ((!valorOriginal && !this.valor) || (this.valor == this.txtVazio )) {
				$(this.campo).val(this.txtVazio).addClass("txtVazio");
			}	
		}
	};
	
	CampoTexto.prototype.pegaValor = function() {
		//log(this.campo.value);
		if (this.campo.value == this.txtVazio) return "";
		// tratamento especial para o caractere "+" que a codificação URL entende como espaço e para o caractere "%" que a codificação URL usa para outros fins 
		else return this.campo.value.replace(/\+/gi, "|mais|").replace(/\%/gi, "|porcento|");
	};

	CampoTexto.prototype.trataCampo = function() { 
		this.valor = trataTextoAjax(this.valor.trim());
	};

	CampoTexto.prototype.originalTratado = function() {
		return trataTextoAjax(this.valorOriginal());
	};

	CampoTexto.prototype.testaFiltro = function(valorTestado) {
		var valor = this.pegaValor();
		return (valorTestado && valor && textoPuro(valorTestado).indexOf(textoPuro(valor)) >= 0);
	};
	
	// ************* buscaOutros ****************************************************
	// ***** método utilizado em campos de nome do cadastros para buscar no banco de dados outros usuários com o mesmo perfil contendo o texto digitado
	// ***** acionado apenas quando for true o parâmetro buscaCadastrados
	CampoTexto.prototype.buscaOutros = function() {
		var esteCampo = this;
		clearTimeout(this.temporizadorBuscaOutros);
		if (this.buscaCadastrados === true) this.buscaCadastrados = {};
		const tempo = (this.buscaCadastrados.tempo) ? this.buscaCadastrados.tempo : 600;
		if (tempo == 0) esteCampo.buscaOutrosTemporizado.call(esteCampo);
		else this.temporizadorBuscaOutros = setTimeout(function() { esteCampo.buscaOutrosTemporizado.call(esteCampo) }, tempo);
	};
	
	CampoTexto.prototype.buscaOutrosTemporizado = function() {
		var esteCampo = this;
		var texto = this.pegaValor().trim();
		var perfil = (this.pai.camposID["perfil"] && this.pai.camposID["perfil"].objetoCampo.campo) 
			? $(this.pai.camposID["perfil"].objetoCampo.campo).val() 
			: ((this.pai.dados > 0 && this.pai.dados.perfil) ? this.pai.dados.perfil : 1);
		var id = this.pai.item.id;
		if (!this.buscaCadastrados.campos) this.buscaCadastrados.campos = [ "nome", "codinome", "registro" ];
		if (texto.length > 0) {
			const info = "perfil=" + perfil + "&id=" + id + "&texto=" + texto + "&campos=" + this.buscaCadastrados.campos.join('|');
			new cnx.carrega("func/buscaOutros_fx.php", function() { esteCampo.mostraOutros.call(esteCampo, this.resposta) }, null, 'POST', info);
		} else {
			var div = $("#mostraOutros");
			div.slideUp(200, function() { div.find("ul").empty() });
		}
	};
	
	CampoTexto.prototype.mostraOutros = function(retorno) {
		// console.log(retorno);
		var retorno = jQuery.parseJSON(retorno);

		var idPerf = (this.pai.camposID["perfil"] && this.pai.camposID["perfil"].objetoCampo.campo) 
			? $(this.pai.camposID["perfil"].objetoCampo.campo).val() 
			: ((this.pai.dados > 0 && this.pai.dados.perfil) ? this.pai.dados.perfil : 1);

		var idPerf =(this.pai.camposID["perfil"]) ? $(this.pai.camposID["perfil"].objetoCampo.campo).val() : (this.pai.dados > 0 ) ? this.pai.dados.perfil : 1;
		if (retorno.id != this.pai.item.id || retorno.texto != this.pegaValor().trim() || retorno.perfil != idPerf) return;
		var lista = retorno.lista;
		this.buscaCadastrados.lista = lista;
		var div = $("#mostraOutros");
		if (lista.length == 0) {
			div.slideUp(200, function() { div.empty() });
			return;
		}
		var $campo = $(this.campo);
		div.empty();
		const esteCampo = this;
		if (div.length == 0) {
			div = $("<div id='mostraOutros'></div>").appendTo(document.body);
			$(document.body).on('click', function() { div.slideUp(200); });
			div.on('click', function() { paraPropag() });
			$campo.on('click', function() { paraPropag() });
			if (this.buscaCadastrados.seleciona) {
				div.on("mouseenter", "li:not(.titulo)", function() { esteCampo.exibeSelecaoOutro.call(esteCampo, this) })
					.on("mouseleave", "li:not(.titulo)", function() { esteCampo.removeSelecaoOutro.call(esteCampo, this) })
					.on("click", "li:not(.titulo)", function() { esteCampo.buscaResponsavelEscolhe.call(esteCampo, this) });
			}
		}
		posicao = $campo.offset();
		div.css({ 'top': posicao.top + $campo.outerHeight(), 'left': posicao.left, 'width': $campo.width() });		
		var perfilNome = (this.pai.camposID["perfil"]) ? $(this.pai.camposID["perfil"].objetoCampo.campo).find("option[value='" + idPerf + "']").text() : "";
		var titulo = this.buscaCadastrados.titulo 
		var titulosResp = titulo ? titulo : fnLang("outroUsuCad");		
		$("<h7>" + titulosResp + "</h7>").appendTo(div);		
		listaDom = $("<ul></ul>"); 


		const titulos = { "nome" : fnLang("nome"), "codinome": fnLang("codinome"), "registro": fnLang("registro"), 
			"DDI": "DDI", "DDD": "DDD", "fone": fnLang("celular"), "email": fnLang("email") };
		const liTitulo = $("<li class='titulo'></li>").appendTo(listaDom);
		this.buscaCadastrados.campos.map(campo => $("<span class='" + campo + "'>" + titulos[campo] + "</span>").appendTo(liTitulo));
		for (var i = 0, t = lista.length; t--; i++) {
			var texto = new RegExp(retorno.texto,"gi");
			const li = $("<li id='buscaOutro_" + lista[i].id + "'></li>").appendTo(listaDom);
			this.buscaCadastrados.campos.map(campo => $("<span class='" + campo + "'>" 
				+ lista[i][campo].replace(texto, "<b>" + retorno.texto + "</b>") + "</span>").appendTo(li));
		}
		listaDom.appendTo(div);
		div.slideDown(600);
	};
	
	CampoTexto.prototype.exibeSelecaoOutro = function(li) {
		this.removeSelecaoOutro.call(this, li);
		$(li).addClass('selecionado');
	};

	CampoTexto.prototype.buscaResponsavelEscolhe = function(e) {
		const lista = this.buscaCadastrados.lista;
		const idSelecionado = origemEvento("li", e).id.split("_")[1];
		const item = lista.filter(cadaResp => cadaResp.id == idSelecionado)[0];
		const cadastro = this.pai;
		Object.keys(cadastro.camposID).map(nomeCampo => {
			const campo = cadastro.camposID[nomeCampo].objetoCampo;
			if (campo.campoBuscaOutros) campo.colocaValor(item[campo.campoBuscaOutros]);
			if (campo.id != "relacao")campo.desabilita();

		});		
		
		fechaBuscaResponsavel();
		const bot =  new Botaovoltar (this.cadastro.objBotoes, {tipo: "voltar", })
		on.bot

		
		
				
	};

	function fechaBuscaResponsavel() {
		var div = $("#mostraOutros");
		var campo = $(".nome input");
		div.slideUp(200, function() { 
			div.remove(); 
			
		});
		
	}
	
	
	
	CampoTexto.prototype.removeSelecaoOutro = function(li) {
		$(li).parent().children().removeClass('selecionado');
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "CampoSenha"
// *******************************************************************************************************************************
function CampoSenha (atrib, pai) { CampoTexto.call(this, atrib, pai); } {
	CampoSenha.prototype = new CampoTexto;
	CampoSenha.prototype.constructor = CampoSenha;
	CampoSenha.prototype.tipoCampo = 'senha';

	CampoSenha.prototype.criaCampo = function() {
		var esteCampo = this;
		var input = cria('input', { type: 'password', value: this.valorOriginal(),
			onkeyup: function(e) {
				esteCampo.desfoca.call(esteCampo);
				if (esteCampo.change) esteCampo.change.call(esteCampo);
			},
		});
		if (esteCampo.keydown) {
			var funcao = esteCampo.keydown;
			input.onkeydown = function() { return esteCampo.keydown() };	
		}

		if (esteCampo.disabled) { input.setAttribute('disabled', 'disabled'); }
		if (this.max) input.maxLength = this.max;
		const quantCarac = this.valorOriginal().length;
		const asterisco = String.fromCharCode(42);
		this.$campoVisu.html(Array(quantCarac + 1).join(asterisco));
		
		if (this.campoFake) {
			$(this.elementoDiv).append("<input type='text' class='esconde campoFake' value=''></input>");
			$(this.elementoDiv).append("<input type='password' class='esconde campoFake' value='' autocomplete='off'></input>");
		}
		return input;
	};

}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "CampoLink"
// *******************************************************************************************************************************
function CampoLink (atrib, pai) { CampoTexto.call(this, atrib, pai); } {
	CampoLink.prototype = new CampoTexto;
	CampoLink.prototype.constructor = CampoLink;
	CampoLink.prototype.tipoCampo = 'link';

	CampoLink.prototype.aposCriarCampo = function() {
		if (!(this.link)) this.link = this.$campoVisu.html();
		if (this.link.length > 0) {
			this.$campoVisu.addClass("campoLink");
			var title = this.$campoVisu.attr("title");
			if (title == "undefined" || typeof(title) == "undefined") title = "";
			if (title && title.length) title += "\n\n";
			title += (this.tipLink) ? this.tipLink : fnLang("abreLink");
			this.$campoVisu.attr("title", title);
			var esteCampo = this;
			this.$campoVisu.on("click", function() { window.open(esteCampo.link, "_blank"); });
		}
	};

}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "CampoCpf" - campo texto com validação e formatação de CPF
// *******************************************************************************************************************************
function CampoCpf (atrib, pai) { CampoTexto.call(this, atrib, pai); } {
	CampoCpf.prototype = new CampoTexto;
	CampoCpf.prototype.constructor = CampoCpf;
	CampoCpf.prototype.tipoCampo = 'cpf';
	
	CampoCpf.prototype.aposCriarCampo = function() {
		this.campo.onkeydown = function() { return numPosneg(); }
	};

	CampoCpf.prototype.validaEspecifico = function() {
		var txtAviso = 'CPF inválido';
		if (!validaCPF(this.valor)) {
			this.colocaAvisoIndividual(txtAviso);
			return { label: this.label, aviso: txtAviso };
		} else {
			this.tiraAvisoIndividual(txtAviso);
			this.campo.value = formataCPF(this.valor);
		}
	};

}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "CampoCnpj" - campo texto com validação e formatação de CNPJ
// *******************************************************************************************************************************
function CampoCnpj (atrib, pai) { CampoTexto.call(this, atrib, pai); } {
	CampoCnpj.prototype = new CampoTexto;
	CampoCnpj.prototype.constructor = CampoCnpj;
	CampoCnpj.prototype.tipoCampo = 'cnpj';
	
	CampoCnpj.prototype.aposCriarCampo = function() {
		var valorTratado = formataCNPJ(this.campo.value);
		this.campo.value = valorTratado;
		this.campo.setAttribute("value", valorTratado);
		this.$campoVisu.text(valorTratado);
	}
	
	CampoCnpj.prototype.validaEspecifico = function() {
		var txtAviso = fnLang("cnpjInvalido");
		if (!validaCNPJ(this.valor)) {
			this.colocaAvisoIndividual(txtAviso);
			return { label: this.label, aviso: txtAviso };
		} else {
			this.tiraAvisoIndividual(txtAviso);
			this.campo.value = formataCNPJ(this.valor);
		}
	};
	
	CampoCnpj.prototype.pegaValor = function() {
		return this.campo.value.replace(/[^\d]+/g,''); // tira tudo que não for dígito
	};

	CampoCnpj.prototype.originalTratado = function() {
		return this.valorOriginal().replace(/[^\d]+/g,''); // tira tudo que não for dígito
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "numerico"
// *******************************************************************************************************************************
function CampoNumerico (atrib, pai) { CampoTexto.call(this, atrib, pai); } {
	CampoNumerico.prototype = new CampoTexto;
	CampoNumerico.prototype.constructor = CampoNumerico;
	
	CampoNumerico.prototype.aposCriarCampo = function() {
		if (this.soPositivo) {
			if (this.soInteiro) {
				this.campo.onkeydown = function() { return sonum(); }
			} else {
				this.campo.onkeydown = function() { return numero(); }
			}
		} else {
			if (this.soInteiro) {
				this.campo.onkeydown = function() { return sonumNeg(); }
			} else {
				this.campo.onkeydown = function() { return numPosneg(); }
			}
		}
	};
	
	CampoNumerico.prototype.trataCampo = function() { 
		// só para eliminar o trataCampo do CampoTexto, que codifica o texto para o Ajax
	};
	
	CampoNumerico.prototype.originalTratado = function() { 
		return this.valorOriginal();
	};

	CampoNumerico.prototype.colocaTextoMax = function() {
		if (!this.max) return;
		if (!this.campoLabel) this.campoLabel = $("<label></label>").prependTo(this.elementoDiv)[0];
		var $label = $(this.campoLabel);
		let textoMax = "máx " + this.max;
		if (this.tipoMax == "digitos") textoMax = this.campo.value.length + " dígitos (" + textoMax + ")";
		$label.append("<span class='max'>" + textoMax + "</span>");
	};
	
	CampoNumerico.prototype.trocaTextoMax = function() {
		if (!this.max) return;
		// em campo numerico o this.tipoMax pode ser "digitos" ou "valor"
		if (this.tipoMax != "digitos" && this.valor > this.max) this.colocaValor(this.max);
		let textoMax = "máx " + this.max;
		if (this.tipoMax == "digitos") textoMax = this.campo.value.length + " dígitos (" + textoMax + ")";
		$(this.campoLabel).children('span').text(textoMax);
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "só inteiro " e positivo
// *******************************************************************************************************************************
function CampoSoInteiro (atrib, pai) { CampoNumerico.call(this, atrib, pai); } {
	CampoSoInteiro.prototype = new CampoNumerico;
	CampoSoInteiro.prototype.constructor = CampoSoInteiro;	

	CampoSoInteiro.prototype.aposCriarCampo = function() {
		this.campo.onkeydown = function() { return sonum(); }
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "CampoCep" - campo CampoNumerico com validação e formatação de CEP e busca de endereço completo
// *******************************************************************************************************************************
function CampoCep (atrib, pai) { CampoNumerico.call(this, atrib, pai); } {
	CampoCep.prototype = new CampoNumerico;
	CampoCep.prototype.constructor = CampoCep;
	CampoCep.prototype.tipoCampo = 'cep';

	CampoCep.prototype.aposCriarCampo = function() {
		colocaClasse(this.elementoDiv, "cep");
		this.campo.onkeydown = function() { return numPosneg(); };
	}

	CampoCep.prototype.validaEspecifico = function() {
		var valor = this.valor;
		// só valida se tiver alterado o valor do campo
		if (this.valorAnterior == undefined) {
			this.valorAnterior = this.campo.value;
			return;
		}
		if (valor == this.valorAnterior) return;
		if (!validaCEP(valor)) {
			var txtAviso = 'CEP inválido';
			this.colocaAvisoIndividual(txtAviso);
			return { label: this.label, aviso: txtAviso };
		} else {
			this.tiraAvisoIndividual(txtAviso);
			this.buscaEndereco();
			this.campo.value = formataCEP(valor);
		}
		this.valorAnterior = this.campo.value;
	}

	CampoCep.prototype.buscaEndereco = function() {
		// para preencher os campos de endereço precisa ter na instância uma referência aos ids dos campos a serem completados
		// camposEnd: { "rua": "rua", "compl": "complemento", "bairro": "bairro", "cid": "idCid", "est": "idest", "pais": "idPais" };
		if (this.camposEnd) {
			var cep = this.valor.replace(/[^\d]+/g,'');  // tira tudo que não for dígito
			var url = "https://viacep.com.br/ws/" + cep + "/json/";
			var esteCampo = this;
			new cnx.carrega(url, function() { esteCampo.preencheEndereco.call(esteCampo, this.resposta) });
			var campoRua = this.pai.camposID[this.camposEnd["rua"]].objetoCampo;
			if (campoRua) {
				if (campoRua.oldLabel == undefined) campoRua.oldLabel = campoRua.campoLabel.innerHTML;
				campoRua.campoLabel.innerHTML = ((campoRua.oldLabel) ? campoRua.oldLabel : campoRua.campoLabel.innerHTML) + 
					"<span class='endCep carregando'>" + fnLang("carregaEndCEP") + "</span>"; 
			}
		}
	}

	CampoCep.prototype.preencheEndereco = function(retorno) {
		retorno = jQuery.parseJSON(retorno);
		var campos = this.pai.camposID;
		var camposRelacao = { "logradouro": "rua", "bairro": "bairro", "pais": "pais", "uf": "est", "localidade": "cid" }; // , "complemento": "compl"
		// o complemento enviado pelo viaCep é complemento do CEP, não do endereço, portanto não deve ser utilizado aqui.
		var campoRua = campos[this.camposEnd[camposRelacao["logradouro"]]].objetoCampo;
		if (retorno.erro) {
			if (campoRua.oldLabel) campoRua.campoLabel.innerHTML = campoRua.oldLabel;
			var erroEnd = $("<span class='endCep erro'>" + fnLang("cepNaoEncontr") + "</span>").appendTo(campoRua.campoLabel);
			setTimeout(function() { erroEnd.animate({ "height": "0", "top": "2em" }, 200, function() { erroEnd.remove() }) }, 3000);
		} else {
			retorno["pais"] = 31; // coloca o país Brasil
			if (campoRua.oldLabel) campoRua.campoLabel.innerHTML = campoRua.oldLabel;
			for (var i in camposRelacao) {
				var idCampo = this.camposEnd[camposRelacao[i]];
				if (campos[idCampo]) {
					var campoEnd = campos[idCampo].objetoCampo;
					if (campoEnd) {
						if (campoEnd.campo.tagName.toLowerCase() == "select" && i != "pais") retorno[i] = $(campoEnd.campo).children().filter(function () { return this.innerHTML == retorno[i]; }).val();
						campoEnd.colocaValor(retorno[i]);
						// se for campo de país, após colocar o valor atualiza a lista de estados para depois poder selecionar o estado
						if (i == "pais") {
							var campoEstado = campos[this.camposEnd[camposRelacao["uf"]]].objetoCampo;
							campoEstado.verificaLista.call(campoEstado, campoEnd);
						}
						// se for campo de estado, após colocar o valor atualiza a lista de cidades para depois poder selecionar a cidade
						if (i == "uf") {
							var campoCidade = campos[this.camposEnd[camposRelacao["localidade"]]].objetoCampo;
							campoCidade.verificaLista.call(campoCidade, campoEnd);
						}
					}
				}
			}
		}
	}
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "dinheiro"
// *******************************************************************************************************************************
function CampoDinheiro (atrib, pai) { CampoNumerico.call(this, atrib, pai); } {
	CampoDinheiro.prototype = new CampoNumerico;
	CampoDinheiro.prototype.constructor = CampoDinheiro;
	
	CampoDinheiro.prototype.aposCriarCampoOriginal = CampoDinheiro.prototype.aposCriarCampo;
	CampoDinheiro.prototype.aposCriarCampo = function() {
		this.aposCriarCampoOriginal();
		var valor = this.pegaValor();
		var conteudo = this.trataCampo(valor);
		this.$campoVisu.html(conteudo);
		this.campo.value = conteudo;
		//if (this.tipoDinheiro) colocaClasse(this.campo, this.tipoDinheiro);
		var esteCampo = this;
		this.campo.onchange = function() { esteCampo.campo.value = esteCampo.trataCampo(esteCampo.pegaValor()); }
	};
	
	CampoDinheiro.prototype.valorOriginalOriginal = CampoDinheiro.prototype.valorOriginal;
	CampoDinheiro.prototype.valorOriginal = function() {
		var valor = this.valorOriginalOriginal();
		valor = this.formata(valor);
		return valor;
	};
	
	CampoDinheiro.prototype.pegaValor = function() {
		// o .valor do campoDinheiro é sempre positivo
		return this.campo.value.replace(/[^0-9.,]/g, '');
	};
	
	CampoDinheiro.prototype.trataCampo = function() {
		var formatado = this.formata(this.valor);
		this.valor = formatado;
		return this.valor;
	};
	
	CampoDinheiro.prototype.formata = function(valor) {
		var formatado = "";
		//if (this.tipoDinheiro) formatado = this.tipoDinheiro;
		if (isNaN(valor)) return valor;	
		valor = valor.toString().replace(/[^0-9.,]/g, '');
		formatado += formataNumero(valor, 2);
		return formatado;
	};
	
	CampoDinheiro.prototype.originalTratado = function(valor) {
		var valorOriginalTratado = this.valorOriginal(true);
		return valorOriginalTratado;
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "dia"
// *******************************************************************************************************************************
function CampoDia (atrib, pai) { CampoNumerico.call(this, atrib, pai); } {
	CampoDia.prototype = new CampoNumerico;
	CampoDia.prototype.constructor = CampoDia;

	CampoDia.prototype.aposCriarCampo = function() {
		this.campo.onkeydown = function() { return sonumNeg(); }
	};
	
	CampoDia.prototype.validaEspecifico = function() {
		var valor = this.valor;		
		var txtAviso = fnLang("diaInvalido");
		if (valor > 31) {
			this.colocaAvisoIndividual(txtAviso);
		} else {
			this.tiraAvisoIndividual(txtAviso);
		}		
		return (temClasse(this.campo.parentNode, 'invalida')) ? { label: this.label,  aviso: txtAviso } : false;
		return false;
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "data"
// *******************************************************************************************************************************
function CampoData (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoData.prototype = new clCampo;
	CampoData.prototype.constructor = CampoData;
	CampoData.prototype.tipoCampo = 'data';

	CampoData.prototype.criaCampo = function() {
		var esteCampo = this;
		var input = $("<input type='text' class='dataJquery' maxLength='10' value='" + this.valorOriginal() + "' />")
			.on('keyup, change', function() { esteCampo.atualiza.call(esteCampo) })
			.on('keydown', function(e) { return ((e.keyCode == 111 || e.keyCode == 193) ? true : sonum()) });
		this.$campoVisu.html(this.valorOriginal());
		return input[0];
	};

	CampoData.prototype.aposCriarCampo = function() {
		// coloca o calendário do jQuery UI
		$(this.campo).datepicker(this.paramData);
		if (this.mostraDiff) {
			this.spanDiff = $("<span class='dataDiff'></span>").appendTo(this.elementoDiv);
			var esteCampo = this;
			$(this.campo).on("change", function() { esteCampo.colocaDiff.call(esteCampo); });
			this.colocaDiff();
		}
	};

	CampoData.prototype.colocaDiff = function() {
		var data = valida_data(this.valor);
		if (data == -1 || data.length < 3) {
			var diff = "";
		} else {
			var ref = this.mostraDiff;
			ref = { "dia": ref.getDate(), "mes": ref.getMonth() + 1, "ano": ref.getFullYear() };
			data = { "dia": data[0], "mes": data[1], "ano": data[2] };
			var difMeses = (ref.ano * 12 + ref.mes) - (data.ano * 12 + data.mes);
			// se o dia da data de ref é anterior ao dia da data do campo, desconta um mês (pois ainda não completou o último mês)
			if (ref.dia < data.dia) difMeses--;
			var difAnos = Math.floor(difMeses / 12);
			difMeses = difMeses - (difAnos * 12);
			var anos = (difAnos > 0) ? difAnos + " " + ((difAnos > 1) ? fnLang("anos") : fnLang("ano")) : "";
			var meses = (difMeses > 0) ? difMeses + " " + ((difMeses > 1) ? fnLang("meses") : fnLang("mes")) : "";
			if (anos.length > 0 && meses.length > 0) anos += " e ";
			var diff = anos + meses;
		}
		this.spanDiff.text(diff);
	};

	CampoData.prototype.ajustaParaFiltro = function() {
		var esteCampo = this;
		$(this.campo)
			.datepicker("option", "beforeShow", function(input, inst) {
				esteCampo.abreDialog.call(esteCampo);
				esteCampo.ajustaPosPicker.call(esteCampo, input, inst);
			})
			.datepicker("option", "onClose", function() { esteCampo.fechaDialog.call(esteCampo) });
	};

	CampoData.prototype.fechaFiltro = function() {
		$(this.campo).datepicker("hide");
	};

	CampoData.prototype.abreDialog = function() {
		var divDialog = $(this.campo).datepicker("widget");
		$(this.pai.divFiltro).css("z-index", 10000).append(divDialog);
		var objFiltro = this.pai;
		while (!objFiltro.listaFiltros && objFiltro.pai) objFiltro = objFiltro.pai;
		if (objFiltro && objFiltro.listaFiltros) objFiltro.dialogAberto = true;
	};

	CampoData.prototype.fechaDialog = function() {
		var objFiltro = this.pai;
		while (!objFiltro.listaFiltros && objFiltro.pai) objFiltro = objFiltro.pai;
		setTimeout(function() { if (objFiltro && objFiltro.listaFiltros) objFiltro.dialogAberto = false; }, 300);
	};

	CampoData.prototype.ajustaPosPicker = function(input, inst) {
        var calendar = inst.dpDiv;
        setTimeout(function() {
            calendar.position({
                my: 'left top',
                at: 'left bottom',
                collision: 'none',
                of: input
            });
        }, 1)
	};

	CampoData.prototype.validaEspecifico = function() {
		var data = valida_data(this.campo.value);
		var txtAviso = fnLang("dataInvalida");
		if (data == -1) {
			this.colocaAvisoIndividual(txtAviso);
		} else {
			this.tiraAvisoIndividual(txtAviso);
			if (data.length) this.campo.value = data.join("/")
		}
		return (temClasse(this.campo.parentNode, 'invalida')) ? { label: this.label,  aviso: txtAviso } : false;
	};

	CampoData.prototype.soMudaValor = function(valor) {
		this.campo.value = valor;
		this.valor = this.pegaValor();
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo data com selects para escolher mês e ano
// **************************************************************
// **************************************************************
//
// Dívida técnica:
//	Os selects deste CampoMesAno não respeitam a troca entre edição e visualização
//
// **************************************************************
// **************************************************************
// *******************************************************************************************************************************
function CampoMesAno (atrib, pai) { CampoData.call(this, atrib, pai); } {
	CampoMesAno.prototype = new CampoData;
	CampoMesAno.prototype.constructor = CampoMesAno;

	CampoMesAno.prototype.aposCriarCampoOriginal = CampoMesAno.prototype.aposCriarCampo;

	CampoMesAno.prototype.aposCriarCampo = function() {
		this.aposCriarCampoOriginal();
		var esteCampo = this;
		if (!this.tipoPeriodo) this.tipoPeriodo = 'ini';
		this.campo.onkeyup = this.campo.onchange = function() { esteCampo.atualiza.call(esteCampo); esteCampo.ajustaSelects.call(esteCampo); };
		// select de meses
		var selMes = cria('select', { className: 'mes' });
		// selMes.options[0] = new Option(fnLang("mes") + '...', '');
		selMes.options[0] = new Option("mes" + '...', '');
		for (var i = 0 , t= meses.length; t--; i++) {
			var mesUsado = (this.nomeMes) ? meses[i] : meses[i].substring(0, 3);
			selMes.options[i+1] = new Option(mesUsado, i+1);
		}
		selMes.onchange = function() { esteCampo.ajustaInput.call(esteCampo); };
		this.elementoDiv.appendChild(selMes);
		// select de anos
		var data = new Date();
		var anoAtual = (this.anoLimite) ? this.anoLimite : data.getFullYear() + 10;
		var anoInicial = 2006;
		var selAno = cria('select', { className: 'ano' });
		// selAno.options[0] = new Option(fnLang("ano") + '...', '');
		selAno.options[0] = new Option("ano" + '...', '');
		for (var i = 0 , t = anoAtual - anoInicial; t--; i++) {
			selAno.options[i + 1] = new Option(anoInicial + i, anoInicial + i);
		}
		selAno.onchange = function() { esteCampo.ajustaInput.call(esteCampo);};
		this.elementoDiv.appendChild(selAno);
		//se a permissao da aba for para consulta entao desabilita os campos
		if (this.cadastro && this.cadastro.aba.perm < 2){
			$(selMes).attr('disabled', 'disabled').addClass('desabilitado');
			$(selAno).attr('disabled', 'disabled').addClass('desabilitado');
		}
		if (this.comTodos == "podeExcluir") this.podeExcluir = true; // ajuste para parâmetros de relatórios (que vem do BD)
		this.ajustaSelects();
	};

	CampoMesAno.prototype.ajustaSelects = function() {
		// seleciona selects de mês e ano de acordo com o preenchido em um input
		var data = valida_data(this.pegaValor());
		var div = $(this.elementoDiv);
		var selMes = div.find('select.mes');
		var selAno = div.find('select.ano');
		if (data == -1 || data.length == 0) {
			selMes.val('');
			selAno.val('');
		} else {
			selMes.val(data[1]);
			selAno.val(data[2]);
		}
	};

	CampoMesAno.prototype.ajustaInput = function() {
		// acerta o valor de um input de data a partir do mês e ano selecionados em selects
		var data = valida_data(this.pegaValor());
		var div = $(this.elementoDiv);
		var mes = div.find('select.mes').val();
		var ano = div.find('select.ano').val();
		
		if (this.podeExcluir && (mes == "" || ano == "")) { // se puder excluir e um deles estiver vazio, deixa a data em branco
			this.campo.value = "";
			this.atualiza();
		} else if (mes != '' || ano != '') {
			if (data == -1 || data.length == 0) data = [0,0,0];
			if (ano != '') data[2] = ano.toString();
			else if (data[2] == 0) data[2] = (new Date()).getFullYear().toString();
			if (!this.anoCompleto) data[2] = data[2].toString().substring(2, 4);
			
			if (mes != '') data[1] = (mes.toString().length > 1) ? mes : '0' + mes.toString();
			else if (data[1] == 0) data[1] = (this.tipoPeriodo == 'ini') ? '01' : '12';
			
		//	if (data[0] == 0) data[0] = (this.tipoPeriodo == 'ini') ? '01' : this.ultimoDia(data);
		//	else if (valida_data(data.join('/')) == -1) data[0] = this.ultimoDia(data);
		//	else if (data[0].toString().length < 2) data[0] = '0' + data[0].toString();
			
			data[0] = (this.tipoPeriodo == 'ini') ? '01' : this.ultimoDia(data);
			if (valida_data(data.join('/')) == -1) data[0] = this.ultimoDia(data);
			else if (data[0].toString().length < 2) data[0] = '0' + data[0].toString();
		
			this.campo.value = data.join('/');	
			this.ajustaSelects();
			this.atualiza();  
			$(this.campo).change();
		}
	};

	CampoMesAno.prototype.ultimoDia = function(data) {
		var mes = parseInt(data[1], 10) - 1;
		var ultimoDia = dias[mes];
		// se for fevereiro e ano bissexto, muda o total de dias do mês
		if (mes == 1 && (data[2] % 400 == 0 || (data[2] % 4 == 0 && data[2] % 100 != 0))) ultimoDia = 29;
		return ultimoDia;
	};
	
	CampoMesAno.prototype.desabilita = function() {
		$(this.elementoDiv).addClass('desabilitado').find(":input").attr('disabled', 'disabled').addClass('desabilitado');
	};

	CampoMesAno.prototype.habilita = function() {
		$(this.elementoDiv).removeClass('desabilitado').find(":input").removeAttr('disabled').removeClass('desabilitado');
	};

	CampoMesAno.prototype.testaFiltro = function(valorTestado) {
		var valor = this.pegaValor();
		if (this.tipoPeriodo == "ini") {
			return (valorTestado && valor && dataCalc(valorTestado) >= dataCalc(valor));
		} else {
			return (valorTestado && valor && dataCalc(valorTestado) <= dataCalc(valor));
		}
	};

	CampoMesAno.prototype.colocaValor = function(valor) {
		var div = $(this.elementoDiv);
		this.campo.value = valor;
		$(this.campoVisu).text(valor);
		var selMes = div.find("select.mes");
		var selAno = div.find("select.ano");
		var data = valida_data(valor);
		if (!data || data.length == 0 || data == -1) data = ["", "", ""];
		selMes.val(data[1]);
		selAno.val(data[2]);
		this.desfoca();
	};

	CampoMesAno.prototype.colocaValorOriginal = function() {
		var valor = this.valorOriginal();
		this.colocaValor(valor);
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo com selects para escolher mês e ano (sem input de data, mas envia escondido a data)
// *******************************************************************************************************************************
function CampoMesAnoSemData (atrib, pai) { CampoMesAno.call(this, atrib, pai); } {
	CampoMesAnoSemData.prototype = new CampoMesAno;
	CampoMesAnoSemData.prototype.constructor = CampoMesAnoSemData;

	CampoMesAnoSemData.prototype.aposAposCriarCampo = function() {
		this.campo.className = '';
		this.campo.type = 'hidden';
		if (this.conteudoVisu) this.$campoVisu.html(this.conteudoVisu());	
	};
	
	CampoMesAnoSemData.prototype.conteudoVisu = function() {		
		if (!this.valor || this.valor.length == 0) return "";
		var data = this.valor.split("/");
		var mes = data[1], ano = data[2];
		return meses[parseInt(mes, 10) - 1] + "/" + ano;
	}
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "hora"
// *******************************************************************************************************************************
function CampoHora (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoHora.prototype = new clCampo;
	CampoHora.prototype.constructor = CampoHora;
	CampoHora.prototype.tipoCampo = 'hora';

	CampoHora.prototype.criaCampo = function() {
		var esteCampo = this;
		var input = cria('input', {  type: 'text',
											className: 'timepicker',
											value: this.valorOriginal(), 
											onkeydown: function() { return sonum() },
											onkeyup: function() { esteCampo.atualiza.call(esteCampo); },
											onchange: function() { esteCampo.campo.value = ajustaHoraMinuto(esteCampo.campo.value); esteCampo.atualiza.call(esteCampo); },
											maxLength: 5
										});
		this.$campoVisu.html(this.valorOriginal());	
		return input;
	};

	CampoHora.prototype.aposCriarCampo = function() {
		$(this.campo).timepicker({
			hourText: fnLang("horas"),
			minuteText: fnLang("minutos"),
			timeSeparator: ':',
			nowButtonText: fnLang("agora"),
			showNowButton: true,
			closeButtonText: fnLang("fechar"),
			showCloseButton: true,
			deselectButtonText: fnLang("limpar"),
			showDeselectButton: true,
			defaultTime: '',
			showLeadingZero: true,
			showPeriodLabels: false
		});
	};

	CampoHora.prototype.pegaValor = function() {
		var valor = this.campo.value;
		return valor;
	};

	CampoHora.prototype.mascara = function() {		
		if (this.campo.value.length == 2) {
			this.campo.value += ':00';
			$(this.campo).change();
		} 
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "linha" - textarea - multilinha
// *******************************************************************************************************************************
function CampoLinha (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoLinha.prototype = new clCampo;
	CampoLinha.prototype.constructor = CampoLinha;
	CampoLinha.prototype.classeEspecial = 'textarea';
	CampoLinha.prototype.tipoCampo = 'texto';

	CampoLinha.prototype.criaCampo = function() {
		var esteCampo = this;
		var textarea = cria('textarea', {
			innerHTML: this.valorOriginal().replace(/\<br\s?\\?\/?\>/gi, '\n'),
			onkeyup: function(e) {
				esteCampo.atualiza.call(esteCampo);
				esteCampo.trocaTextoMax.call(esteCampo, e); 
			}
		});
		this.$campoVisu.html(this.valorOriginal());
		return textarea;
	};

	CampoLinha.prototype.pegaValor = function() {
		//return this.campo.innerHTML;
		return this.campo.value;
	};

	CampoLinha.prototype.colocaValorOriginal = function() {
		this.campo.value = this.valorOriginal().replace(/\<br\s?\\?\/?\>/gi, '\n');
		this.desfoca();
	};

	CampoLinha.prototype.trataCampo = function() {
		this.valor = trataTextoAjax(this.valor.trim());
	};

	CampoLinha.prototype.originalTratado = function() {
		return trataTextoAjax(this.valorOriginal());
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "select"
// *******************************************************************************************************************************
function CampoSelect (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoSelect.prototype = new clCampo;
	CampoSelect.prototype.constructor = CampoSelect;
	CampoSelect.prototype.tipoCampo = 'select';
	
	CampoSelect.prototype.criaCampo = function() {
		var select = cria('select');
		this.select = select;
		var esteCampo = this;
		select.onchange = function() {
			esteCampo.atualiza.call(esteCampo); 
			if (esteCampo.change) esteCampo.mudouOption.call(esteCampo);
		};
		var valorSelecionado = this.valorOriginal();
		var somaIndice = 0;
		var naoTemBranco = false;
		// se o this.lista for uma função, executa para usar o retorno como lista, senão apenas traz o this.lista	
		var lista = (typeof(this.lista) == 'function') ? this.lista() : this.lista;
		// se não tem lista mas tem acao (numérica), inicia o processo de carregar a lista completa do banco de dados
		if (!lista && ((this.acao && (!isNaN(parseInt(this.acao, 10)) || typeof(this.acao) == "function")) || (this.buscaLista && !this.basearEm))) {
			// se a lista já foi carregada e for para manter a mesma, usa a já carregada, senão vai buscar
			if (this.listaCarregada && window[this.listaCarregada]) {
				lista = this.lista = jQuery.extend(true, [], window[this.listaCarregada]);
				if (this.trataLista) this.trataLista.call(this);
			} else {
				this.carregando = true;
				lista = [{ id: "", nome: fnLang("carregando") + "..." }];
				colocaClasse(select, 'carregando');
				this.$campoVisu.addClass("carregando");
				naoTemBranco = true;
				var url = this.buscaLista || this.pai.urlBase || this.pai.pai.urlBase || this.pai.pai.pai.urlBase;
				url += (url.indexOf('?') >= 0) ? '&' : '?';
				url += (typeof(this.acao) == "function") ? "acao=" + this.acao() : ((!isNaN(parseInt(this.acao, 10))) ? "acao=" + this.acao : "");
				new cnx.carrega(url + '&idEsc=' +_quem[0], function() {
					esteCampo.carregou.call(esteCampo, jQuery.parseJSON(this.resposta));
				});
			}
		}
		
		// se não tem o valorSelecionado na lista, mas tem o parâmetro "foraDaLista", inclui na lista
		// ainda não está genérico, só funciona para listas com {id: xxx, nome: xxx} na ordem certa
		if (lista && this.foraDaLista && this.pai.dados[this.foraDaLista] 
				&& !lista.filter(item => item.id == valorSelecionado)[0]) {
			lista = jQuery.extend(true, [], lista);
			const novoItem = { id: valorSelecionado, nome: this.pai.dados[this.foraDaLista] };
			let incluido = false;
			for (let pos = 0; pos < lista.length; pos++) {
				if (novoItem.nome.toLowerCase() < lista[pos].nome.toLowerCase()) { 
					lista.splice(pos, 0, novoItem);
					incluido = true;
					break;
				}
			}
			if (!incluido) lista.push(novoItem);
		}

		var tamanhoLista = (lista) ? ((lista.ord) ? lista.ord.length : lista.length) : 0;
		
		var temBranco;
		// só coloca uma opção em branco se não for obrigatório ou se tiver mais de uma opção sem valor pré-selecionado
		if (this.forcaColocaBranco || (!this.naoColocaBranco && !this.comTodos && !naoTemBranco 
				&& ((!this.obrigatorio) || (tamanhoLista > 1 && !this.valorInicial && (!valorSelecionado || valorSelecionado == 'novo'))))) {
			var txtVazio = (this.txtVazio) ? this.txtVazio : "";
			select.options[0] = new Option(txtVazio, "");
			somaIndice = 1;
			temBranco = true;
			// não pode deixar desabilitado pois ao abrir novamente ele irá automaticamente selecionar o primeiro item da lista, já que o "vazio" está desabilitado
			//if (txtVazio > "") select.options[0].setAttribute("disabled", "disabled");
		}
		
		// esse comTodos vem da tabela relatorios_param, para trazer o texto do option default "todos" pré-selecionado no select.
		// para diferenciar uma option de "todos" de uma option vazia (sem seleção).
		// utilizada, por exemplo, no select de perfis dos contatos de novas ocorrências do atendimento
		if (this.comTodos) {
			select.options[0] = new Option(this.comTodos, '|todos|');
			somaIndice = 1;
			if (!this.valorInicial) this.valorInicial = '|todos|';
		}
		var acha = (lista && lista.ord) ? {
			id: function(i) { return lista.ord[i]; },
			nome: function(i) { return (lista[lista.ord[i]].nome) ? lista[lista.ord[i]].nome : lista[lista.ord[i]]; },
			mudaLabel: function(i) { return (lista[lista.ord[i]].mudaLabel) ? lista[lista.ord[i]].mudaLabel : lista[lista.ord[i]]; },
			desabilitado: function(i) { return (lista[lista.ord[i]].desabilitado) ? lista[lista.ord[i]].desabilitado : 0; },
			oculto: function(i) { return (lista[lista.ord[i]].oculto) ? lista[lista.ord[i]].oculto : 0; }
		} : {
			id: function(i) { return (lista[i].id == undefined) ? i : lista[i].id; },
			nome: function(i) { return (lista[i].nome  == undefined) ? lista[i] : lista[i].nome; },
			mudaLabel: function(i) { return lista[i].mudaLabel; },
			desabilitado: function(i) { return lista[i].desabilitado; },
			oculto: function(i) { return lista[i].oculto; }
		};
		// se só tiver uma opção deixa-a como valor inicial para já gravar o valor (se não tiver valor previamente selecionado)
		if (tamanhoLista == 1 && !temBranco && !this.temTodos && !this.comTodos && !valorSelecionado) this.valorInicial = acha.id(0);
		if (lista == null || lista == undefined) {
			if (this.pai.dados && this.valorVisu && this.pai.dados[this.valorVisu]) this.$campoVisu.html(this.pai.dados[this.valorVisu]);
		} else {
			if (tamanhoLista == 0 && this.desabilitaVazio) {
				// se a lista estiver vazia e o parâmetro desabilitaVazio existir, desabilita o select
				// o mesmo parâmetro desabilitaVazio pode ser usado para incluir um texto quando o select estiver vazio e desabilitado
				if (this.desabilitaVazio.length > 0) select.options[0] = new Option(this.desabilitaVazio, '');
				select.options[0].setAttribute("selected", "selected");
				colocaClasse(select, 'desabilitado');
				select.setAttribute('disabled', true);
				this.$campoVisu.html(this.desabilitaVazio);
				this.$campoVisu.attr('valor', '');
			} else {
				var options = [];
				for (var i = 0, t = tamanhoLista; t--; i++) {
					var dados = { id: acha.id(i), nome: acha.nome(i), desabilitado: acha.desabilitado(i), oculto: acha.oculto(i) };
					var selected = "";
					if (dados.id != undefined && dados.id.toString().length > 0 && valorSelecionado != undefined && dados.id.toString() == valorSelecionado.toString()) {
						selected = " selected='selected'";
						this.$campoVisu.html(dados.nome);
						this.$campoVisu.attr('valor', valorSelecionado);
						this.nomeSelecionado = dados.nome;
					}
					var disabled = (dados.desabilitado && dados.id != valorSelecionado) ? " disabled='disabled'" : "";
					var oculto = (dados.oculto && dados.id != valorSelecionado) ? " style='display:none'" : "";
					options.push("<option value='" + dados.id + "'" + selected + disabled + oculto + ">" + dados.nome + "</option>");
				}
				if (options.length > 0) select.innerHTML += options.join("");
			}
		}
		this.verificaCriaNovo(select);
		return select;
	};

	CampoSelect.prototype.reBuscaLista = function(valorRef) {
		var esteCampo = this;
		this.carregando = true;
		lista = [{ id: "", nome: fnLang("carregando") + "..." }];
		colocaClasse(this.campo, 'carregando');
		this.$campoVisu.addClass("carregando");
		naoTemBranco = true;
		var url = this.buscaLista || this.pai.urlBase || this.pai.pai.urlBase || this.pai.pai.pai.urlBase;
		url += (url.indexOf('?') >= 0) ? '&' : '?';
		url += (typeof(this.acao) == "function") ? "acao=" + this.acao() : ((!isNaN(parseInt(this.acao, 10))) ? "acao=" + this.acao : "");
		if (valorRef) url += "&valorRef=" + valorRef;
		new cnx.carrega(url + '&idEsc=' +_quem[0], function() {
			esteCampo.carregou.call(esteCampo, jQuery.parseJSON(this.resposta));
		});
	};

	CampoSelect.prototype.limitaTamanho = function() {
		// se a lista para colocar no select, o javascript demora muito
		if (tamanhoLista > 10000) {
			tamanhoLista = 5000; 
		}
	};

	CampoSelect.prototype.pegaTexto = function() {	
		if (!this.lista) return;
		var tipoLista = (this.lista.ord) ? 1 : 0;
		if (tipoLista == 0 ){
			for (var i = 0; i < this.lista.length; i++){
				if (this.lista[i].id == this.valor) var nome = this.lista[i].nome;
			}
		}else {
			if (!this.lista[this.valor]) return;
			var nome = (this.lista[this.valor].nome) ? this.lista[this.valor].nome : this.lista[this.valor];
		}
		return nome;
	};

	CampoSelect.prototype.pegaValor = function() {
		if (this.campo.tagName.toLowerCase() == 'input') {
			var valor = this.campo.value.trim();
			valor = valor.replace(/\+/gi, "|mais|").replace(/\%/gi, "|porcento|");
		//	valor = trataTextoAjax(valor);
			valor = '|novo|' + valor;
		} else var valor = $(this.campo).val();
		return valor;
	};

	CampoSelect.prototype.testaFiltro = function(valorTestado) {
		return (this.valor == '|todos|' || valorTestado == this.valor);
	};

	CampoSelect.prototype.mudouOption = function() {
		// chama a função thisChange do pai (cadastro) passando este campo como parâmetro da função e o próprio cadastro como this
		if (this.change && this.pai[this.change]) this.pai[this.change].call(this.pai, this);
	};

	CampoSelect.prototype.mudaLabel = function() {
		// método para trocar o valor de algum label de um dos campos do Cadastro
		// pode ser utilizar este método para trocar mais de um label por vez
		// o valor que é recuperado nesta função vem da propriedade lista (onde se monta os options do select)
		var campos = this.pai.campos;
		for (var idLabel in this.labels) {
			for (var cadaCampo = 0, totCampos = campos.length; totCampos--; cadaCampo++) {
				if (campos[cadaCampo].id == idLabel) {
					var objetoCampo = campos[cadaCampo].objetoCampo;
					objetoCampo.label = this.labels[idLabel];
					objetoCampo.colocaLabel.call(objetoCampo);
					objetoCampo.elementoDiv.title = (objetoCampo.tip) ? objetoCampo.tip : objetoCampo.label.replace(/:$/, '');
					break;
				}
			}
		}
	};

	CampoSelect.prototype.verificaCriaNovo = function(elementoDom) {
		//	o parâmetro criaNovo do CampoSelect indica se tem a opção de incluir um novo item automaticamente ao gravar
		// 	se tiver só um caracter, indica se é feminino ("incluir nova") ou masculino ("incluir novo").
		// 	se tiver mais de um caracter, é o próprio texto inteiro da option
		if (this.criaNovo && this.criaNovo.length > 0 && !this.campoOld) {
			var select = (elementoDom) ? elementoDom : this.campo;
			var esteCampo = this;
			var valorIncluirNovo = '|incluir#novo|';
			var texto = (this.criaNovo.length > 1) ? this.criaNovo : 'incluir nov' + this.criaNovo + ' ' + this.label.replace(/^\*/gi, '').replace(/\:$/gi, '');
			select.options[select.options.length] = new Option(texto + '...', valorIncluirNovo);
			if (!this.colocouEventoNovo) adicionaEvento(select, 'change', function() { if ($(this).val() == valorIncluirNovo) esteCampo.incluirNovo.call(esteCampo) });
			this.colocouEventoNovo = true;
		}
	};

	CampoSelect.prototype.incluirNovo = function() {
		var esteCampo = this;
		this.campoOld = this.campo;
		var $select = $(this.campoOld).hide();
		var titleBot = (this.novoVoltaTitle) ? this.novoVoltaTitle : fnLang("voltaValorCad");
		var imgVolta = "<img src='img/ico16_acima_redondo.gif' title='" + titleBot + "' class='retornaSelect' />";
		this.imgVolta = $(imgVolta).insertAfter($select).on("click", function() { esteCampo.retornaSelect.call(esteCampo); $select.focus(); })
		$campoNovo = $("<input type='text' class='novoValorSelect' />").insertAfter($select).focus();
		if (this.oldValorNovo) $campoNovo.val(this.oldValorNovo);
		$campoNovo.keyup(function(e) { 
			esteCampo.atualiza.call(esteCampo);  
			if (e.keyCode == 38) $(esteCampo.imgVolta).click();
			if (esteCampo.alteraNovo) esteCampo.alteraNovo.call(esteCampo);
		});
		this.campo = $campoNovo[0];
		this.desfoca();
		if (esteCampo.alteraNovo) esteCampo.alteraNovo.call(esteCampo);
		if (this.aposIncluirNovo) this.aposIncluirNovo();
		if (this.pai.aposIncluirNovo) this.pai.aposIncluirNovo();
	};

	CampoSelect.prototype.retornaSelect = function() {
		this.imgVolta.remove();
		this.oldValorNovo = this.campo.value;
		$(this.campo).remove();
		this.campo = this.campoOld;
		var valor = this.valorOriginal();
		$(this.campo).show().val(valor);
		this.valor = valor;
		this.campoOld = null;
		$(this.campo).trigger("change");
		if (this.aposRetornaSelect) this.aposRetornaSelect();
	};

	CampoSelect.prototype.verificaLista = function(campoPai) {
		// o this desta função é o select filho.
		var listaPai = (typeof(campoPai.lista) == 'function') ? campoPai.lista() : campoPai.lista;
		if (!listaPai) {
			this.lista = null;
			this.preencheOptions(campoPai);
			return;
		}		
		var elementoDomPai = (campoPai.objetoCampo && campoPai.objetoCampo.campo) ? campoPai.objetoCampo.campo : campoPai.campo;
		var valorSelecionado = $(elementoDomPai).val();
		//log(valorSelecionado);
		var campoFilho = this;
		limpaConteudo(campoFilho.campo);
		if (campoPai.comTodos && valorSelecionado == '|todos|') {
			// junta todas as listas das options dos pais para colocar como lista do filho
			var lista = [];	
			for (var cadaLista in listaPai) {
				var listaFilho = listaPai[cadaLista].listaFilho;
				if (listaFilho) {
					if (listaFilho.ord) {
						// array associativo com ord
						if (!lista.ord) lista["ord"] = [];
						for (var cadaFilho in listaFilho) if (cadaFilho != "ord") lista[cadaFilho] = listaFilho[cadaFilho];
						for (var cadaOrd in listaFilho.ord) lista.ord.push(listaFilho.ord[cadaOrd]);
					} else {
						// array linear
						lista = lista.concat(listaPai[cadaLista].listaFilho);
					}
				}
			}
			if (lista.ord) {
				this.lista = lista;
				this.lista.ord = lista.ord.sort(function(a, b) {
					var textA = (lista[a].nome || lista[a]).toLowerCase();
					var textB = (lista[b].nome || lista[b]).toLowerCase();
					return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
				});
			} else {
				this.lista = lista.sort(function(a, b) {
					var textA = (a.nome) ? a.nome.toLowerCase() : '';
					var textB = (b.nome) ? b.nome.toLowerCase() : '';
					return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
				});
			}
			this.preencheOptions(campoPai);
		} else {
			var itemSelecionado;
			if (listaPai.ord) { // se a lista do pai for array associativo
				itemSelecionado = listaPai[valorSelecionado];
			} else { // se a lista do pai for linear
				for (var i = 0, t = listaPai.length; t--; i++) {
					if (listaPai[i].id == valorSelecionado) { itemSelecionado = listaPai[i]; break; }
				}
			}
			// se não selecionou nada no pai, ou se selecionou e já tem a listaFilho, chama a preencheOptions
			if (!itemSelecionado || itemSelecionado.listaFilho) {
				if (itemSelecionado) this.lista = itemSelecionado.listaFilho;
				this.preencheOptions(campoPai);
			} else if (this.buscaLista && this.pai.editando && !campoFilho.carregando) {
				this.campo.options[0] = new Option( 'carregando...', 0 );
				this.campo.setAttribute('disabled', true);
				campoFilho.carregando = true;
				colocaClasse(campoFilho.campo, 'carregando');
				new cnx.carrega(this.buscaLista + "&id=" + valorSelecionado, function() {
					campoFilho.carregando = false;
					var retorno = jQuery.parseJSON(this.resposta);
					if (retorno.idPai != valorSelecionado) return;
					campoFilho.lista = retorno.lista;
					campoFilho.preencheOptions.call(campoFilho, campoPai);
					tiraClasse(campoFilho.campo, 'carregando');
					campoFilho.preencheListaFilhos.call(campoFilho);
					if (campoFilho.cadastro.aba && campoFilho.cadastro.aba.perm < 2 ) campoFilho.desabilita();
					// grava a lista no listaFilho do pai para não buscar novamente
					if (itemSelecionado) itemSelecionado.listaFilho = retorno.lista;
				});
			}
			if (campoFilho.cadastro && campoFilho.cadastro.aba && campoFilho.cadastro.aba.perm < 2 ) {
				campoFilho.desabilita();
			}	
		}
	};

	CampoSelect.prototype.preencheOptions = function(campoPai) {
		var elementoDomPai = (campoPai.objetoCampo && campoPai.objetoCampo.campo) ? campoPai.objetoCampo.campo : campoPai.campo;
		var valorSelecionado = $(elementoDomPai).val();
		//se estiver inserindo um novo volta para a lista de opções antes de continuar		
		if (this.campoOld) this.retornaSelect();
		var campo = this.campo;
		limpaConteudo(campo);
		if (!valorSelecionado || valorSelecionado.length == 0 || this.lista == null) {
			if (campoPai.label) this.campo.options[0] = new Option('selecione ' + campoPai.label.replace(/^\*/gi, '') + '...', "");
			this.campo.setAttribute('disabled', true);
		} else {
			this.campo.removeAttribute('disabled');
			// se tiver que agrupar e ainda não tiver a lista agrupada, cria a partir do ord
			if (this.lista.ord && this.agrupado) {
				if (this.lista[this.agrupado]) var lista = this.lista[this.agrupado][valorSelecionado];
				if (!lista) {
					if (!this.lista[this.agrupado]) this.lista[this.agrupado] = {};
					var lista = this.lista[this.agrupado][valorSelecionado] = [];
					for (var i = 0, t = this.lista.ord.length; t--; i++) {
						if (this.lista[this.lista.ord[i]][this.agrupado] == valorSelecionado) lista.push({ id: this.lista.ord[i], nome: (this.lista[this.lista.ord[i]].nome || this.lista[this.lista.ord[i]]) });
					}
				}	
			} else if (this.lista.ord) {
				// se a lista não é linear (é um objeto com os IDs como chaves, mas tem "ord", monta uma lista linear
				var lista = [];
				for (var i = 0, t = this.lista.ord.length; t--; i++) lista.push({ id: this.lista.ord[i], nome: (this.lista[this.lista.ord[i]].nome || this.lista[this.lista.ord[i]]) });
			} else {
				var lista = this.lista;
			}
			var valorOriginal = this.valorOriginal();
			// o valor original do Select filho pode ter mais de uma opção. O que ele encontrar primeiro, seleciona
			if (lista && lista.length > 0) {
				var algumSelecionado = false;
				var sel = $(campo);
				if (this.forcaColocaBranco) $("<option value=''></option>").appendTo(sel);
				for (var i = 0, total = lista.length; total--; i++) {
					var opt = $("<option value='" + lista[i].id + "'>" + lista[i].nome + "</option>").appendTo(sel);
					var teste = (this.pai.item && lista[i].id == this.pai.item[this.id]);
					if (Array.isArray(valorOriginal)) {
						for (k = 0; k < valorOriginal.length; k++) teste = (teste || (lista[i].id == valorOriginal[k]));
					} else {
						teste = (teste || (lista[i].id == valorOriginal));
					}
					if (teste) {
						opt.attr("selected", "selected");
						algumSelecionado = true;
						this.$campoVisu.html(lista[i].nome);
					}
				}
				if (!algumSelecionado) {					
					if (valorOriginal == '|todos|') {
						this.campo.options[0] = new Option(this.comTodos, '|todos|');
						somaIndice = 1;
						if (!this.valorInicial) this.valorInicial = '|todos|';
					}				
					this.campo.options[0].setAttribute("selected", "selected");
				}	
			} else {
				if (this.avisoVazio) {
					var label = this.avisoVazio;
				} else {
					var label = "";
					if (campoPai.label) label += campoPai.label.replace(/\:$/gi, '').replace(/^\*/gi, '');
					label += " sem ";
					if (this.label) label += this.label.replace(/\:$/gi, '').replace(/^\*/gi, '');
				}
				this.campo.options[0] = new Option(label, '');
				// se não tem a opção de novo desabilita o campo
				if (!this.criaNovo) this.campo.setAttribute('disabled', true);
			} 
			if (this.pai.dados && this.pai.dados.id && this.pai.dados.id.toString().substring(0,4) == 'novo') this.$campoVisu.html("&nbsp;");
			this.verificaCriaNovo();
			
			// se este campo tem 'fk', verifica se algum depende do select Pai.
			// Se depender, atualiza o valor guardando o id do pai para a gravação de um novo item
			if (this.fk) {
				for (var tabela in this.fk) {
					var esteFK = this.fk[tabela];
					if (esteFK[campoPai.id] != undefined) {
						esteFK[campoPai.id] = valorSelecionado;
					} else if (esteFK == campoPai.id) {
						this.fk[tabela] = {};
						this.fk[tabela][campoPai.id] = valorSelecionado;
					}
				}
			}
			if (this.desabilitado) this.campo.setAttribute('disabled', true);
		}
		const esteCampo = this;
		if (this.mudaSelecao) this.mudaSelecao.call(esteCampo);
		this.desfoca();
		// passa pelos outros campos para verificar se algum deles é baseado neste
		var todosCampos = this.pai.campos;
		for (var i = 0; i < todosCampos.length; i++) {
			if (todosCampos[i].objetoCampo && todosCampos[i].basearEm == this.id) {
				todosCampos[i].objetoCampo.verificaLista.call(todosCampos[i].objetoCampo, this);
			}
		}
		if (this.aposPreencheOptions) this.aposPreencheOptions.call(esteCampo);
	};

	CampoSelect.prototype.preencheListaFilhos = function() {
		if (!this.temDependente) return;
		// encontra os filhos que dependem deste campo e altera-os
		var todosCampos = this.pai.campos;
		for (var j = 0; j < todosCampos.length; j++) {
			var campoFilho = todosCampos[j];
			if (this.id == campoFilho.basearEm) {
				const objCampoFilho = campoFilho.objetoCampo || campoFilho.objCampo;
				objCampoFilho.verificaLista.call(objCampoFilho, this);
			}
		}
	};

	CampoSelect.prototype.carregou = function(lista) {
		this.lista = lista;
		this.carregando = false;
		// se for para manter a lista carregada (para não buscar novamente) grava na memória
		if (this.listaCarregada) window[this.listaCarregada] = jQuery.extend(true, [], lista);
		if (this.trataLista) this.trataLista.call(this);
		var tamanhoLista = (lista) ? ((lista.ord) ? lista.ord.length : lista.length) : 0;
		var select = this.campo;
		$(select).empty();
		tiraClasse(select, 'carregando');
		this.$campoVisu.html("");
		this.$campoVisu.removeClass("carregando");
		var valorSelecionado = this.valorOriginal();
		var somaIndice = 0;		
		var optionEmbranco;
		// só coloca uma opção em branco se não for obrigatório ou se tiver mais de uma opção sem valor pré-selecionado
		if (!this.naoColocaBranco && !this.comTodos && ((!this.obrigatorio) || (tamanhoLista > 1 && !this.valorInicial && !valorSelecionado))) {
			var txtVazio = (this.txtVazio) ? this.txtVazio : "";
			optionEmbranco = select.options[0] = new Option(txtVazio, "");
			somaIndice = 1;
			//if (txtVazio > "") select.options[0].setAttribute("disabled", "disabled");
			// não pod deixar desabilitado pois ao abrir novamente ele irá automaticamente selecionar o primeiro item da lista, já que o "vazio" está desabilitado
		}
		
		if (this.comTodos) {
			select.options[0] = new Option(this.comTodos, '|todos|');
			somaIndice = 1;
			if (!this.valorInicial) this.valorInicial = '|todos|';
		}
		
		var acha = (lista && lista.ord) ? {
			id: function(i) { return lista.ord[i]; },
			nome: function(i) { return (lista[lista.ord[i]].nome) ? lista[lista.ord[i]].nome : lista[lista.ord[i]]; },
			mudaLabel: function(i) { return (lista[lista.ord[i]].mudaLabel) ? lista[lista.ord[i]].mudaLabel : lista[lista.ord[i]]; },
			desabilitado: function(i) { return (lista[lista.ord[i]].desabilitado) ? lista[lista.ord[i]].desabilitado : 0; }
		} : {
			id: function(i) { return lista[i].id; },
			nome: function(i) { return lista[i].nome; },
			mudaLabel: function(i) { return lista[i].mudaLabel; },
			desabilitado: function(i) { return lista[i].desabilitado; }
		};
		
		var temSelecionado = false;
		if (tamanhoLista == 0 && this.desabilitaVazio) {
			// o mesmo parâmetro desabilitaVazio pode ser usado para incluir um texto quando o select estiver vazio e desabilitado
			if (this.desabilitaVazio.length > 0) select.options[0] = new Option(this.desabilitaVazio, '');
			// se a lista estiver vazia e o parâmetro desabilitaVazio existir, desabilita o select
			select.options[0].setAttribute("selected", "selected"); 
			colocaClasse(select, 'desabilitado');
			select.setAttribute('disabled', true);
			temSelecionado = true;
		} else {
			tiraClasse(select, 'desabilitado');
			select.removeAttribute('disabled');
			for (var i = 0, t = tamanhoLista; t--; i++) {
				var dados = { id: acha.id(i), nome: acha.nome(i), desabilitado: acha.desabilitado(i) };
				select.options[ i + somaIndice ] = new Option("", dados.id);
				select.options[ i + somaIndice ].innerHTML = dados.nome;
				if (valorSelecionado && dados.id == valorSelecionado) {
					select.options[ i + somaIndice ].selected = 'selected';
					this.$campoVisu.html(dados.nome);
					temSelecionado = true;
				} else if (dados.desabilitado) {
					select.options[ i + somaIndice ].disabled = 'disabled';
				}
			}
			if (!temSelecionado) {
				if (optionEmbranco) optionEmbranco.setAttribute("selected", "selected");
				temSelecionado = true;	
			}
		}
		
		// passa pelos outros campos para verificar se algum deles é baseado neste
		var todosCampos = this.pai.campos;
		for (var i = 0; i < todosCampos.length; i++) {
			if (todosCampos[i].basearEm == this.id) {
				todosCampos[i].objetoCampo.verificaLista.call(todosCampos[i].objetoCampo, this);
			}
		}
		// chama o desfoca pois como colocou uma nova lista tem que alterar o .valor do campo
		this.desfoca();
		// depois que preencheu com os valores definitivos verifica se tem que pré-selecionar algum
		if (!temSelecionado && (this.valorInicial != undefined || this.gravaSempre)) this.colocaValorOriginal();			
		if (this.desabilitado) this.desabilita();
		this.verificaCriaNovo(select);
		//$(this.campo).change();
		// ao invés de executar o change do campo, roda estas duas açoes (assim evita de chamar o verificaAlteracao)
					this.desfoca.call(this); 
					if (this.change) this.mudouOption.call(this);
		if (this.aposCarregar) this.aposCarregar.call(this);
	};

	CampoSelect.prototype.remontaSelect = function(lista) {
		this.lista = lista;
		var campoNovo = this.criaCampo();
		$(campoNovo).insertBefore($(this.campo));
		removeObj(this.campo);
		this.campo = campoNovo;
	};

	CampoSelect.prototype.colocaValor = function(valor, semAtualizar) {
		var sel = $(this.campo);
		sel.val(valor);
		if (valor != '=' ) {
			if (isNaN(valor)) valor = "'" + valor + "'";
			if (this.campoVisu) this.campoVisu.innerText = (valor) ? sel.find("option[value=" + valor + "]").text() : "";
		}
		if (!semAtualizar) this.atualiza();
		return this;
	};

}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "cidade": campo select com métodos exclusivos para incluir nova cidade (cidades listads pelo IBGE)
// *******************************************************************************************************************************
function CampoCidade (atrib, pai) { CampoSelect.call(this, atrib, pai); } {
	CampoCidade.prototype = new CampoSelect;
	CampoCidade.prototype.constructor = CampoCidade;
	CampoCidade.prototype.tipoCampo = 'cidade';

	CampoCidade.prototype.incluirNovo = function() {
		// por enquanto só funciona quando o campo cidade é baseado em um campo estado
		this.idEst = this.pai.camposID[this.basearEm].objetoCampo.valor;
		var esteCampo = this;
		this.campoOld = this.campo;
		var $select = $(this.campoOld).hide();
		var htmlBotVolta = "<img src='img/ico16_acima_redondo.gif' title=" + fnLang("voltaValorCad") + " class='retornaSelect' />";
		this.imgVolta = $(htmlBotVolta).insertAfter($select).on("click", function() { esteCampo.retornaSelect.call(esteCampo) });
		var htmlSelect = "<select class='novoValorSelect'><option value=''>" + fnLang("carregando") + "...</option></select>";
		$campoNovo = $(htmlSelect).insertAfter($select).focus().on("change", function() { esteCampo.atualiza.call(esteCampo); });
		this.campo = $campoNovo[0];
		if (typeof(_info) == "undefined") _info = {};
		if (!_info.cidadesIBGE) _info.cidadesIBGE = {};
		if (_info.cidadesIBGE[this.idEst]) {
			this.montaListaIBGE();
		} else {
			new cnx.carrega("func/cidadesIBGE_fx.php?idEst=" + this.idEst, function() { esteCampo.guardaListaIBGE.call(esteCampo, this.resposta); });
		}
	};

	CampoCidade.prototype.guardaListaIBGE = function(retorno) {
		var lista = jQuery.parseJSON(retorno);
		_info.cidadesIBGE[this.idEst] = lista; 
		this.montaListaIBGE();
	};

	CampoCidade.prototype.montaListaIBGE = function() {
		var sel = $(this.campo).empty().removeAttr("disabled");
		$("<option value=''></option>").appendTo(sel);
		var lista = _info.cidadesIBGE[this.idEst];
		for (var i = 0, t = lista.ord.length; t--; i++) $("<option value='|novo|" + lista.ord[i] + "'>" + lista[lista.ord[i]] + "</option>").appendTo(sel);
		this.desfoca();
		if (this.pai.aposIncluirNovo) this.pai.aposIncluirNovo();
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "checkbox"
// *******************************************************************************************************************************
function CampoCheck (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoCheck.prototype = new clCampo;
	CampoCheck.prototype.constructor = CampoCheck;
	CampoCheck.prototype.tipoCampo = 'check';

	CampoCheck.prototype.criaCampo = function() {
		var esteCampo = this;
		colocaClasse(this.elementoDiv, "check");
		
		var input = cria('input', {
			type: 'checkbox', 
			className: 'check',
			value: 1, 
			onclick: function() { 
				esteCampo.atualiza.call(esteCampo); 
				esteCampo.verificaParametros.call(esteCampo); 
				if (esteCampo.name && esteCampo.selUnico) esteCampo.tiraDosOutros.call(esteCampo);
			}
		});
		if (this.valorOriginal() > 0) input.checked = 'true';
		//this.$campoVisu.html(this.valorOriginal());	
		
		this.$campoVisu.addClass((this.valorOriginal() > 0) ? "certo" : "errado");
		colocaClasse(this.elementoDiv, ((this.valorOriginal() > 0) ? "certo" : "errado"));
	//	this.$campoVisu = $("<img />").attr("src", (this.valorOriginal() > 0) ? "img/ico24_certo.png" : "img/ico24_errado.png");
	//	this.campoVisu = this.$campoVisu[0];
		//this.campoVisu = cria('span', { className: 'campo', innerHTML: '&nbsp;' });
		//this.$campoVisu = $(this.campoVisu);
		if (esteCampo.name && esteCampo.selUnico) {
			// guarda na aba uma lista com os campos com o mesmo nome 
			// (para simular a função do radio de selecionar um e deselecionar todos os outros)			
			var paiComAba = this.pai;
			while (paiComAba && !paiComAba.aba) paiComAba = paiComAba.pai;
			var aba = (paiComAba) ? paiComAba.aba : window;
			if (!aba.gruposCheck) aba.gruposCheck = {};
			if (!aba.gruposCheck[this.name]) aba.gruposCheck[this.name] = [];
			aba.gruposCheck[this.name].push(this);
		}
		return input;
	};

	CampoCheck.prototype.pegaValor = function() {
		var valor = (this.campo.checked) ? '1' : 0;
		return valor;
	};
	
	CampoCheck.prototype.colocaValor = function(valor, semAtualizar) {
		this.mudaCheck(valor);
		if (!semAtualizar) this.atualiza();
		return this;
	};

	CampoCheck.prototype.colocaValorOriginal = function() {
		var valor = this.valorOriginal();
		this.mudaCheck.call(this, valor);
		this.desfoca();
	};

	CampoCheck.prototype.mudaCheck = function(valor) {
		if (valor) this.campo.checked = true;
		else this.campo.checked = false;
		return this;
	};

	CampoCheck.prototype.verificaParametros = function() {
		if (this.pai && this.pai.verificaParametros) this.pai.verificaParametros.call(this.pai);
	};

	CampoCheck.prototype.aposEditar = function() {
		tiraClasse(this.elementoDiv, "clicado");
		tiraClasse(this.elementoDiv, "desclicado");
	};

	CampoCheck.prototype.aposVisualizar = function() {
		colocaClasse(this.elementoDiv, ((this.valor > 0) ? "clicado" : "desclicado"));
		this.valor = this.valorOriginal();
	};

	CampoCheck.prototype.tiraDosOutros = function() {
		var paiComAba = this.pai;		
		while (paiComAba && !paiComAba.aba) paiComAba = paiComAba.pai;
		var aba = (paiComAba) ? paiComAba.aba : window;
		var todosCampos = aba.gruposCheck[this.name];
		for (var i = 0, t = todosCampos.length; t--; i++) {
			if (todosCampos[i] !== this) {
				todosCampos[i].valorOld = todosCampos[i].valor;
				todosCampos[i].valor = 0;
				todosCampos[i].campo.checked = null;
				tiraClasse(todosCampos[i].elementoDiv, "certo");
				colocaClasse(todosCampos[i].elementoDiv, "errado");
				if (!this.pai.ehAviso) {
					todosCampos[i].trocaTag.call(todosCampos[i]);
					todosCampos[i].trocaTag.call(todosCampos[i]);
				}	
			}
		}
		if (this.aposClicar) this.aposClicar.call(this);
	};

	CampoCheck.prototype.mantemValorOriginal = function() {
		var valorInicial = this.valorOriginal();
		if ( valorInicial == "1" ) $(this.campo).prop("checked", true);
		else $(this.campo).prop("checked", false);
	};

	// CampoCheck.prototype.foiAlterado = function() {
		// var valorOriginal = this.valorOriginal();
		// var valor = this.valor;
		// if(valor != valorOriginal ) log("!")
	// };
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "radio"
// *******************************************************************************************************************************
function CampoRadio (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoRadio.prototype = new clCampo;
	CampoRadio.prototype.constructor = CampoRadio;
	CampoRadio.prototype.tipoCampo = 'radio';

	CampoRadio.prototype.criaCampo = function() {
		var esteCampo = this;
		var input = cria('input', {
			type: 'radio', 
			className: 'check',
			onclick: function() { 
				esteCampo.tiraDosOutros.call(esteCampo);
				esteCampo.atualiza.call(esteCampo); 
			}
		});
		if (this.name) {
			if (typeof(this.name) == "function") this.name = this.name();
			input.setAttribute('name', this.name);
			this.campoVisu.setAttribute('name', this.name);
			// guarda na aba uma lista com os campos com o mesmo nome 
			// (para simular a função do radio de selecionar um e deselecionar todos os outros)			
			var paiComAba = this.pai;
			while (paiComAba && !paiComAba.aba) paiComAba = paiComAba.pai;
			var aba = (paiComAba) ? paiComAba.aba : window;
			if (!aba.gruposRadio) aba.gruposRadio = {};
			if (!aba.gruposRadio[this.name]) aba.gruposRadio[this.name] = [];
			aba.gruposRadio[this.name].push(this);
		}
		if (this.value) input.setAttribute("value", this.value);
		this.valor = this.valorOriginal();
		if (this.valor > 0) input.checked = 'true';
		return input;
	};

	CampoRadio.prototype.pegaValor = function() {
		var valor = (this.campo.checked) ? 1 : undefined;
		return valor;
	};

	CampoRadio.prototype.aposEditar = function() {
		tiraClasse(this.campoLabel, 'vazio');
	};

	CampoRadio.prototype.aposVisualizar = function() {
		this.campoVisu.className = 'campo radio ' + ((this.valor > 0) ? 'clicado' : 'vazio');
		if (this.valor > 0) {
			tiraClasse(this.campoLabel, 'vazio');
		} else {
			colocaClasse(this.campoLabel, 'vazio');
		}
		tiraClasse(this.elementoDiv, "vazio");
		tiraClasse(this.elementoDiv, "clicado");
		colocaClasse(this.elementoDiv, ((this.valor > 0) ? "clicado" : "vazio"));
	};

	CampoRadio.prototype.tiraDosOutros = function() {
		var paiComAba = this.pai;		
		while (paiComAba && !paiComAba.aba) paiComAba = paiComAba.pai;
		var aba = (paiComAba) ? paiComAba.aba : window;
		var todosCampos = aba.gruposRadio[this.name];
		for (var i = 0, t = todosCampos.length; t--; i++) {
			if (todosCampos[i] !== this) {
				todosCampos[i].valorOld = todosCampos[i].valor;
				todosCampos[i].valor = 0;
				todosCampos[i].campo.checked = null;
				if (!this.pai.ehAviso) {
					todosCampos[i].trocaTag.call(todosCampos[i]);
					todosCampos[i].trocaTag.call(todosCampos[i]);
				}	
			}
		}
		if (this.aposClicar) this.aposClicar.call(this);
	};
	
	CampoRadio.prototype.valorRadioSelecionado = function() {
		// verifica o valor entre os campos radio com o mesmo nome e retorna o value do campo checked
		var paiComAba = this.pai;
		while (paiComAba && !paiComAba.aba) paiComAba = paiComAba.pai;
		var aba = (paiComAba) ? paiComAba.aba : window;
		var todosCampos = aba.gruposRadio[this.name];
		for (var i = 0, t = todosCampos.length; t--; i++) if (todosCampos[i].pegaValor()) return todosCampos[i].value;
		return 0;
	};

	CampoRadio.prototype.validaCampoOriginal = CampoRadio.prototype.validaCampo;
	CampoRadio.prototype.validaCampo = function(avisos) {
		if (this.campoUnico) {
			// verifica entre os campos radio com o mesmo nome se tem algum obrigatório e se tiver testa se algum foi selecionado
			var paiComAba = this.pai;
			while (paiComAba && !paiComAba.aba) paiComAba = paiComAba.pai;
			var aba = (paiComAba) ? paiComAba.aba : window;
			var todosCampos = aba.gruposRadio[this.name];
			var algumSelecionado = 0;
			var temObrigatorio = false;
			for (var i = 0, t = todosCampos.length; t--; i++) {
				if (todosCampos[i].pegaValor()) algumSelecionado = todosCampos[i].value;
				if (todosCampos[i].obrigatorio) temObrigatorio = true;
			}
			if (temObrigatorio) {
				var txtAviso = fnLang("campoObrigatorio");
				if (algumSelecionado == 0) {		
					this.colocaAvisoIndividual(txtAviso);		
					var objAviso = { label: this.label, aviso: txtAviso };
					if (avisos) var retorno = avisos.push(objAviso);
					else var retorno = objAviso;
				} else {		
					this.tiraAvisoIndividual(txtAviso);		
					var retorno = false;
				}
			} else {
				var retorno = false;
			}
		} else {
			var retorno = this.validaCampoOriginal(avisos);
		}
		return retorno;
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "texto com busca via AJAX ou parecido com select"
// *******************************************************************************************************************************
function CampoBusca (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoBusca.prototype = new clCampo;
	CampoBusca.prototype.constructor = CampoBusca;
	CampoBusca.prototype.tipoCampo = 'texto';

	CampoBusca.prototype.criaCampo = function() {
		var esteCampo = this;
		
		var input = cria('input', { type: 'text',
											value: this.valorOriginal(),
											onkeyup: function() { esteCampo.atualiza.call(esteCampo); } 
										});
		if ( this.max ) input.maxLength = this.max;
		this.$campoVisu.html(this.valorOriginal());
		return input;
	};

	CampoBusca.prototype.trataCampo = function() { 
		this.valor = trataTextoAjax(this.valor.trim());
	};

	CampoBusca.prototype.originalTratado = function() { 
		return trataTextoAjax(this.valorOriginal(true));
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo faixa de data, com início e término de um período
// *******************************************************************************************************************************
function CampoPeriodo (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoPeriodo.prototype = new clCampo;
	CampoPeriodo.prototype.constructor = CampoPeriodo;
	CampoPeriodo.prototype.campoBase = CampoData;

	CampoPeriodo.prototype.criaCampo = function() {
		if (this.naoColocaLimpa) return cria('div');  // div para quebrar a linha depois do label principal
		else return cria('div', { className: 'limpa' }, { height: 0 });
	};

	CampoPeriodo.prototype.aposCriarCampo = function() {
		var esteCampo = this;
		var campoBase = this.campoBase;
		// campo data do início do período
		var label = (this.label) ? fnLang("de") : fnLang("periodoDe");
		var separador = (this.valorInicial && this.valorInicial.indexOf(",") > 0) ? "," : " ";
		var valorInicial = (this.valorInicial) ? this.valorInicial.split(separador) : [];
		var valorInicialIni = (valorInicial[0]) ? valorInicial[0] : "";
		var valorInicialFim = (valorInicial[1]) ? valorInicial[1] : "";
		this.campoIni = new campoBase({ label: label, id: esteCampo.id + '_ini', tipoPeriodo: 'ini', valorInicial: valorInicialIni }, esteCampo);
		if (esteCampo.alterouCampo) this.campoIni.alterouCampo = function() { esteCampo.alterouCampo.call(esteCampo.pai, esteCampo) };
		this.campoIni.campoDoFiltro = this.campoDoFiltro;
		this.elementoDiv.appendChild(this.campoIni.cria());
		if (!this.naoColocaLimpa) this.elementoDiv.appendChild(cria('div', { className: 'limpa' }));
		this.campo = this.campoIni.campo;
		// campo data do término do período
		this.campoFim = new campoBase({ label: fnLang("ate"), id: esteCampo.id + '_fim', tipoPeriodo: 'fim', valorInicial: valorInicialFim }, esteCampo);
		if (esteCampo.alterouCampo) this.campoFim.alterouCampo = function() { esteCampo.alterouCampo.call(esteCampo.pai, esteCampo) };
		this.campoFim.campoDoFiltro = this.campoDoFiltro;
		this.elementoDiv.appendChild(this.campoFim.cria());
		if (this.comAtalhos) this.colocaAtalhos();
		this.ajustaSelects();
	};

	CampoPeriodo.prototype.pegaValor = function() {
		if (!this.campoIni || !this.campoFim) return '';
		var ini = this.campoIni.pegaValor();
		var fim = this.campoFim.pegaValor();
		return (ini.length == 0 && fim.length == 0) ? '' : { ini: ini, fim: fim, length: 1 };
	};

	CampoPeriodo.prototype.testaFiltro = function(valorTestado) { 
		var ini = dataCalc(this.valor.ini, true);
		if (ini.length == 0) ini = 0;
		var fim = dataCalc(this.valor.fim, true);
		if (fim.length == 0) fim = 0;
		var valor = dataCalc(valorTestado, true);
		if (valor.length == 0) valor = 0;
		return ((ini == 0 || valor >= ini) && (fim == 0 || (valor > 0 && valor <= fim)));
	};

	CampoPeriodo.prototype.colocaValorOriginal = function() {
		if (this.campoIni) this.campoIni.colocaValorOriginal();
		if (this.campoFim) this.campoFim.colocaValorOriginal();
		this.desfoca();
	};

	CampoPeriodo.prototype.colocaAtalhos = function() {
		var esteCampo = this;
		var colocaDia = (this.comAtalhos == "comDia") ? "<li><a class='hoje' href='#' title=''>" + fnLang("hoje") + "</a></li><li><a class='ontem' href='#' title=''>" + fnLang("ontem") + "</a></li>" : "";
		this.atalho = $(
			"<div id='atalhoDatas'>" +
				"<ul><li><a class='limpar' href='#' title=''>" + fnLang("limpar") + "</a></li>" + colocaDia + 
					"<li><a class='mesAtual' href='#' title=''>" + fnLang("mesAtual") + "</a></li>" +
					"<li><a class='mesAnterior' href='#' title=''>" + "mesAnterior||mês anterior" + "</a></li>" +
					"<li><a class='anoAtual' href='#' title=''>" + "anoAtual||ano atual" + "</a></li>" +
					"<li><a class='12meses' href='#' title=''>" + fnLang("ultimo12Meses") + "</a></li>" +
				"</ul>" +
			"</div>");
		this.atalho.appendTo($(this.elementoDiv))
			.on("mouseenter", function() { colocaClasse(this, "aberto") })
			.on("mouseleave", function() { tiraClasse(this, "aberto") })
			.on("click", "li>a", function(e) { tiraClasse(esteCampo.atalho[0], "aberto"); esteCampo.preencheAtalho.call(esteCampo, e); });
		this.desfoca();
	};

	CampoPeriodo.prototype.preencheAtalho = function(e, naoFiltra) {
		// na inicialização da lista pode ser chamado esse método passando como parâmetro o tipo no lugar do evento e
		if (e.preventDefault) e.preventDefault();//previne o default, que seria recarregar a pagina ao clicar em uma tag a com href '#'
		var tipo = (typeof(e) == "string") ? e : origemEvento('a', e).className;//pega a origem do click 'e', com o nome da classe
		var hoje = dt_dma(new Date());//converte data para dd/mm/yyyy
		var dataConvert = valida_data(hoje);//transforma a data em um array [dia, mês, ano] **mês vem como decimal sem zero a direita ex: 9 ao inves de 09
		var ano = dataConvert[2];
		var mes = dataConvert[1];
		var dia = ( dataConvert[0] > 10 ) ? dataConvert[0] : "0" + dataConvert[0] ;
		var funcao = (naoFiltra) ? "soMudaValor" : "colocaValor";
		if ( tipo == 'limpar') {
			this.campoIni[funcao]("");
			this.campoFim[funcao](""); 
		} else if ( tipo == 'hoje') {
			if (mes.toString().length < 2) mes = "0" + mes;
			this.campoIni[funcao](dia + "/" + mes + "/" + ano);
			this.campoFim[funcao](dia + "/" + mes + "/" + ano); 
		} else if ( tipo == 'ontem') {
			var dia = parseInt(dia, 10) - 1;
			if (dia == 0) {
				mes -= 1;
				if (mes == 0) { mes = 12; ano -= 1; }
				dia = this.ultimoDia([0, mes]);
			}
			if (mes.toString().length < 2) mes = "0" + mes;
			if (dia.toString().length < 2) dia = "0" + dia;
			this.campoIni[funcao](dia + "/" + mes + "/" + ano);
			this.campoFim[funcao](dia + "/" + mes + "/" + ano);
		} else if ( tipo == 'mesAtual') {
			if (mes.toString().length < 2) mes = "0" + mes;
			this.campoIni[funcao]("01/" + mes + "/" + ano); //primeiro dia do mês
			this.campoFim[funcao](this.ultimoDia(dataConvert) + "/" + mes + "/" + ano); //ultimo dia do mês
		} else if ( tipo == 'mesAnterior') {
			mes -= 1;
			if (mes == 0) { mes = 12; ano -= 1; }
			var ultimoDiaMesAnterior = this.ultimoDia([dia, mes, ano]);
			if (mes.toString().length < 2) mes = "0" + mes;
			this.campoIni[funcao]("01/" + mes + "/" + ano);
			this.campoFim[funcao](ultimoDiaMesAnterior + "/" + mes + "/" + ano);
		} else if ( tipo == 'anoAtual') {
			this.campoIni[funcao]("01/01/" + ano);
			this.campoFim[funcao]("31/12/" + ano);
		} else if ( tipo == '12meses') {
			var anoAnterior = ano - 1;
			if (mes.toString().length < 2) mes = "0" + mes;
			if (dia.toString().length < 2) dia = "0" + dia;
			this.campoIni[funcao](dia + "/" + mes + "/" + anoAnterior);
			this.campoFim[funcao](hoje);
		}
		if (naoFiltra) this.valor = this.pegaValor();
		this.ajustaSelects.call(this);
		if (!naoFiltra) this.atualiza();
	};

	CampoPeriodo.prototype.ultimoDia = function(data) {
		var ultimoDia = dias[parseInt(data[1], 10) - 1];
		// se for fevereiro e ano bissexto, muda o total de dias do mês
		if (data[1] == 1 && (data[2] % 400 == 0 || (data[2] % 4 == 0 && data[2] % 100 != 0))) ultimoDia = 29;
		return ultimoDia;
	};

	CampoPeriodo.prototype.ajustaSelects = function() {
		// seleciona selects de mês e ano de acordo com o preenchido em um input
		var dataIni = valida_data(this.valor.ini);
		var dataFim = valida_data(this.valor.fim);
		var divs = $(this.elementoDiv).find("div.campo");
		var divIni = divs.first();
		var divFim = divs.last();
		var selMesIni = divIni.find("select.mes");
		var selAnoIni = divIni.find("select.ano");
		var selMesFim = divFim.find("select.mes");
		var selAnoFim = divFim.find("select.ano");
		if (dataIni == -1 && dataFim == -1|| dataIni.length == 0 && dataFim.length == 0) {
			selMesIni.val('');
			selAnoIni.val('');
			selMesFim.val('');
			selAnoFim.val('');
		} else {
			selMesFim.val(dataFim[1]);
			selMesIni.val(dataIni[1]);
			selAnoFim.val(dataFim[2]);
			selAnoIni.val(dataIni[2]);
		}
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo faixa de data com mês e ano, com início e término de um período
// *******************************************************************************************************************************
function CampoPeriodoMesAno (atrib, pai) { CampoPeriodo.call(this, atrib, pai); } {
	CampoPeriodoMesAno.prototype = new CampoPeriodo;
	CampoPeriodoMesAno.prototype.constructor = CampoPeriodoMesAno;
	CampoPeriodoMesAno.prototype.campoBase = CampoMesAno;
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "multiploCheck": multipla opção com uma lista de chekboxes
// *******************************************************************************************************************************
function CampoMultiploCheck (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoMultiploCheck.prototype = new clCampo;
	CampoMultiploCheck.prototype.constructor = CampoMultiploCheck;
	CampoMultiploCheck.prototype.tipoCampo = 'multiploCheck';
	CampoMultiploCheck.prototype.campoBase = CampoCheck;

	CampoMultiploCheck.prototype.criaCampo = function() {
		// cria uma lista com campos Check
		var esteCampo = this;
		colocaClasse(this.elementoDiv, "campoMultiplo");
		if (this.comTodos) this.chkTodos = $("<input type='checkbox' class='check todos' title=" + fnLang("seleciona") + " " + this.comTodos + "' id='chkTodos_" + this.id + "' />")
			.prependTo($(this.campoLabel).attr("for","chkTodos_" + this.id))
			.on('click', function(e) { esteCampo.clicaTodos.call(esteCampo, e) });
		var listaChecks = cria('ul', { className: 'campoMultiplo', onclick: function(e) { paraPropag(e); } });
		this.campoVisu = cria('ul', { className: 'campoMultiplo visu' });
		this.$campoVisu = $(this.campoVisu);
		var lista = this.lista;
		if (!lista && this.buscaLista) {
			if (this.listaCarregada && window[this.listaCarregada]) {
				lista = this.lista = window[this.listaCarregada];
			} else {
				this.liCarregando = $("<li><div class='carregando'>" + fnLang("carregando") + "...</div></li>").appendTo(listaChecks);
				new cnx.carrega(this.buscaLista, function() { esteCampo.retornaLista.call(esteCampo, this.resposta) });
			}
		}
		this.ajustaLista();
		if (!this.listaOriginal) this.listaOriginal = jQuery.extend(true, [], this.lista);
		if (this.filtros){ 
			this.montaFiltro(listaChecks);
			if (this.comTodosAposFiltro){ 
			this.divChkTodos = $("<div id='selTodosSelecionados'><div class='todos'></div></div>").insertAfter(this.liFiltro);
			this.chkTodos = 
			$("<input type='checkbox' class='check todos' title=" + fnLang("seleciona") + " " + this.comTodosAposFiltro + "' id='chkTodos_" + this.id + "' />")
			.appendTo(this.divChkTodos.find(".todos"))
			.on('click', function(e) { esteCampo.clicaTodos.call(esteCampo, e) });
			$("<label for='chkTodos_" + this.id + "'>seleciona todos</label>")
			.appendTo(this.divChkTodos.find(".todos"))			
			}
		}
		if (lista && (lista.length || lista.ord)) this.montaLista(listaChecks);
		if (this.labelTitulo) $(this.elementoDiv).prepend(cria('label', { className: 'labelTitulo' ,innerHTML: this.labelTitulo }));		
		return listaChecks;
	};
	
	CampoMultiploCheck.prototype.aposCriarCampo = function() {
		// se for um campo de filtro ou de parâmetro (de relatório), coloca botão para abrir e fechar e começa fechado
		this.ehFiltro = (this.pai.divFiltro != undefined);
		this.ehParametro = (this.id_parametro);
		if (this.ehFiltro || this.ehParametro) {
			colocaClasse(this.elementoDiv, "aberto");
			var esteCampo = this;
			$(this.campoLabel).prepend($("<a href='#' class='abrefecha'></a>")).on("click", function() { esteCampo.abrefecha.call(esteCampo) });
			this.abrefecha();
		}
	};
	
	CampoMultiploCheck.prototype.abrefecha = function() {
		if (temClasse(this.elementoDiv, "aberto")) {
			tiraClasse(this.elementoDiv, "aberto");
		} else {
			colocaClasse(this.elementoDiv, "aberto");
		}
	};
	
	CampoMultiploCheck.prototype.retornaLista = function(retorno) {
		this.lista = jQuery.parseJSON(retorno);
		this.liCarregando.remove();
		if (this.lista) this.montaLista(this.campo);
	};
	
	CampoMultiploCheck.prototype.ajustaLista = function() {
		// se for lista associativa, transforma em linear
		if (this.lista && !this.lista.length && this.lista.ord && this.lista.ord.length) {
			var listaLinear = [];
			for (var i = 0, t = this.lista.ord.length; t--; i++) {
				var id = this.lista.ord[i];
				var obj = (typeof(this.lista[id]) == "string") ? { nome: this.lista[id] } : this.lista[id];
				obj.id = id;
				listaLinear.push(obj);
			}
			this.lista = listaLinear;
		}
	};

	CampoMultiploCheck.prototype.montaLista = function(listaChecks) {
		this.ajustaLista();
		var esteCampo = this;
		var lista = this.lista;
		var original = this.valorOriginal().toString().split(',');			
		for (var i = 0, t = lista.length; t--; i++) {			
			var paramCheck = { label: lista[i].nome, id: this.id + '_' + lista[i].id, inverte: true};
			if(lista[i].titleAttr) paramCheck['tip'] =  lista[i].nome + ' \n' + lista[i].titleAttr;
			var classeItem = (lista[i].classe) ? lista[i].classe : " ";
			for (var contOriginal = 0, totOriginal = original.length; totOriginal--; contOriginal++) if (original[contOriginal] == lista[i].id) {
				paramCheck.valorInicial = '1';
				this.campoVisu.appendChild(cria('li', { className: 'limpaDepois ' + classeItem }, null, lista[i].nome));
				break;
			}
			lista[i].objCampo = new this.campoBase(paramCheck, this);
			if (esteCampo.alterouCampo) lista[i].objCampo.alterouCampo = function() { esteCampo.alterouCampo.call(esteCampo.pai, esteCampo) };
			lista[i].objCampo.campoDoFiltro = this.campoDoFiltro;
			lista[i].objCampo.desfoca = function() { tiraClasse(this.campo, 'focado'); esteCampo.desfoca.call(esteCampo); };
			if (this.pai.classe != 'clParametros') lista[i].objCampo.pai = this.pai;
			var item = listaChecks.appendChild(cria('li', { className: 'limpaDepois '  + classeItem}));
			var div = lista[i].objCampo.cria();
			item.appendChild(div);
		}
		if (this.desabilitado) this.desabilita();
	};

	CampoMultiploCheck.prototype.montaFiltro = function(listaChecks) {
		this.filtros.campos.map(campo => campo.filtro = "JS");
		this.objFiltro = new clFiltro(this, this.filtros);
		this.objFiltro.funcaoMontar = this.filtra;
		this.objFiltro.antesFiltrar = function() { this.pai.antesFiltrar.call(this.pai) };
		this.liFiltro = $("<li class='filtro'></li>").append(this.objFiltro.monta()).appendTo(listaChecks);
	};
	
	CampoMultiploCheck.prototype.filtra = function() {
		this.lista = this.listaParaMontar;
		limpaConteudo(this.campo, this.liFiltro);
		this.montaLista(this.campo);
	};
	
	CampoMultiploCheck.prototype.antesFiltrar = function() {
		this.listaCompleta = jQuery.extend(true, [], this.listaOriginal);
	};

	CampoMultiploCheck.prototype.clicaTodos = function(e) {
		var clicadoTodos = this.chkTodos.is(":checked");
			// Se clicadoTodos, clica no item que não estava clicado (para clicar)
			// Se não clicadoTodos, clica no item que  estava clicado (para desclicar)
		$(this.campo).find("li input[type='checkbox']").each(function() {
			var esseClicado = $(this).is(":checked");
			if ((clicadoTodos && !esseClicado) || (!clicadoTodos && esseClicado)) $(this).click();
		});
		paraPropag(e);
	};

	CampoMultiploCheck.prototype.habilita = function() {
		var lista = this.lista;
		if (lista) for (var i = 0; i < lista.length; i++) {
			lista[i].objCampo.habilita();
		}
		if (this.chkTodos) this.chkTodos.removeAttr("disabled");
		delete(this.desabilitado);
	};

	CampoMultiploCheck.prototype.desabilita = function() {
		var lista = this.lista;
		if (lista) for (var i = 0; i < lista.length; i++) {
			lista[i].objCampo.desabilita();
		}
		if (this.chkTodos) this.chkTodos.attr("disabled","disabled");
		this.desabilitado = true;
	};

	CampoMultiploCheck.prototype.pegaValor = function() {
		var valores = [];
		// feito pelo DOM (jquery) pois pelo objeto (lista.campos) não pega os campos atualizados.
		// Verificar e voltar a procurar pelo objeto (comentado abaixo)
		$(this.campo).find("li input[type='checkbox']:checked:visible").each(function() { 
			var id = sobeDOM(this, "div").id.split("_");
			id = id[id.length - 1];
			valores.push(id);
		});
		
	//	var lista = this.lista;
	//	if (lista && lista.length) {
	//		for (var i = 0, t = lista.length; t--; i++) {
	//			if (lista[i].objCampo && lista[i].objCampo.pegaValor() > 0) valores.push(lista[i].id);
	//		}
	//	}
		
		return valores.join(',');
	};

	CampoMultiploCheck.prototype.verificaParametros = function() {
		var parametrosAlvo = [];
		var parametrosAbertos = [];
		var lista = this.lista;
		if (lista) {
			for (var i = 0, t = lista.length; t--; i++) {
				var parametrosDoCampo = lista[i].parametros;
				for (var param in parametrosDoCampo) parametrosAlvo.push(parametrosDoCampo[param]);
				if (lista[i].objCampo && lista[i].objCampo.pegaValor() > 0) {
					if (parametrosDoCampo) for (var param = 0, totParam = parametrosDoCampo.length; totParam--; param++) {
						var jaTem = false;
						for (var p = 0, totP = parametrosAbertos.length; totP--; p++) {
							if (parametrosAbertos[p] == parametrosDoCampo[param]) { jaTem = true; break; }
						}
						if (!jaTem) parametrosAbertos.push(parametrosDoCampo[param]);
					}			
				}	
			}
		}
		// só mexe nos outros parâmetros (exibir ou ocultar) se algum dos campos influenciar em algum parâmetro
		if (parametrosAlvo.length > 0) {
			this.pai.oculta(parametrosAlvo, [this.id_parametro]);
			this.pai.exibe(parametrosAbertos);
		}
	};
	
	CampoMultiploCheck.prototype.colocaAvisoIndividual = function(txtAviso) {
		//var divPai = this.campo.parentNode;
		var divPai = this.elementoDiv;
		if (!temClasse(divPai, 'invalida')) {
			// se não tiver texto de aviso, coloca uma classe diferenciada para ter um formato especial e não marca o campo
			var campo = this.lista[0].objCampo.campo;
			var spanAviso = divPai.appendChild(cria('span', { className: 'aviso ' + campo.className }, null, txtAviso));
			if (txtAviso.length > 0) {
				this.invalido = true;
				colocaClasse(divPai, 'invalida');
			} else {	
				colocaClasse(spanAviso, 'soIndica');
				$(spanAviso).animate({ right: '15%' }, 200, function() { $(this).animate({ right: '7%' }, 300, function() { $(this).animate({ right: '10%' }, 400) }) });
			}
			var esteCampo = this;
			if (this.tempoAviso == undefined) this.tempoAviso = 3000;
			if (this.tempoAviso > 0) setTimeout(function() { esteCampo.tiraAvisoIndividual.call(esteCampo) }, this.tempoAviso);
		}
	};	

	CampoMultiploCheck.prototype.colocaValorOriginal = function() {
		var lista = this.lista;
		var original = this.valorOriginal().toString().split(',');
		var valoresOriginais = {};
		for (var i = 0, t = original.length; t--; i++) valoresOriginais[original[i]] = true;
		for (var i = 0, t = lista.length; t--; i++) lista[i].objCampo.mudaCheck(valoresOriginais[lista[i].id]);
	};

	CampoMultiploCheck.prototype.mantemValorOriginal = function() {
		var campo = this;
		var itens = this.valorInicial.split(",");
		if (campo.chkTodos && itens.length == campo.lista.length) {
			$(campo.chkTodos).prop("checked", true);
			$(campo.elementoDiv).addClass("aberto");
		}
		for (var j in campo.lista) {
			var item = campo.lista[j];
			if (item.objCampo.valorInicial == "1") $(item.objCampo.campo).prop("checked", true);
			else $(item.objCampo.campo).prop("checked", false);
		}
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "multiploRadio": multipla opção com uma lista de chekboxes de seleção única
// *******************************************************************************************************************************
function CampoMultiploRadio (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoMultiploRadio.prototype = new clCampo;
	CampoMultiploRadio.prototype.constructor = CampoMultiploRadio;
	CampoMultiploRadio.prototype.tipoCampo = 'multiploRadio';
	CampoMultiploRadio.prototype.campoBase = CampoRadio;

	CampoMultiploRadio.prototype.criaCampo = function() {
		// cria uma lista com campos radio
		const esteCampo = this;
		colocaClasse(this.elementoDiv, "multiploRadio");
		this.ulChecks = cria('ul');
		this.campoVisu = cria('ul', { className: 'visu' });
		this.$campoVisu = $(this.campoVisu);
		this.ajustaLista();
		this.montaLista();
		if (this.labelTitulo) $(this.elementoDiv).prepend(cria('label', { className: 'labelTitulo', innerHTML: this.labelTitulo }));		
		return this.ulChecks;
	};
	
	CampoMultiploRadio.prototype.montaLista = function() {
		var lista = this.lista;
		const esteCampo = this;
		limpaConteudo(this.ulChecks);
		if (lista && lista.length) {
			var original = this.valorOriginal();			
			for (var i = 0, t = lista.length; t--; i++) {
				var param = { label: lista[i].nome, id: this.id + '_' + lista[i].id, inverte: true, name: this.id, value: lista[i].id, campoUnico: true };
				var classeItem = (lista[i].classe) ? lista[i].classe : "";
				if (original == lista[i].id) {
					param.valorInicial = '1';
					this.campoVisu.appendChild(cria('li', { className: 'limpaDepois ' + classeItem }, null, lista[i].nome));
				}
				lista[i].objCampo = new this.campoBase(param, this);
				lista[i].objCampo.tiraDosOutros = function() {};
				if (this.alterouCampo) lista[i].objCampo.alterouCampo = function() { esteCampo.alterouCampo.call(esteCampo.pai, esteCampo) };
				lista[i].objCampo.campoDoFiltro = this.campoDoFiltro;
				lista[i].objCampo.desfoca = function() { tiraClasse(this.campo, 'focado'); esteCampo.desfoca.call(esteCampo); };
				if (this.pai.classe != 'clParametros') lista[i].objCampo.pai = this.pai;
				var item = this.ulChecks.appendChild(cria('li', { className: 'limpaDepois ' + classeItem }));
				item.appendChild(lista[i].objCampo.cria());
			}
		}
	};
	
	CampoMultiploRadio.prototype.ajustaLista = function() {
		// se for lista associativa, transforma em linear
		if (this.lista && !this.lista.length && this.lista.ord && this.lista.ord.length) {
			var listaLinear = [];
			for (var i = 0, t = this.lista.ord.length; t--; i++) {
				var id = this.lista.ord[i];
				var obj = (typeof(this.lista[id]) == "string") ? { nome: this.lista[id] } : this.lista[id];
				obj.id = id;
				listaLinear.push(obj);
			}
			this.lista = listaLinear;
		}
	};

	CampoMultiploRadio.prototype.desabilita = function() {
		var lista = this.lista;
		for (var i = 0; i < lista.length; i++) {
			lista[i].objCampo.desabilita();
		}
		this.chkTodos.attr("disabled", "disabled");
	};

	CampoMultiploRadio.prototype.pegaValor = function() {
		return $(this.campo).find("input[type='radio']:checked").val();
	};

	CampoMultiploRadio.prototype.verificaParametros = function() {
		var parametrosAlvo = [];
		var parametrosAbertos = [];
		var lista = this.lista;
		if (lista) {
			for (var i = 0, t = lista.length; t--; i++) {
				var parametrosDoCampo = lista[i].parametros;
				for (var param in parametrosDoCampo) parametrosAlvo.push(parametrosDoCampo[param]);
				if (lista[i].objCampo && lista[i].objCampo.pegaValor() > 0) {
					if (parametrosDoCampo) for (var param = 0, totParam = parametrosDoCampo.length; totParam--; param++) {
						var jaTem = false;
						for (var p = 0, totP = parametrosAbertos.length; totP--; p++) {
							if (parametrosAbertos[p] == parametrosDoCampo[param]) { jaTem = true; break; }
						}
						if (!jaTem) parametrosAbertos.push(parametrosDoCampo[param]);
					}
				}
			}
		} else {
			// se não tem lista mas tem acao (numérica), inicia o processo de carregar a lista completa do banco de dados
			if (this.acao && (!isNaN(parseInt(this.acao, 10) || typeof(this.acao) == "function"))) {
				// se a lista já foi carregada e for para manter a mesma, usa a já carregada, senão vai buscar
				if (this.listaCarregada && window[this.listaCarregada]) {
					this.lista = jQuery.extend(true, [], window[this.listaCarregada]);
					this.ajustaLista.call(this);
					this.montaLista.call(this);
					this.verificaParametros.call(this);
				} else {
					const esteCampo = this;
					this.carregando = true;
					lista = [{ id: "", nome: fnLang("carregando") + "..." }];
					colocaClasse(this.campo, 'carregando');
					this.$campoVisu.addClass("carregando");
					var url = this.buscaLista || this.pai.urlBase || this.pai.pai.urlBase || this.pai.pai.pai.urlBase;
					url += (url.indexOf('?') >= 0) ? '&' : '?';
					url += (typeof(this.acao) == "function") ? "acao=" + this.acao() : ((!isNaN(parseInt(this.acao, 10))) ? "acao=" + this.acao : "");
					new cnx.carrega(url + '&idEsc=' +_quem[0], function() {
						esteCampo.carregou.call(esteCampo, jQuery.parseJSON(this.resposta));
					});
				}
			}
		}
		// só mexe nos outros parâmetros (exibir ou ocultar) se algum dos campos influenciar em algum parâmetro
		if (parametrosAlvo.length > 0) {
			this.pai.oculta(parametrosAlvo, [this.id_parametro]);
			this.pai.exibe(parametrosAbertos);
		}
	};
	
	CampoMultiploRadio.prototype.carregou = function(retorno) {
		this.lista = retorno;
		delete(this.carregando);
		this.ajustaLista.call(this);
		this.montaLista.call(this);
		this.verificaParametros.call(this);
	};
	
	CampoMultiploRadio.prototype.colocaAvisoIndividual = function(txtAviso) {
		//var divPai = this.campo.parentNode;
		var divPai = this.elementoDiv;
		if (!temClasse(divPai, 'invalida')) {
			// se não tiver texto de aviso, coloca uma classe diferenciada para ter um formato especial e não marca o campo
			var campo = this.lista[0].objCampo.campo;
			var spanAviso = divPai.appendChild(cria('span', { className: 'aviso ' + campo.className }, null, txtAviso));
			if (txtAviso.length > 0) {
				this.invalido = true;
				colocaClasse(divPai, 'invalida');
			} else {	
				colocaClasse(spanAviso, 'soIndica');
				$(spanAviso).animate({ right: '15%' }, 200, function() { $(this).animate({ right: '7%' }, 300, function() { $(this).animate({ right: '10%' }, 400) }) });
			}
			var esteCampo = this;
			if (this.tempoAviso == undefined) this.tempoAviso = 3000;
			if (this.tempoAviso > 0) setTimeout(function() { esteCampo.tiraAvisoIndividual.call(esteCampo) }, this.tempoAviso);
		}
	};	

	CampoMultiploRadio.prototype.mantemValorOriginal = function() {
		var este = this;
		var lista = this.lista
		for ( var i in lista) {
			var item = lista[i];
			if (item.id == este.valorInicial && item.objCampo.valor == 1) $(item.objCampo.campo).prop("checked", true);
			else $(item.objCampo.campo).prop("checked", false);
		}
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "simNao": dois campos radio para selecionar ou desselecionar uma opção
// *******************************************************************************************************************************
function CampoSimNao (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoSimNao.prototype = new clCampo;
	CampoSimNao.prototype.constructor = CampoSimNao;
	CampoSimNao.prototype.tipoCampo = 'simNao';
	CampoSimNao.prototype.campoBase = CampoRadio;

	CampoSimNao.prototype.criaCampo = function() {
		// cria dois campos radio
		var esteCampo = this;
		colocaClasse(this.elementoDiv, "simNao");
		this.objCampoSim = this.cadaCampo({ label: fnLang("sim"), id: this.id + "_sim", inverte: true, name: this.id, value: 1, campoUnico: true, classeEspecial: "sim" });
		const campoSim = this.objCampoSim.cria();
		this.objCampoNao = this.cadaCampo({ label: fnLang("nao"), id: this.id + "_nao", inverte: true, name: this.id, value: 0, campoUnico: true, classeEspecial: "nao" });
		this.elementoDiv.appendChild(this.objCampoNao.cria());
		// ainda não foi utilizada a visualização deste CampoSimNao. Quando for utilizada, ajustar os campoVisu
	//	this.campoVisu = cria('ul', { className: 'visu' });
	//	this.$campoVisu = $(this.campoVisu);
		this.valor = this.valorOriginal();
		if (this.valor > 0) this.objCampoSim.campo.checked = 'true';
			else this.objCampoNao.campo.checked = 'true';
		return campoSim;
	};

	CampoSimNao.prototype.cadaCampo = function(param) {
		var esteCampo = this;
		var cadaObjCampo = new this.campoBase(param, this);
		cadaObjCampo.tiraDosOutros = function() {};
		if (this.alterouCampo) cadaObjCampo.alterouCampo = function() { esteCampo.alterouCampo.call(esteCampo.pai, esteCampo) };
		cadaObjCampo.campoDoFiltro = this.campoDoFiltro;
		cadaObjCampo.desfoca = function() { tiraClasse(this.campo, 'focado'); esteCampo.desfoca.call(esteCampo); };
		if (this.pai.classe != 'clParametros') cadaObjCampo.pai = this.pai;
		return cadaObjCampo;
	};
	
	CampoSimNao.prototype.desabilita = function() {
		this.objCampoSim.desabilita.call(this.objCampoSim);
		this.objCampoNao.desabilita.call(this.objCampoNao);
	};

	CampoSimNao.prototype.habilita = function() {
		this.objCampoSim.habilita.call(this.objCampoSim);
		this.objCampoNao.habilita.call(this.objCampoNao);
	};

	CampoSimNao.prototype.colocaValor = function() {
		var valorSim = this.objCampoSim.pegaValor.call(this.objCampoSim);
		return valorSim || 0;
	};
	
	CampoSimNao.prototype.pegaValor = function() {
		var valorSim = this.objCampoSim.pegaValor.call(this.objCampoSim);
		return valorSim || 0;
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "semCampo": não cria nenhum elemento DOM (nem div, nem input, nem span, nem label)
// *******************************************************************************************************************************
function CampoSemCampo (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoSemCampo.prototype = new clCampo;
	CampoSemCampo.prototype.constructor = CampoSemCampo;
	CampoSemCampo.prototype.tipoCampo = 'semCampo';

	CampoSemCampo.prototype.criaCampo = function() {
		colocaClasse(this.elementoDiv, 'some');
		return cria('div');
	};

	CampoSemCampo.prototype.trocaTag = function() {

	};

	CampoSemCampo.prototype.trataCampo = function() { 
		if (this.valor) {
			this.valor = this.valor.toString();
			this.valor = trataTextoAjax(this.valor.trim(), true);
		}
	};

	CampoSemCampo.prototype.originalTratado = function() {
		var valor = this.valorOriginal();
		if (valor) {
			valor = valor.toString();
			valor = trataTextoAjax(valor.trim());
		}
		return valor;
	};
	
	CampoSemCampo.prototype.pegaValor = function() { 
		if (this.valor == undefined) this.valor = this.valorOriginal();
		return this.valor;
	};
	
	CampoSemCampo.prototype.colocaValor = function(valor) {
		this.valor = valor;
		this.atualiza();
		return this;
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "html" - utilizando o tinyMCE
// *******************************************************************************************************************************
function CampoHtml (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoHtml.prototype = new clCampo;
	CampoHtml.prototype.constructor = CampoHtml;
	CampoHtml.prototype.tipoCampo = 'html';

	CampoHtml.prototype.criaCampo = function() {
		var esteCampo = this;
		var textarea = cria('textarea', {
			innerHTML: this.valorOriginal(), //.replace(/\<br\s?\\?\/?\>/gi, '\n'),
			onkeyup: function(e) { 
				esteCampo.atualiza.call(esteCampo);
				esteCampo.trocaTextoMax.call(esteCampo, e); 
			}
		});
		this.campoVisu = cria('div', { className: 'campo visu', innerHTML: '&nbsp;' });
		this.$campoVisu = $(this.campoVisu);
		// tirado o replace de <br> por /n para a tabela de pagamentos da matrícula sair direito - 21/12/2017
		this.$campoVisu.html(this.valorOriginal());//.replace(/\<br\s?\\?\/?\>/gi, '\n'));
		// inclui o mesmo estilo utilizado dentro do tinyMCE (para aplicar no campoVisu): campoHTML.css
		if ($("link[href='func/campoHTML.css']").length == 0) $('head').append('<link rel="stylesheet" href="func/campoHTML.css" type="text/css" />');
		return textarea;
	};

	CampoHtml.prototype.pegaValor = function() {
		var valor = (this.editorMCE && !this.naoEditavel) ? this.editorMCE.getContent() : this.$campoVisu.html();
		if (!valor) valor = this.$campoVisu.html();
		valor = valor.replace(/(\r\n|\r|\n)/igm, "");
		return valor;
	};

	CampoHtml.prototype.valorParaGravar = function() {
		if (this.editorMCE && !this.naoEditavel) {
			valor = this.editorMCE.getContent();
		} else {
			// troca os campos editáveis por seu conteudo (em um <p>)
			this.$campoVisu.find("textarea").each(function() {
				var elem = $(this);
				$("<p id='" + elem.attr("id") + "'>" + elem.val().replace(/(\r\n|\r|\n)/igm, "<br />") + "</p>").insertAfter(elem);
				elem.remove();
			});
			valor = this.$campoVisu.html();
		}
		valor = valor.replace(/(\r\n|\r|\n)/igm, "");
		return valor;
	};

	CampoHtml.prototype.trataCampo = function() {
		if (!this.valor) return;
		// tira as quebras de linha a mais que o tynyMCE coloca entre os parágrafos
		this.valor = this.valor.replace(/(\r\n|\r|\n)/igm, "");
		this.valor = trataTextoAjax(this.valor.trim());
	};

	CampoHtml.prototype.originalTratado = function() { 
		var valor = this.valorOriginal(true);
		if (valor) valor = trataTextoAjax(valor.trim());
		return valor;
	};

	CampoHtml.prototype.aposColocarDOM = function() {
		// inicializa o tinyMCE (ou outro framework para edição de HTML)
		this.inicializou = false;
		this.inicializa();
		if (this.buscaBotoesExtra) this.buscaBotoesExtra();
	};

	CampoHtml.prototype.inicializa = function() {
		var esteCampo = this;		
		var toolbarBotoes = "";
		var botoesExtra = {};
		if (!this.semBotImagem) botoesExtra["botaoImage"] = { icon : 'image', onAction: imagens.abreDialog };
		for (var i in this.botoesExtra) {
			botoesExtra[i] = this.botoesExtra[i];
			toolbarBotoes += i + " ";
		}
		var plugins = (esteCampo.plugins) ? esteCampo.plugins : "charmap autoresize";
		var toolbar1 = (esteCampo.toolbar1 !== undefined) ? esteCampo.toolbar1 : "undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent";
		if (!this.semBotImagem) toolbar1 += " | botaoImage";
		var toolbar2 = (esteCampo.toolbar2 !== undefined) ? esteCampo.toolbar2 :  toolbarBotoes + "forecolor backcolor | fontselect fontsizeselect charmap";
		var content_css = (esteCampo.content_css) ? esteCampo.content_css : "func/campoHTML.css";

		if (toolbarBotoes.length > 0) toolbarBotoes += "| ";
		var parametros = {
			plugins: plugins,
			selector: "textarea#" + esteCampo.idCampo,
			theme: "silver",
			content_css: content_css,
			statusbar : false,
			menubar : false,
			table_responsive_width: true,
			toolbar1: toolbar1,
			toolbar2: toolbar2,
			link_assume_external_targets: true,			
			setup: function(ed) {
				for (var i in botoesExtra) { 
					const criaBotao = (botoesExtra[i].type == "menuButton") ? "addMenuButton" : "addButton";
					ed.ui.registry[criaBotao](i, botoesExtra[i]);
				}
				ed.on('change', function() { esteCampo.atualiza.call(esteCampo); });
				esteCampo.editorMCE = ed;
				imagens.objReferencia = esteCampo;
				if(esteCampo.colocaSetup) esteCampo.colocaSetup.call(esteCampo, ed);
			}
		};
		// em inglês -> não coloca language, usa o default to tiny
		if (_quem[15] != 1) parametros.language = (_quem[15] == 2) ? "es" : "pt_BR";
		if (this.altura) parametros.height = this.altura;

		if (!esteCampo.inicializou) {
			try {
				if (tinyMCE) {
					// remove todas instancias anteriores para poder incializar mesmo já tendo aberto anteriormente 
					if (!this.maisDeUmCampoTxt) tinymce.get().map(editor => editor.remove());
					tinyMCE.init(parametros);
					esteCampo.inicializou = true;
					setTimeout(function() {
						esteCampo.ajustaAltura.call(esteCampo);
						if (esteCampo.funcaoAposInicializar) esteCampo.funcaoAposInicializar.call(esteCampo);
					}, 10);
				} else {
					// se ainda não carregou o objeto tinyMCE, tenta novamente após 10 milisegundos
					var timer = setTimeout(function() { esteCampo.inicializa.call(esteCampo); }, 10);
				}
			} catch (e) {
				// se não conseguiu nem testar o objeto, tenta novamente após 10 milisegundos
				var timer = setTimeout(function() { esteCampo.inicializa.call(esteCampo); }, 10);
			}
		}
	};

	CampoHtml.prototype.colocaValorOriginal = function(conteudo) {
		if (this.naoEditavel) {
			this.$campoVisu.html(conteudo);
		} else if (tinyMCE && this.editorMCE) {
			this.editorMCE.setContent(conteudo);
		}
		$(this.elementoDiv).find("div.carregando").remove();
		this.desfoca();
	};

	CampoHtml.prototype.verificaLista = function() {
		// o this desta função é o campo filho
		// considerando que o campoPai é sempre um select
		// o basearEm com mais de um campo só funciona com acaoBuscaConteudo
		if (!this.acaoBuscaConteudo) return;
		var valoresSelecionados = [];
		var campoPai = [];
		var todosCampos = this.pai.campos;
		for (var cadaCampoPai = 0; cadaCampoPai < this.basearEm.length; cadaCampoPai++) {
			var idCampoPai = this.basearEm[cadaCampoPai];
			for (var j = 0; j < todosCampos.length; j++) {
				if (todosCampos[j].id == idCampoPai) {
					campoPai[j] = todosCampos[j].objetoCampo;
					var valor = campoPai[j].pegaValor.call(campoPai[j]);
					if (valor) valoresSelecionados.push(idCampoPai + '=' + valor);
				}
			}
		}
		if (valoresSelecionados.length == 0) return;
		if (this.analisaValorSelecionado) this.analisaValorSelecionado.call(this, valoresSelecionados);
		this.campo.value = (this.txtCarregando) ? this.txtCarregando : fnLang("carregaDocs") + "...";
		this.campo.setAttribute('disabled', true);
		var url = this.pai.urlBase + '?acao=' + this.acaoBuscaConteudo;
		var info = valoresSelecionados.join('&');
		if (this.pai.refExt) info += '&refExt=' + JSON.stringify(this.pai.refExt);
		var esteCampo = this;
		if (this.colocaCarregando) this.colocaCarregando.call(this);
		new cnx.carrega(url, function() { 
			esteCampo.retornoBotoes = this.resposta;
			if (!esteCampo.naoEditavel && esteCampo.colocaBotoesExtra) esteCampo.colocaBotoesExtra.call(esteCampo);
			esteCampo.retornoBasearEm.call(esteCampo, this, campoPai);
		}, null, 'POST', info);
	};

	CampoHtml.prototype.ajustaAltura = function() {
		// o tinyMCE ás vezes não ajusta a altura de acordo com o conteúdo, por isso deve ser forçado esse ajuste
		if (!this.naoEditavel && this.editorMCE) {
			var iframeMCE = $("#" + this.editorMCE.id + "_ifr");
			const altura = (this.altura) ? this.altura : iframeMCE.contents().height() + "px" ;
			iframeMCE.css("height", altura);
		}
	};
	
	CampoHtml.prototype.trataRetorno = function(texto) {
		return decode(texto);
	};	
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "email" 
// *******************************************************************************************************************************
function CampoEmail (atrib, pai) { CampoTexto.call(this, atrib, pai); } {
	// caracteristicas de um  email 
	//Não possuir espaços;
	//Possuir o @;
	//Possuir algum caracter após o @;
	//Possuir algum caracter antes do @;
	//Possuir pelo menos um ponto após o caracter depois do @;
	//Possuir algum caracter após o ponto.

	//	var regEmail =
						// essas duas expressoes deixa colocar mais de um ponto 
						//	/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;					
						//   /^[a-zA-Z0-9][a-zA-Z0-9\._-]+@([a-zA-Z0-9\._-]+\.)[a-zA-Z-0-9]{2}/; 
						// essa expressão ja é mais completa.
						//  	/^([\w\-]+\.)*[\w\- ]+@([\w\- ]+\.)+([\w\-]{2,3})$/;
	//	if (this.valor.test(regEmail)) {
	//		this.verificaAlteracao();
	//	} else {
	//		if (objBotoes) objBotoes.desabilita('gravar'); 
	//	}
	CampoEmail.prototype = new CampoTexto;
	CampoEmail.prototype.constructor = CampoEmail;
	CampoEmail.prototype.tipoCampo = 'email';

	CampoEmail.prototype.validaEspecifico = function() { 
		var conteudo = this.valor;
		var regEmail = /^([\w\-]+\.)*[\w\- ]+@([\w\- ]+\.)+([\w\-]{2,})$/;
		var cadaEmail = conteudo.split(/;|%3B/gi);
		var valida = true;
		for (var email in cadaEmail) {
			if (!regEmail.test(cadaEmail[email].trim().replace(/%20/gi, ""))){
				valida = false;
				break;
			}
		}
		var txtAviso = fnLang("emailInvalido");
		if (valida) {
			this.tiraAvisoIndividual(txtAviso);
			return false;
		} else {
			this.colocaAvisoIndividual(txtAviso);
			return { label: this.label,  aviso: txtAviso };
		}
	};
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "CampoCor" (clica para escolher uma cor)
// *******************************************************************************************************************************
function CampoCor (atrib, pai) { CampoTexto.call(this, atrib, pai); } {
	CampoCor.prototype = new CampoTexto;
	CampoCor.prototype.constructor = CampoCor;
	CampoCor.prototype.tipoCampo = 'cor';
	// para utlizar estes CampoCor deve existir o link para o script iris.min.js
	// <script language='javascript' type='text/javascript' src='func/iris.min.js'></script>

	CampoCor.prototype.criaCampo = function() {
		var valorOriginal = this.valorOriginal();
		if (valorOriginal.length == 0 && this.corPadrao) valorOriginal = this.corPadrao;
		if (valorOriginal.length > 0 && valorOriginal.substr(0,1) != "#") valorOriginal = "#" + valorOriginal;
		var input = cria('input', { type: 'text', value: valorOriginal });
		this.$campoVisu.css({ 'background-color': valorOriginal, 'color': valorOriginal }).html(valorOriginal);
		return input;
	};
	
	CampoCor.prototype.pegaValor = function() {
		if (this.campo.value == this.txtVazio) return "";
		if (this.campo.value.length == "" && this.corPadrao) this.campo.value = this.corPadrao;
		else if (this.semHashtag) {
			if (this.campo.value.substr(0,1) == "#") var valor = this.campo.value.slice(1);
		} else var valor = this.campo.value;
		if (valor) return valor;
		else return this.campo.value;
	};

	CampoCor.prototype.aposCriarCampo = function() {
		var valorOriginal = this.valorOriginal();
		if (valorOriginal.length == 0 && this.corPadrao) valorOriginal = this.corPadrao;
		if (valorOriginal.substr(0,1) != "#") valorOriginal = "#" + valorOriginal;
		this.mostraCor(valorOriginal);
		var esteCampo = this;
		var $campo = $(this.campo);
		//log(this);
		const opcoes = {
			mode: 'Hex',
			change: function(event, ui) { esteCampo.mostraCor(ui.color.toString()); esteCampo.atualiza.call(esteCampo); $campo.change(); }
		};
		if (this.targetIris) opcoes.target = (typeof(this.targetIris) == "function") ? this.targetIris() : this.targetIris;
		$campo.iris(opcoes);
		$(document.body).on('click', function() { $("div#cor input").iris('hide') });
		$campo.on('click', function(e) { esteCampo.passaFrente.call(esteCampo); $campo.iris('show'); paraPropag(e); });
		$(this.elementoDiv).on('click', paraPropag).on('mouseup', '.iris-square-handle', function() { $campo.iris('hide') });
		if (this.naoMostraCores) $(this.campo).off();
		// coloca apenas uma vez o tratador do evento "click" no body para fechar todos os iris da tela
		if (typeof(_clickFechaIrisColocado) == "undefined" || !_clickFechaIrisColocado) {
			_clickFechaIrisColocado = true;
			$("body").on("click", function() {
				$("div.iris-picker").hide();
			});
		}
	};
	
	CampoCor.prototype.originalTratado = function() {
		return this.valorOriginal().replace("#", "");
	};

	CampoCor.prototype.colocaValor = function(valor, semAtualizar) {
		this.mostraCor(valor);
		if (!semAtualizar) this.atualiza();
		return this;
	};

	CampoCor.prototype.mostraCor = function(cor) {
		$(this.campo).css({ 'background-color': cor, 'color': cor });
		cor = cor.slice(1);
		this.valor = cor;
		this.campo.value = cor;
	};

	CampoCor.prototype.passaFrente = function(cor) {
		if (this.pai.objTipo == "colecao") {
			var colecao = this.pai.item.pai;
			if (!colecao.zindexUltimoItem) colecao.zindexUltimoItem = colecao.itens.length + 10;
			colecao.zindexUltimoItem++;
			$(this.elementoDiv).closest("li").css({ "z-index": colecao.zindexUltimoItem });
		}
		// fecha todos os color-picker já abertos
		$("div#cor input").iris('hide');
	};

}
// *******************************************************************************************************************************

// *******************************************************************************************************************************
// campo do tipo "coleção"
// *******************************************************************************************************************************
function CampoColecao (atrib, pai) { clCampo.call(this, atrib, pai); if (this.pai.aba) this.perm = this.pai.aba.perm; } {
	CampoColecao.prototype = new clCampo;
	CampoColecao.prototype.constructor = CampoColecao;
	CampoColecao.prototype.tipoCampo = 'colecao';
	
	CampoColecao.prototype.criaCampo = function() {
		var esteCampo = this;
		colocaClasse(this.elementoDiv, 'colecao');
		if (this.visuLista) colocaClasse(this.elementoDiv, 'visuLista');
		this.ul = cria('ul');
		// para montar os LIs usa-se o que foi carregado com os dados do cadastro 
		// se não tiver, se tiver ação, busca os dados de acordo com a ação e quando retornar monta os LIs
		
		if (!this.pai.dados) this.listaDados = [];
		else this.listaDados = jQuery.extend(true, [], (this.pai.dados[this.id] || this.pai.dados.lista));
		if (!this.lista) this.lista = this.listaDados;
		this.ajustaLista();
		if (!this.listaOriginal) this.listaOriginal = jQuery.extend(true, [], this.lista);
		if (this.filtros) this.montaFiltro();
		this.campoVisu = this.ul;
		this.campo = this.ul;
		this.montaLista();
		if (this.botoes) this.objBotoes = new clBotoes(this, true);
		if (!this.exclusao) this.exclusao = {};
		if (this.mudaOrdem) $(this.ul).sortable().disableSelection().on("sortstop", function() { esteCampo.mudouOrdem.call(esteCampo); } );	
		this.$campoVisu = $(this.campoVisu);
		if (this.comecaFechado) this.fecha();
		if (this.aposMontarColecao) this.aposMontarColecao();	
		if (this.criaDesabilitado) this.montaDesabilitado();
		return this.ul;
	};
	
	CampoColecao.prototype.montaDesabilitado = function() {
		var lista = this.lista;
		for (var i = 0; i < lista.length; i++) {
			var campos = lista[i].objItem.campos;
			for (var k = 0; k < campos.length; k++) {	
				campos[k].objCampo.trocaTag();			
			}
		}
	};
	
	CampoColecao.prototype.ajustaLista = function() {
		// se for lista associativa, transforma em linear
		if (!this.lista.length && this.lista.ord && this.lista.ord.length) {
			var listaLinear = [];
			for (var i = 0, t = this.lista.ord.length; t--; i++) {
				var id = this.lista.ord[i];
				var obj = (typeof(this.lista[id]) == "string") ? { nome: this.lista[id] } : this.lista[id];
				obj.id = id;
				listaLinear.push(obj);
			}
			this.lista = listaLinear;
		}
	};
	
	CampoColecao.prototype.fecha = function() {
		var esteCampo = this;
		$(this.elementoDiv).on("click", "label", function() { esteCampo.mudaFechado.call(esteCampo) });
		this.mudaFechado();
	};
	
	CampoColecao.prototype.mudaFechado = function() {
		var esteCampo = this;
		var ajuste = (temClasse(this.elementoDiv, 'fechado')) 
			? { coloca: "aberto", tira: "fechado" } 
			: { coloca: "fechado", tira: "aberto" };
		colocaClasse(this.elementoDiv, ajuste.coloca);
		tiraClasse(this.elementoDiv, ajuste.tira);
	};
	
	CampoColecao.prototype.trocaClasseVisu  = function() { 
	//console.log(this);
		var elementoDiv = this.elementoDiv;
		if (temClasse(elementoDiv, 'visuFechado')){
			tiraClasse(elementoDiv, 'visuFechado');
			colocaClasse(elementoDiv, 'visuAberto');			
		} else {
			tiraClasse(elementoDiv, 'visuAberto');
			colocaClasse(elementoDiv, 'visuFechado');
		}
	};
	
	CampoColecao.prototype.mudouOrdem  = function() { 
		var lis = this.ul.childNodes;
		var primeiroLi = (this.titulos) ? 1 : 0 ;
		for (var ordemDOM = primeiroLi; ordemDOM < lis.length; ordemDOM++) {
			for (var i = 0; i < this.lista.length; i++) {
				var objItem = this.lista[i].objItem;
				var campoOrdem = objItem.camposID["ordem"];
				if (campoOrdem && lis[ordemDOM] == objItem.li) {
					campoOrdem.objCampo.colocaValor(ordemDOM);
					break;
				}
			}
		} 
	};
	
	CampoColecao.prototype.removeItensDoDom  = function() { 
		var lista = this.lista;
		var tot = lista.length;
		for (var i = tot - 1; i >= 0; i--) {
			lista[i].objItem.remove();
		}
	};
	
	CampoColecao.prototype.montaFiltro = function() {
		this.filtros.campos.map(campo => campo.filtro = "JS");
		this.objFiltro = new clFiltro(this, this.filtros);
		this.objFiltro.emLinha = true;
		this.objFiltro.funcaoMontar = this.filtra;
		this.objFiltro.antesFiltrar = function() { this.pai.antesFiltrar.call(this.pai) };
		this.liFiltro = $("<li class='filtro'></li>").append(this.objFiltro.monta()).appendTo(this.ul);
	};
	
	CampoColecao.prototype.filtra = function() {
		this.lista = this.listaParaMontar;
		this.montaLista();
	};
	
	CampoColecao.prototype.antesFiltrar = function() {
		this.listaCompleta = jQuery.extend(true, [], this.listaOriginal);
	};
	
	CampoColecao.prototype.montaLista = function() { 
		this.contaItem = 0;
		limpaConteudo(this.ul, this.liFiltro);
		if (this.lista.length == 0 && this.listaVazia) this.lista = this.listaVazia;
		if (this.tituloSempre || ((this.lista.length > 0 || this.vazioCriaNovo) && !this.tituloExterno)) this.criaTitulos();	
		if (this.tituloSempre || ((this.lista.length > 0 || this.vazioCriaNovo) && this.tituloExterno)) this.criaTituloExterno();		
		if (this.lista.length > 0) {
			this.completaDados();
			if (this.soMontaNoFim) this.ulTemporario = [];
			for (var i = 0; i < this.lista.length; i++) {
				if (this.trataDadoItem) this.trataDadoItem(this.lista[i]);
				this.criaItem(this.lista[i]);
			}
			if (this.soMontaNoFim) {
				$(this.ul).append(this.ulTemporario);
				delete (this.ulTemporario);
			}
		} else if (this.vazioCriaNovo) this.novoItem();
		if (this.aposIncluir) this.aposIncluir();
		if (this.aposMontar) this.aposMontar();
	};
	
	CampoColecao.prototype.completaDados = function() {
		for (var contCampo = 0; contCampo < this.campos.length; contCampo++) {
			var campo = this.campos[contCampo].id;
			for (var i = 0, t = this.lista.length; t--; i++) {
				if (this.lista[i][campo] == undefined) {
					if (this.listaDados[this.lista[i].id]) this.lista[i][campo] = this.listaDados[this.lista[i].id][campo];
				}
			}
		}
	};
	
	CampoColecao.prototype.criaTitulos = function() {
		if (!this.titulos || this.temTitulo) return;
		this.tituloDom = $("<li class='titulos'></li>").appendTo(this.ul);
		for (var i = 0; i < this.titulos.length; i++) {
			var titulo = this.titulos[i];
			var classe = titulo.classe || titulo;
			if (titulo.nome) titulo = titulo.nome;
			$("<span class='" + classe + "'>" + titulo + "</span>").appendTo(this.tituloDom);	
		}
		this.temTitulo = true;
	};	

	CampoColecao.prototype.criaTituloExterno = function() {
		if ((!this.tituloExterno && this.titulos) || this.temTituloExterno) return;
			if(this.ehGrupo) this.tituloDom = $("<div class='tituloExterno'></div>").prependTo(this.elementoDiv);
			if(!this.ehGrupo) this.tituloDom = $("<div class='tituloExterno'></div>").appendTo(this.elementoDiv);
			for (var i = 0; i < this.titulos.length; i++) {
				var titulo = this.titulos[i];
				var classe = titulo.classe || titulo;
				if (titulo.nome) titulo = titulo.nome;
				if(this.ehGrupo)$("<span class='" + classe + "'>" + titulo + "</span>").prependTo(this.tituloDom);			
				if(!this.ehGrupo)$("<span class='" + classe + "'>" + titulo + "</span>").appendTo(this.tituloDom);			
			}
		this.temTituloExterno = true;
	};	
	
	CampoColecao.prototype.remontaLista = function() { 
		var listaOriginal = this.listaOriginal;
		var novaLista = this.lista;
		var listaAntigaAssoc = {};
		for (var i = 0, t = listaOriginal.length; t--; i++) listaAntigaAssoc[listaOriginal[i].id] = listaOriginal[i];
		var idsListaNova = {};
		this.contaItem = 0;
		if (this.soMontaNoFim) this.ulTemporario = [];
		for (var i = 0, t = novaLista.length; t--; i++) {
			var novaIdPagto = novaLista[i].id;
			idsListaNova[novaIdPagto] = true;
			if (listaAntigaAssoc[novaIdPagto]) {
				this.contaItem++;
				//é o mesmo item só altera os valores dos campos desse item (listaAntigaAssoc[novaIdPagto].objItem....)				
				listaAntigaAssoc[novaIdPagto].objItem.alteraItem(novaLista[i]);
				novaLista[i].objItem = listaAntigaAssoc[novaIdPagto].objItem;
			} else {
				//é um item novo entao chama o cria item
				this.criaItem(novaLista[i]);
			}
		}
		if (this.soMontaNoFim) {
			$(this.ul).append(this.ulTemporario);
			delete (this.ulTemporario);
		}
		for (var i = 0, t = listaOriginal.length; t--; i++) {
			if (!idsListaNova[listaOriginal[i].id] && listaOriginal[i].objItem) listaOriginal[i].objItem.excluiItem();
		}		
	};
	
	CampoColecao.prototype.novoItem = function(dadosItem, pos) {
		if (!this.tituloExterno) this.criaTitulos();
		else this.criaTituloExterno();
		if (!this.contNovoItem) this.contNovoItem = 0;
		this.contNovoItem++;
		if (!dadosItem) dadosItem = {};
		if (!dadosItem.id){ dadosItem.id = "novo_" + this.contNovoItem;}
		if (this.mudaOrdem) {
			var maiorOrdem = 0;
			for (var i = 0; i < this.lista.length; i++) {
				var campoOrdem = this.lista[i].objItem.camposID.ordem;
				if (campoOrdem && campoOrdem.objCampo.valor > maiorOrdem) maiorOrdem = parseInt(campoOrdem.objCampo.valor, 10);
			}
			dadosItem.ordem = maiorOrdem + 1;
		}
		if (this.novoNoInicio) pos = 0;
		var colocaNoFim = (pos == undefined || pos >= this.lista.length);
		var item = this.criaItem(dadosItem, pos, colocaNoFim);
		if (colocaNoFim) this.lista.push(dadosItem);
		else this.lista.splice(pos, 0, dadosItem);
		//item.li.scrollIntoView();
		if (!this.naoFoca && $(item.li).find(":input")[0]) $(item.li).find(":input")[0].focus();
		if (this.avisoNovo) $(this.avisoNovo).remove();
		if (this.aposIncluir) this.aposIncluir();
		if (this.aposIncluirNovo) this.aposIncluirNovo(item);
		return item;
	};
	
	CampoColecao.prototype.criaItem = function(dadosItem, pos, colocaNoFim) {
		//var campos = (dadosItem.id && dadosItem.id.toString().substr(0, 4) == "novo" && !dadosItem.naoEhNovo && this.camposNovo) ? this.camposNovo : this.campos;
		var atrib = {
			campos: jQuery.extend(true, [], this.campos),
			dados: dadosItem,
			gravaSempre: dadosItem.gravaSempre, // ??????? de onde vem esse gravaSempre????
			ajustaDadosItem: this.ajustaDadosItem,
			antesMontarItem: this.antesMontarItem,
			aposMontarItem: this.aposMontarItem,
			desabilitado: dadosItem.desabilitado,
			tip: dadosItem.tip
		};
		if (this.camposNovo) atrib["camposNovo"] = jQuery.extend(true, [], this.camposNovo);
		// para ajustar o ID dos campos de cada item desta coleção, passa o id para o itemCampoColecao	
		if (!atrib.dados.id) atrib.dados.id = atrib.dados.id; // ???????
		var item = new ItemCampoColecao(atrib, this);
		var itemDom = item.cria();
		item.trocaTag.call(item);
		//log(itemDom);
		if (this.soMontaNoFim) {
			if (colocaNoFim || pos == undefined) this.ulTemporario.push(itemDom);
			else this.ulTemporario.splice(pos, 0, itemDom);
		} else {
			if (colocaNoFim || pos == undefined) this.ul.appendChild(itemDom);
			else $(this.ul).children()[pos].before(itemDom);
		}
		dadosItem.objItem = item;
		if (this.aposIncluirItem) this.aposIncluirItem(dadosItem);
		return item;
	};
	
	CampoColecao.prototype.desfocaColecao = function() { 
		var lista = this.lista;
		for (var i = 0; i < lista.length; i++) {
			var item = lista[i].objItem;		
			if (item) {
				var campos = item.campos;
				for (var k = 0; k < campos.length; k++) {
					var campo = campos[k].objCampo;
					if (campo && campo.valor && typeof(campo.valor) != "object") this.lista[i][campo.id] = destrataTextoAjax(unescape(campo.valor));
				}
			}
		}	
	}; 
	
	CampoColecao.prototype.pegaValor = function() {
		var listaCamposAlterados = {};
		for (var i = 0; i < this.lista.length; i++) {	
			var dadosCampoPai = [];
			for (var k = 0 ; k < this.campos.length; k++) {
				var campo = this.campos[k];
				if (this.camposID[campo.id] && this.camposID[campo.id].objCampo) {
					var valor = this.camposID[campo.id].objCampo.campo.value;
					var dadosCampo = { "tab": campo.tab, "cmp": campo.cmp, "val": valor, "tipo": campo.sqlTipo };
					dadosCampoPai.push(dadosCampo);
				}
			}
			listaCamposAlterados[this.lista[i].id] = dadosCampoPai;	
		}
		return listaCamposAlterados;
	};
	
	CampoColecao.prototype.foiAlterado = function() {
		if (this.cmp == "naoGrava") return false; 
		var camposComGravaSeAlterouTabela = {};
		for (var i = 0; i < this.campos.length; i++) {
			var campo = this.campos[i];
			if (campo && campo.gravaSeAlterouTabela && campo.cmp != "naoGrava") camposComGravaSeAlterouTabela[campo.id] = campo.tab;
		}
		var listaCamposAlterados = {};
		var temItemAlterado = false;
		var excluiVazio = [];
		var lista = this.lista;
		// if (this.id == "descLista") log(this.id, this.lista);
		for (var i = 0; i < lista.length; i++) {
			var gravaItem = true;
			var dadosCampoPai = [];
			var tabelasAlteradas = {};
			var item = lista[i].objItem;
			if (item) {
				var temValorNaoVazio = false;
				for (var k = 0; k < item.campos.length; k++) {
					var campo = item.campos[k];
					if (campo.objCampo) {
						var valor = campo.objCampo.foiAlterado();
						if (!temValorNaoVazio && valor.val && valor.val.length > 0 && valor.val != campo.valorInicial) temValorNaoVazio = true;
						
		// if (this.id == "descLista") log(i, k, campo.objCampo.id, valor.val, campo.objCampo);

						if (valor) {
							dadosCampoPai.push(valor);
							if ((!valor.val || valor.val.length == 0) && campo.vazioNaoGrava) {
								gravaItem = false;
								if (lista[i].id.toString().substr(0, 4) != "novo") excluiVazio.push(lista[i].id);
							}
							if (campo["tab"] && gravaItem) tabelasAlteradas[campo["tab"]] = true;
						}
					}
				}
				for (var idCampo in camposComGravaSeAlterouTabela) {
					if (tabelasAlteradas[camposComGravaSeAlterouTabela[idCampo]]) {
						var campo = item.camposID[idCampo];
						if (campo && campo.objCampo) {
							var valor = campo.objCampo.dadosGravacaoCampo();
							if (valor) dadosCampoPai.push(valor);
						}
					}
				}
				if (this.vazioNaoGrava && !temValorNaoVazio) gravaItem = false;
			}
			if (dadosCampoPai.length && gravaItem) {
				if (lista[i].id) listaCamposAlterados[lista[i].id] = dadosCampoPai;
				temItemAlterado = true;
			}
		}
		var temExclusao = false;
		if (this.exclusao && this.exclusao.tab) {
			if (!this.exclusaoIDs) this.exclusaoIDs = [];
			var excluirItens = { tab: this.exclusao.tab, ids: this.exclusaoIDs.concat(excluiVazio) };
			var temExclusao = (excluirItens.ids.length > 0);
		}
		if (this.naoGravaVazio) {
			for (var i = 0; i < listaCamposAlterados; i++) {
				
			}
		}
		if (temItemAlterado || temExclusao) {
			var dadosCampo = { "tab": this.tab, "cmp":  this.cmp, "val": listaCamposAlterados, "tipo": this.sqlTipo, "exclusao": excluirItens, "chv": this.chv, "qtd": lista.length };
			return dadosCampo;
		} else {
			return false;
		}		
	};

	CampoColecao.prototype.habilitaOriginal = CampoColecao.prototype.habilita;
	CampoColecao.prototype.habilita = function() {
		this.habilitaOriginal();
		var lista = this.lista;	
		for (var i = 0; i < this.lista.length; i++) {
			const item = this.lista[i].objItem;
			if (item) {
				for (var campo = 0, totCampos = item.campos.length; totCampos--; campo++) 
					if (!item.campos[campo].objCampo.mantemDesabilitado) item.campos[campo].objCampo.habilita();
			}
		}
		return this;
	};
	
	CampoColecao.prototype.desabilitaOriginal = CampoColecao.prototype.desabilita;
	CampoColecao.prototype.desabilita = function() {
		this.desabilitaOriginal();
		var lista = this.lista;	
		for (var i = 0; i < this.lista.length; i++) {			
			for (var campo = 0, totCampos = this.lista[i].objItem.campos.length; totCampos--; campo++) 
				if (this.lista[i].objItem.campos[campo].objCampo) this.lista[i].objItem.campos[campo].objCampo.desabilita();
		}
		return this;
	};
	
	CampoColecao.prototype.exibeOriginal = CampoColecao.prototype.exibe;
	CampoColecao.prototype.exibe = function(excetoCampos, exibeTitulos) {
		this.exibeOriginal();
		if (exibeTitulos && this.tituloDom) {
			var spans = this.tituloDom.find("span").show();
			for (var i in excetoCampos) spans.filter("." + i).hide();
		}
		var lista = this.lista;
		for (var i = 0; i < lista.length; i++) {
			var item = lista[i].objItem;
			if (item) for (var campo = 0, totCampos = item.campos.length; totCampos--; campo++) {
				if (!excetoCampos || !excetoCampos[item.campos[campo].id]) item.campos[campo].objCampo.exibe();
			}
		}
		return this;
	};
	
	CampoColecao.prototype.ocultaOriginal = CampoColecao.prototype.oculta;
	CampoColecao.prototype.oculta = function() {
		this.ocultaOriginal();
		var lista = this.lista;	
		for (var i = 0; i < this.lista.length; i++) {
			var item = this.lista[i].objItem;
			if (item) for (var campo = 0, totCampos = item.campos.length; totCampos--; campo++) item.campos[campo].objCampo.oculta();
		}
		return this;
	};
	
	CampoColecao.prototype.ocultaCampos = function(quaisCampos, ocultaTitulos) {
		if (!quaisCampos || quaisCampos.length == 0) return;
		if (ocultaTitulos && this.tituloDom) {
			var spans = this.tituloDom.find("span");
			for (var i in quaisCampos) spans.filter("." + i).hide();
		}
		var lista = this.lista;	
		for (var i = 0; i < this.lista.length; i++) {
			var item = this.lista[i].objItem;
			if (item) for (var campo = 0, totCampos = item.campos.length; totCampos--; campo++) {
				if (quaisCampos[item.campos[campo].id]) item.campos[campo].objCampo.oculta();
			}
		}
		return this;
	};
	
	CampoColecao.prototype.trocaTagOriginal = CampoColecao.prototype.trocaTag;
	CampoColecao.prototype.trocaTag = function() {
		this.trocaTagOriginal();
		this.editando = this.pai.editando;
		var funcao = (this.editando) ? "habilita" : "desabilita";
		var botIncluir;
		if (this.objBotoes) var botoes = this.objBotoes.listaBotoes;
		if (botoes) for (var i = 0, t = botoes.length; t--; i++) if (botoes[i].tipo == "incluir") { botIncluir = botoes[i].objBotao; break; }
		if (botIncluir) botIncluir[funcao]();
		for (var i = 0; i < this.lista.length; i++) if (this.lista[i].objItem) this.lista[i].objItem.trocaTag.call(this.lista[i].objItem);
	};
	
	CampoColecao.prototype.excluiItens = function() { 
		for (var i = this.lista.length - 1; i >= 0; i--) this.lista[i].objItem.excluiItem();
	};
	
	CampoColecao.prototype.validaCampo = function(avisos) {
		for (var i = 0; i < this.lista.length; i++) if (this.lista[i].objItem) {
			var campos = this.lista[i].objItem.camposID;
			for (idCampo in campos) {
				var esteCampo = campos[idCampo].objCampo;
				esteCampo.validaCampo.call(esteCampo, avisos);
			}
		}
		return avisos;
	};

	
	function ItemCampoColecao(atrib, pai) {
		this.pai = pai;
		for (var i in atrib) {
			this[i] = atrib[i];
		}
		this.perm = this.pai.perm;
		this.dadosOriginal = {};
		if (this.ajustaDadosItem) this.ajustaDadosItem();
		for (var i in this.dados) this.dadosOriginal[i] = this.dados[i];
		this.ehNovo = (this.dados.id && this.dados.id.toString().substring(0,4) == 'novo' && !this.dados.naoEhNovo);
		if (this.camposNovo && this.ehNovo) this.campos = this.camposNovo;
	}

	ItemCampoColecao.prototype.cria = function() { 
		this.li = this.pai.ul.appendChild(cria('li'));
		if (this.pai.mudaOrdem) colocaClasse(this.li, "mudaOrdem");
		
		this.pai.camposID = {};
		this.camposID = {};
		this.id = this.dados.id;
		if (this.antesMontarItem) this.antesMontarItem();
		for (var i = 0; i < this.campos.length; i++) {
			if (!this.campos[i].naoCria) {
				this.pai.camposID[this.campos[i].id] = this.campos[i];
				this.camposID[this.campos[i].id] = this.campos[i];
				var objetoCampo = eval(this.campos[i].tipo);
				var campoCriado = new objetoCampo(this.campos[i], this);			
				this.campos[i].objCampo = campoCriado;
				var objPermissao = this.pai.pai;
				if (!objPermissao.permissao) objPermissao = objPermissao.pai.pai; // se for um campoColecao dentro de outro campoColecao, sobe até o Cadastro
				if (!objPermissao.permissao('editar') || this.desabilitado) campoCriado.desabilitado = true;
				if (this.tip) campoCriado.tip = this.tip; // passa o tip do item da lista para o campo (sobrepõe o tip do campo)
				var divCampo = campoCriado.cria();
				if (divCampo) this.li.appendChild(divCampo);
				campoCriado.desfocaOriginal = campoCriado.desfoca;
				campoCriado.desfoca = function() {
					this.desfocaOriginal();
					this.pai.pai.desfocaColecao.call(this.pai.pai);
				};
			}
		}
		//apos ter criado os campos cria os botoes do Item
		this.botoes = this.pai.botoesItem;		
		if (this.id && this.id.toString().substring(0, 4) == "novo" && this.botoes) {
			for (var i = this.botoes.length - 1; i >= 0; i--) {
				if (this.botoes[i].tipo == "editar") this.botoes.splice(i,1);
			}
		}		
		this.onde = this.li;
		this.aba = this.pai.pai.aba;
		this.objBotoes = new clBotoes(this);
		this.onde.appendChild(cria('div', { className: 'limpa' }));

		// troca as tags dos campos para tags de visualização
		for (var i = 0, t = this.campos.length; t--; i++) if (this.campos[i].objCampo) this.campos[i].objCampo.trocaTag();
		// se for para começar editando, troca pela edição
		if (this.iniciaEditando || this.ehNovo) {
			this.editando = true;
			for (var i = 0, t = this.campos.length; t--; i++) this.campos[i].objCampo.trocaTag();
		}
		
		if (this.aposMontarItem) this.aposMontarItem();
		var esteItem = this;
		$(this.li).on('click', '.confirmaExclusao .sim', function(e) { e.preventDefault(); paraPropag(e); esteItem.excluiItem.call(esteItem); })
			.on('click', '.confirmaExclusao .nao', function(e) { e.preventDefault(); paraPropag(e); esteItem.cancelaExclusao.call(esteItem); });
		
		
		$(this.li).on('click', '.checkItem', function(e) { log(e) })
			return this.li;
	};
	
	ItemCampoColecao.prototype.trocaTag = function() {
		this.editando = this.pai.editando;
		var funcao = (this.editando) ? "habilita" : "desabilita";
		var botExcluir;
		var botoes = this.objBotoes.listaBotoes;
		if (botoes) for (var i = 0, t = botoes.length; t--; i++) if (botoes[i].tipo == "excluir") { botExcluir = botoes[i].objBotao; break; }
		if (botExcluir) botExcluir[funcao]();
		//item novo nao edita
		if (this.id && this.id.toString().substring(0, 4) == "novo") return;
		//for (var i = 0 ; i < this.campos.length; i++) this.campos[i].objCampo.trocaTag();	
		for (var i = 0; i < this.campos.length; i++) {
			var objCampo = this.campos[i].objCampo;
			if (objCampo) objCampo.trocaTag.call(objCampo);
			//if (objCampo && (objCampo.visu || !objCampo.cmp)) objCampo.trocaTag.call(objCampo);
		}
	};
	
	ItemCampoColecao.prototype.avolta = function() {	
		this.editando = false;		
		this.trocaTag();
		var volta = $(this.onde).find("a.voltar");
		var edita = $(this.onde).find("a.editar");
		volta.css("display","none");
		edita.css("display","block");		
	};
	
	ItemCampoColecao.prototype.edita = function() {	
		this.editando = true;
		this.trocaTag();
		var volta = $(this.onde).find("a.voltar");
		var edita = $(this.onde).find("a.editar");
		volta.css("display", "block");
		edita.css("display", "none");
	};
	
	ItemCampoColecao.prototype.testaExclusao = function() {
		if (this.pai && this.pai.eventos && this.pai.eventos.change) {
			var funcao = this.pai.eventos.change.funcao;
			if (this.pai[funcao]) this.pai[funcao]();
			else this.pai.pai[funcao]();
		}
		var html = "<div class='confirmaExclusao'><label>" + fnLang("confirma") + "</label><a href='#' class='sim'>" + fnLang("sim") + "</a><a href='#' class='nao'>" + fnLang("nao") + "</a></div>";
		this.divConfirma = $(html).appendTo(this.li).animate({ 'width': '97%' }, 200);
		if (this.pai.confirmaExclusao) this.pai.confirmaExclusao.call(this.pai, this);
	};
	
	ItemCampoColecao.prototype.desabilitaItem = function(acao) {
		var referenciaTamanho = this.li;
		var tamanho = $(referenciaTamanho).outerHeight();
		if (this.tampaPagtoClara) this.tampaPagtoClara.remove();
		this.tampaPagtoClara = $("<div class='tampaPagto'></div>").appendTo(referenciaTamanho);
		tiraClasse(this.li, "editando");
		var esteItem = this;
		if (acao == "edita" && !this.botEdita) this.botEdita = $("<a class='edita' title=" + fnLang("editaMensal") + "></a>").appendTo(this.li)
			.on("click", function() { esteItem.editaDesabilitado.call(esteItem); });
	};
	
	ItemCampoColecao.prototype.habilitaItem = function() {
		if (this.tampaPagtoClara) this.tampaPagtoClara.remove();			
	};
	
	ItemCampoColecao.prototype.editaDesabilitado = function() {
		var bot = this.botEdita;
		//var title = bot.attr("title");
		if (temClasse(this.li, "editando")) {
			this.desabilitaItem.call(this);
			tiraClasse(this.li, "editando");
		//	bot.attr("title", title.replace("volta aos valores desta", "edita esta"));
		} else {
			this.habilitaItem.call(this);
			colocaClasse(this.li, "editando");
		//	bot.attr("title", title.replace("edita esta", "volta aos valores desta"));
		}
	};
	
	ItemCampoColecao.prototype.cancelaExclusao = function() {
		this.divConfirma.animate({ 'width': '0' }, 200, function() { removeObj(this); })
		if (this.pai.cancelaExclusao) this.pai.cancelaExclusao.call(this.pai, this);
	};

	ItemCampoColecao.prototype.excluiItem = function() {
		var idExclusao = (this.pai.idExclusao) ? this.pai.idExclusao : "id";
		var id = this.dados[idExclusao];
		var campoColecao = this.pai;
		if (!campoColecao.exclusaoIDs) campoColecao.exclusaoIDs = [];
		if (id && id.toString().length > 0 && id.toString().slice(0, 4) != 'novo') campoColecao.exclusaoIDs.push(id);
		this.remove();
		campoColecao.verificaAlteracao();
		if (campoColecao.aposExcluir) campoColecao.aposExcluir.call(campoColecao, this);
	};
	
	ItemCampoColecao.prototype.alteraItem = function(dadosNovos) {
		var campos = this.camposID;		
		for (var i in campos) {
			var campo = campos[i].objCampo;
			if (campo.valor != dadosNovos[i]) {
				$(campo.campo).val(dadosNovos[i]);
				campo.atualiza.call(campo); 
			}
		}
	};		
	
	ItemCampoColecao.prototype.alteraCadaItem = function(dadosNovos) {	
		var campos = this.camposID;
		for (var i in campos) {
			var campo = campos[i].objCampo;
			if (typeof(dadosNovos[campo.id]) != "undefined") {
				if (campo.campo.childNodes.length == 0) campo.valor = dadosNovos[campo.id];
				$(campo.campo).val(dadosNovos[campo.id]);
				campo.atualiza.call(campo); 
			}
		}
		for (var i in dadosNovos) {
			this.dados[i] = dadosNovos[i];
		}
	};		
	
	ItemCampoColecao.prototype.remove = function() {
		var lista = this.pai.lista;
		var id = this.dados.id;
		for (var i = 0; i < lista.length; i++) {
			if (lista[i].id == id) { lista.splice(i, 1); break; }
		}
		$(this.li).animate({ "opacity": 0, "height": 0 }, 200, function() { removeObj(this) });
	}
}
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "arquivo"
// *******************************************************************************************************************************
function CampoArquivo (atrib, pai) { clCampo.call(this, atrib, pai); } {
	CampoArquivo.prototype = new clCampo;
	CampoArquivo.prototype.constructor = CampoArquivo;
	CampoArquivo.prototype.tipoCampo = 'arquivo';

	CampoArquivo.prototype.criaCampo = function() {
		var esteCampo = this;
		var valorOriginal = this.valorOriginal();
		var input = cria('input', { type: 'file', value: valorOriginal,
			onchange: function(e) { esteCampo.atualiza.call(esteCampo); esteCampo.arquivoSelecionado.call(esteCampo); }
		});
		if (esteCampo.disabled) { input.setAttribute('disabled', 'disabled'); }
		this.$campoVisu.html(valorOriginal);
		colocaClasse(this.elementoDiv, "arquivo");
		return input;
	};

	CampoArquivo.prototype.colocaValorOriginal = function(e) {
		var valorOriginal = this.valorOriginal();
		if (valorOriginal) {
			// https://stackoverflow.com/questions/47119426/how-to-set-file-objects-and-length-property-at-filelist-object-where-the-files-a/47172409#47172409
			var Arquivos = new DataTransfer();
			if (!Arquivos) Arquivos = new ClipboardEvent('').clipboardData; // firefox
			var itens = Arquivos.getData("items");
			var file;
			if (!navigator.msSaveBlob) { // detect if not Edge
			   file = new File(["original"], valorOriginal);
			} else {
				var file = new Blob(["original"], { type: 'text/css' });
				file.lastModifiedDate = new Date();
				file.name = valorOriginal;
			}
			Arquivos.items.add(file);
			this.campo.files = Arquivos.files;
			this.valor = valorOriginal;
		}
	};

	CampoArquivo.prototype.aposCriarCampo = function() {
		this.colocaValorOriginal();
	};

	CampoArquivo.prototype.trocaTagOriginal = CampoArquivo.prototype.trocaTag;
	CampoArquivo.prototype.trocaTag = function() {
		this.trocaTagOriginal();
		var div = $(this.elementoDiv);
		if (this.pai.editando && this.cmp && !this.naoEditavel) {
			// edita
			$("<input type='text' class='arquivo' value='" + this.$campoVisu.html() + "'/><label class='bot'>" + fnLang("procurar") + "</label>").appendTo(div);
			if (this.tamanhoMax != "naoTem") {
				this.tamanhoMax = 8300000; // quase 8Mb
				this.textoTamanhoMax = "máximo 8Mb";
				this.avisoTamanho = "tamanho acima do limite de 8,0Mb";
				this.spanTamanho = $("<span class='tamanho'>" + this.textoTamanhoMax + "</span>").appendTo(div);
			}
			this.titleOriginal = div.attr("title");
		} else {
			// visualiza
			div.find("label.bot, input.arquivo").remove();
			this.colocaValorOriginal();
		}
	};
	
	CampoArquivo.prototype.arquivoSelecionado = function() {
		$(this.elementoDiv).find("input.arquivo").val(this.valor.replace(/([^\\]*\\)*/, ""));
		this.mostraTamanho();
	};
	
	CampoArquivo.prototype.mostraTamanho = function() {
		if (!this.spanTamanho) return;
		const file = this.campo.files[0];
		this.elementoDiv.title = this.titleOriginal;
		this.spanTamanho.removeClass("acimaLimite");
		if (file) {
			const tamanho = file.size;
			this.spanTamanho.html(tamanhoArquivo(tamanho));
			if (tamanho > this.tamanhoMax) {
				this.spanTamanho.addClass("acimaLimite");
				this.elementoDiv.title = this.avisoTamanho;
			}
		} else {
			this.spanTamanho.html(this.textoTamanhoMax);
		}
	};
	
	CampoArquivo.prototype.validaEspecifico = function() {
		const file = this.campo.files[0];
		if (file && file.size > this.tamanhoMax) {
			this.colocaAvisoIndividual(this.avisoTamanho);
		} else {
			this.tiraAvisoIndividual(this.avisoTamanho);
		}
		return (temClasse(this.campo.parentNode, 'invalida')) ? { label: this.label,  aviso: this.avisoTamanho } : false;
	};
	
	CampoArquivo.prototype.nomeArquivo = function() {
		var valor = this.valor;
		valor = valor.substring(valor.replace(/\\/g,'/').lastIndexOf('/')+1, valor.length);
		return valor;
	};
	
	CampoArquivo.prototype.foiAlterado = function() {
		if (this.valor != this.valorOriginal()) return { "tab": this.tab, "cmp": this.cmp, "val": this.valor, "tipo": "arquivo" };
		else return false;
	};

	CampoArquivo.prototype.pegaValor = function(testaObrigatorio) {
		if (testaObrigatorio) return this.valor;
		else return this.campo.value;
	};
}
// ********************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "imagem" - usa a classe imagens para gerenciar a biblioteca de imagens da escola
// *******************************************************************************************************************************
function CampoImagem (atrib, pai) { CampoTexto.call(this, atrib, pai);} {
	CampoImagem.prototype = new CampoTexto;
	CampoImagem.prototype.constructor = CampoImagem;
	CampoImagem.prototype.tipoCampo = 'imagem';

	CampoImagem.prototype.aposCriarCampo = function() {
		var esteCampo = this;
		this.campo.type = "hidden";
		var div = $(this.elementoDiv);
		div.addClass("campoImagem");
		$("<a class='imgTroca' title=" + fnLang("alterarImagem") + "></a>").appendTo(div).on("click", function() { esteCampo.trocaFoto.call(esteCampo) });
		if (!this.semExcluirImagem) 
			$("<a class='imgExclui' title=" + fnLang("excluirImagem") + "></a>").appendTo(div).on("click", function() { esteCampo.excluiFoto.call(esteCampo) });
		if (this.aposAlterarImagem) this.aposAlterarImagem.call(this);
	};

	CampoImagem.prototype.excluiFoto = function() {
		if (this.desabilitado) return;
		if (this.idLocal) limpaConteudo(obj(this.idLocal));
		this.colocaValor("");
		if (this.aposAlterarImagem) this.aposAlterarImagem.call(this);
		$(this.campo).change();
	};

	CampoImagem.prototype.trocaFoto = function() {
		if (this.desabilitado) return;
		if (this.ondeColoca) {
			imagens.ondeColoca = this.ondeColoca;
		} else if (this.idLocal) {
			imagens.ondeColoca = obj(this.idLocal);
		}
		if(this.urlCompleta) imagens.urlCompleta = true;
		imagens.objCampo = this;
		imagens.abreDialog.call(this);
	};
	
	CampoImagem.prototype.fechaImagens = function() {
		$(this.campo).change();
		if (this.aposTrocarImagem) this.aposTrocarImagem.call(this);
	};

}   
// *******************************************************************************************************************************


// *******************************************************************************************************************************
// campo do tipo "slide" - usa um slide para retornar um valor numérico
// *******************************************************************************************************************************
function CampoSlide (atrib, pai) { CampoNumerico.call(this, atrib, pai);} {
	CampoSlide.prototype = new CampoNumerico;
	CampoSlide.prototype.constructor = CampoSlide;
	CampoSlide.prototype.tipoCampo = 'slide';

	CampoSlide.prototype.aposCriarCampo = function() {
		const esteCampo = this;
		if (!this.mostraInput) this.campo.type = "hidden";
		const params = {
			slide: function(event, ui) { esteCampo.alteraSlide.call(esteCampo, ui) }
		};
		this.divSlide = $("<div class='campoSlide'></div>").appendTo(this.elementoDiv).slider(params);
		if (this.colocarLabel) this.colocarLabel.call(this);
		if (this.labelEsq) $("<label class='esq'>" + this.labelEsq + "</label>").insertBefore(this.divSlide);
		if (this.labelDir) $("<label class='dir'>" + this.labelDir + "</label>").insertAfter(this.divSlide);
		this.trataCampo();
	};
	
	CampoSlide.prototype.alteraSlide = function(ui) {
		// valor padrão do slide é de 0 a 100
		const valorPercent = ui.value;
		const valorIni = (this.valorIni) ? this.valorIni : 0;
		const valorFim = (this.valorFim) ? this.valorFim : 100;
		const valor = valorIni + (valorPercent * (valorFim - valorIni) / 100);
		this.colocaValor(valor);
		if (this.mexeuSlide) this.mexeuSlide.call(this);
	};

	CampoSlide.prototype.trataCampo = function() {
		if (this.divSlide) this.divSlide.slider("value", this.valor);
	};
	
	CampoSlide.prototype.habilitaOriginal = CampoSlide.prototype.habilita;
	CampoSlide.prototype.habilita = function() {
		this.habilitaOriginal();
		if (this.divSlide) this.divSlide.slider("enable");
	};
	
	CampoSlide.prototype.desabilitaOriginal = CampoSlide.prototype.desabilita;
	CampoSlide.prototype.desabilita = function() {
		this.desabilitaOriginal();
		if (this.divSlide) this.divSlide.slider("disable");
	};

}   
// *******************************************************************************************************************************

// *******************************************************************************************************************************
// campo do tipo "botão liga/desliga"
// *******************************************************************************************************************************
function CampoBotOnOff (atrib, pai) { CampoNumerico.call(this, atrib, pai) } {
	CampoBotOnOff.prototype = new CampoNumerico;
	CampoBotOnOff.prototype.constructor = CampoBotOnOff;
	CampoBotOnOff.prototype.tipoCampo = 'onOff';

	CampoBotOnOff.prototype.aposCriarCampo = function() {
		const esteCampo = this;
		this.campo.type = "hidden";
		const div = $(this.elementoDiv).addClass("onOff");
		$("<span class='bot'></span>").appendTo(div);
		div.on("click", function() { esteCampo.troca.call(esteCampo) });
		div.addClass((this.valorOriginal() > "0") ? "ligado" : "desligado");
	};

	CampoBotOnOff.prototype.troca = function() {
		const div = $(this.elementoDiv);
		if (div.hasClass("ligado")) {
			div.removeClass("ligado").addClass("desligado");
			this.colocaValor(0);
		} else {
			div.removeClass("desligado").addClass("ligado");
			this.colocaValor(1);
		}
	}
}
// *******************************************************************************************************************************

// *******************************************************************************************************************************
// campo do tipo "botão liga/desliga"
// *******************************************************************************************************************************
function CampoBotEsqDir (atrib, pai) { CampoBotOnOff.call(this, atrib, pai) } {
	CampoBotEsqDir.prototype = new CampoBotOnOff;
	CampoBotEsqDir.prototype.constructor = CampoBotEsqDir;
	CampoBotEsqDir.prototype.tipoCampo = 'esqDir';

	CampoBotEsqDir.prototype.aposCriarCampoOriginal = CampoBotEsqDir.prototype.aposCriarCampo;
	CampoBotEsqDir.prototype.aposCriarCampo = function() {
		this.aposCriarCampoOriginal();
		$(this.elementoDiv).addClass("esqDir");
	};
}
// *******************************************************************************************************************************

