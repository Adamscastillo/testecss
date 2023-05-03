<!--#include file="topo.asp"-->

<%
call langBusca(array(7,125,128,129,130,135,137,190,212,221,222,240,248,335,505,567,639,640,641,1672,1775,1838,1839,1840,1841,1842,1843,1844,1845,1846,1847,1848,1849,1850,1851,1862,3918,4677,4679,4680,4681,4682,4683,4684,4685,4686,4687,4688,4689,4690,4691,4692,4693,4694,4695,4696,4697,4698,4699,4700,4701,4702,4703,4704,4705,4706,4707,4708,4709,4710,4711,4712,4713,4714,4715,4716,4717,4718,4719,4720,4721,4722,4723,4724,4725,4726,4727,4728,4729))

dim idcandselecao, divClear
idcandselecao = clng("0"&request.querystring("idcandsel"))
'response.end
if quem(6,0) = 1 and quem(4,0) <> 7 then response.redirect("ativ_faz.asp?pag=12")

if quem(4,0) = 7 and idcandselecao > 0 then response.redirect("ativ_faz.asp?pag=12&idcandsel=" & idcandselecao)

if quem(4,0) = 7 then response.redirect("ativ_cad.asp?pag=12")

dim ativ, tipo, cat, aulas


'Variaveis que vão guardar os elementos HTML
dim ico_ativTipoTeste1, ico_ativTipoQuest2, ico_ativTipoTexto4, span_ativnome, span_ativnomePub, span_cat
dim span_tempoCom, span_tempoSem, span_result, span_indicCom, span_indicSem, span_resultVe, span_resultNaoVe
dim img_edit, img_mostra, img_novAltNaoLib, img_novAltLib, img_graf, img_excl


'******	recupera dados do banco	***********
call buscabd(cat,0,-1,"SELECT ativ_cat.id_cat, ativ_cat.nome FROM ativ_cat WHERE id_esc = " & id & " " &_
		"AND ativ_cat.online = 1 ORDER BY nome")

' ativ = 0.id_ativ, 1.nome, 2.tipo_nome, 3.tempo, 4.publica, 5.result, 6.cont_id_licen , 7.feito, 8.id_tipoativ 9.cat_nome
ativ = "SELECT ativ.id_ativ, ativ.nome, COALESCE(nome.texto, nomePort.texto, ativ_tipo.nome) AS nome, tempo, CAST(publica AS int), " &_
	"CAST(result AS int), count(licenca.id_licen), count(feito), ativ.id_tipoativ, ativ_cat.nome " &_
	"FROM ativ LEFT JOIN ativ_tipo ON ativ_tipo.id_tipoativ = ativ.id_tipoativ " &_
	"LEFT JOIN lang_trad AS nome ON nome.id_lang = ativ_tipo.nomeLang AND nome.id_idi = " & quem(16, 0) & " " &_
	"LEFT JOIN lang_trad AS nomePort ON nomePort.id_lang = ativ_tipo.nomeLang AND nomePort.id_idi = 3 " &_
	"LEFT JOIN ativ_lic ON ativ_lic.id_ativ = ativ.id_ativ LEFT JOIN licenca " &_
	"ON licenca.id_licen = ativ_lic.id_licen AND (licenca.excl IS null OR licenca.excl = 0) LEFT JOIN ativ_cat ON ativ_cat.id_cat = ativ.id_cat " &_
	"WHERE ativ.id_esc = " & id &_
	" AND ativ.id_tipoativ <> 5 AND (ativ.offline IS null OR ativ.offline = 0)"

	
if len(ft(0)) > 0 then ativ = ativ & " AND ativ.nome LIKE '%" & ft(0) & "%'"	
if len(ft(2)) > 0 then ativ = ativ & " AND ativ.id_tipoativ = " & ft(2)
if len(ft(3)) > 0 then ativ = ativ & " AND ativ.id_cat = " & ft(3)
ativ = ativ & " GROUP BY ativ.id_ativ, ativ.nome, nome.texto, nomePort.texto, ativ_tipo.nome, tempo, publica, result, " &_
		"estat, ativ.id_tipoativ, ativ_cat.nome ORDER BY ativ.nome"

call buscabd(ativ,0,-1,ativ)		
call buscabd(tipo,0,-1,"SELECT ativ_tipo.id_tipoativ, COALESCE(nome.texto, nomePort.texto, ativ_tipo.nome) AS nome FROM ativ_tipo " &_
	"LEFT JOIN lang_trad AS nome ON nome.id_lang = ativ_tipo.nomeLang AND nome.id_idi = " & quem(16, 0) & " " &_
	"LEFT JOIN lang_trad AS nomePort ON nomePort.id_lang = ativ_tipo.nomeLang AND nomePort.id_idi = 3 " &_
	"WHERE ativ_tipo.online = 1 ORDER BY COALESCE(nome.texto, nomePort.texto, ativ_tipo.nome)")

%><!--#include file="cnxfecha.asp"-->
<!--#include file="ativ_func.asp"--><%

for i = 0 to ubound(tipo, 2)
	tipo(1, i) = server.HTMLEncode("" & tipo(1, i))
next
for i = 0 to ubound(cat, 2)
	cat(1, i) = server.HTMLEncode("" & cat(1, i))
next

'******** Filtros e Título *************
	txtft(0) = ftInp(0, fnLang("nomeAtiv"), 200, fnLang("nome"))
	txtft(2) = ftSel(2, fnLang("tipoAtiv"), 200, tipo, 0, "o", 2, fnLang("tipo"), "")
	txtft(3) = ftSel(3, fnLang("categoria"), 200, cat, 0, "o", 2, fnLang("categoria"), "")
response.write linhaTitulo(titulo, quem(1,0), txtft, 300)


'CSS
response.write "<link rel='stylesheet' type='text/css' href='ativ.css?vs=18110803' />"


'Lista de atividades 'ulativ'
response.write	"<ul id='ulativ'>" & liTop(ativ, 0) 

	'Elementos do html fixos (que independem da atividade)
	ico_ativTipoTeste1 = "<img src='img/ico_ativ1.gif' class='icoAtiv' title='" & fnLang("tipoAtiv") & ": " & fnLang("teste") & "' />"
	ico_ativTipoQuest2 = "<img src='img/ico_ativ2.gif' class='icoAtiv' title='" & fnLang("tipoAtiv") & ": " & fnLang("questionario") & "' />"
	ico_ativTipoTexto4 = "<img src='img/ico_ativ4.gif' class='icoAtiv' title='" & fnLang("tipoAtiv") & ": " & fnLang("texto") & "' />"
	span_tempoSem = "<span class='tempo' title='" & fnLang("tempoParaRealiz") & "'>" & fnLang("semLimite") & "</span>"
	span_resultVe = "<span class='resultVe'>" & fnLang("veResult") & "</span>"
	span_resultNaoVe = "<span class='resultNaoVe'>" & fnLang("naoVeResult") & "</span>"
	span_indicSem = "<span title='" & fnLang("aindaSemIndic") & "' class='indic'>0 " & fnLang("indicacoes") & "</span>"
	img_edit = "<img src='img/ico_edit.gif' class='edit' alt='" & fnLang("editarAtiv") & "' />"
	img_mostra = "<img src='img/ico_mostra1.gif' class='mostra' alt='" & fnLang("visuAtivAluno") & "' />"
	img_graf = "<img src='img/ico_graf.gif' class='graf' alt='" & fnLang("estatAtiv") & "' />"
	img_novAltNaoLib = "<img class='novalt desab' src='img/ico_novalt2.gif' alt='" & fnLang("ativNaoLiberada") & "' />" 
	img_novAltLib = "<img class='novalt' src='img/ico_novalt.gif' alt='" & fnLang("indicAtivGrupo") & "' />" 				
	img_excl = "<img id='img_exclui' src='img/ico_excl.gif' class='excl' alt='" & fnLang("excluirAtiv") & "' />"
	divClear = "<div style='clear: both'></div>"

for i = 0 to ubound(ativ,2)
	' ajusta os textos
	ativ(1, i) = server.HTMLEncode(trim("" & ativ(1, i))) ' nome
	ativ(2, i) = server.HTMLEncode(trim("" & ativ(2, i))) ' tipo
	ativ(9, i) = server.HTMLEncode(trim("" & ativ(9, i))) ' cat
	
	' nome da categoria
	if len(trim(""&ativ(9,i))) = 0 then ativ(9,i) = "&nbsp;"
	'Elementos do html (variáveis de acordo com cada atividade)
	span_ativnome = "<span title='" & fnLang("ativNaoPublicada") & "' class='ativnome'>" & ativ(1,i) & "</span>"
	span_ativnomePub = "<span title='" & fnLang("ativPublicada") & "' class='ativnomePub'>" & ativ(1,i) & "</span>"
	span_cat = "<span title='" & fnLang("categoria") & "' class='cat'/>" & ativ(9,i) & "</span>"
	span_tempoCom = "<span class='tempo' title='" & fnLang("tempoParaRealiz") & "'>" & ativ(3,i) & " " & fnLang("minAbrev") & "</span>"
	span_indicCom = "<span title='" & cint("0"&ativ(6,i)) & " " & fnLang("indicSendo") & " " &_
				cint("0"&ativ(7,i)) & " " & fnLang("jaRealizadas") & "' class='indic'>" & cint("0"&ativ(6,i)) & " " & fnLang("indicacoes") & "</span>"
	
	'verifica se existem aulas com atividade desenvolvida
	if len(""&ativ(4,i)) > 60 then j = left(ativ(4,i),56) & " ..." else j = ativ(4,i)
	if clng("0"&ativ(5,i)) > 0 then aulas = "<img src='img/ico_result_.gif' class='result' " &_
			"alt='" & fnLang("aulasComAtiv") & "' />" & ativ(5,i) else aulas = ""
			
	response.write "<li id='ativ_" & ativ(0,i) & "' class='listativ'>" 
	
	'Verifica qual o tipo de atividade e insere o elemento apropriado
	if cint("0"&ativ(8,i)) = 1 then response.write ico_ativTipoTeste1
	if cint("0"&ativ(8,i)) = 2 then response.write ico_ativTipoQuest2
	if cint("0"&ativ(8,i)) = 4 then response.write ico_ativTipoTexto4	

	'Verifica se a atividade é publica ou não e insere o elemento apropriado
	if cint("0"&ativ(4,i)) = 0 then response.write span_ativnome else response.write span_ativnomePub 
	
	'Insere o span de 'categoria'
	response.write span_cat
	
	'verifica se tem limite de tempo e insere o elemento adequado
	if ativ(3,i) then response.write span_tempoCom else response.write span_tempoSem

	'verifica a flag 'resultado' e insere o elemento adequado
	if cint("0"&ativ(5,i)) = 0 then response.write span_resultNaoVe else response.write span_resultVe 	

	'verifica se tem indicações ou não
	if cint("0"&ativ(6,i)) > 0 then response.write span_indicCom else response.write span_indicSem
	
	'insere o icone 'editar atividade'
	if quem(5,0) >= 2 then response.write img_edit
	
	'insere o icone 'visualizar como o aluno verá a atividade'
	response.write	img_mostra
	
	'insere o icone 'estatisticas'
	response.write img_graf
	
	'Testa se é possivel fazer indicações e insere o elemento apropriado
	if cint("0"&ativ(4,i)) = 0 then response.write img_novAltNaoLib else response.write img_novAltLib 
	
	'insere o icone 'excluir'
	if quem(5,0) >= 4 then response.write img_excl
	
	response.write divClear & "</li>"	

next

response.write	"</ul>" &_
			"</body>" &_
		"</html>" 
'_____________________________________________________________

					
				
%>
<script language='javascript' type='text/javascript' src='ativ_func.js'></script>
<script>



adicionaEvento(this, 'load', function() { inicio(0) });
	
function ativnov() 
{ 
	ativabre(0) 
}
	
function ativabre(idativ) 
{
	path = 'ativ_edit.asp?ativ=' + idativ + '&txttop=<%=request.querystring("txttop")%>&id=<%=id%>';
	param = 'location=no,scrollbars=yes,width=650,height=470,top=10,left=10';
	janela = window.open(path,'apoio',param);
	janela.focus();
}



function editaLinha(dados)
{
	var li = obj('ativ_' + dados[5]);
	
	//Tipo 'teste'
	if(dados[0] == 1)
	{
		
		li.childNodes[0].className = li.childNodes[0].className + ' ativTipo1';
		li.childNodes[0].title = '<%= fnLang("tipoAtiv") %>: <%= fnLang("teste") %>';
	}
	
	//Tipo 'questionario'
	if(dados[0] == 2)
	{
		li.childNodes[0].className = li.childNodes[0].className + ' ativTipo2';
		li.childNodes[0].title = '<%= fnLang("tipoAtiv") %>: <%= fnLang("questionario") %>';
	}	

	//Tipo 'texto'
	if(dados[0] == 4)	
	{
		li.childNodes[0].className = li.childNodes[0].className + ' ativTipo4';
		li.childNodes[0].title = '<%= fnLang("tipoAtiv") %>: <%= fnLang("texto") %>';
	}	
	
	//Verifica se a atividade está marcada como "Publica" e muda o Span com 'nome da atividade' e 
	//icone de 'publica' ou 'não publica'
	if(dados[1])
	{	
		li.childNodes[1].className = 'ativnomePub';
		li.childNodes[1].title = '<%= fnLang("ativPublic") %>';
		li.childNodes[1].firstChild.nodeValue = dados[2];
	}
	else
	{	
		li.childNodes[1].className = 'ativnome';
		li.childNodes[1].title = '<%= fnLang("ativNaoPublic") %>';
		li.childNodes[1].firstChild.nodeValue = dados[2];
	}
	
	//Span com 'nome da categoria' e icone de categoria
	if(li.childNodes[2].firstChild)
	{
		li.childNodes[2].firstChild.nodeValue = dados[3];
	}
	else
	{
		li.childNodes[2].appendChild(cria('txt',dados[3]));
	}
	
	//Testa se tem tempo e cria o Span de 'tempo'
	if(dados[4])
	{
		li.childNodes[3].firstChild.nodeValue = dados[4] + ' <%= fnLang("minAbrev") %>';
	}
	else
	{
		li.childNodes[3].firstChild.nodeValue = '<%= fnLang("semLimite") %>';
	}
	
	//Span de 'vê resultado' ou 'não ve resultado'
	if(dados[6])
	{
		li.childNodes[4].className = 'resultVe';
		li.childNodes[4].firstChild.nodeValue = '<%= fnLang("veResult") %>';
	}
	else
	{
		li.childNodes[4].className = 'resultNaoVe';
		li.childNodes[4].firstChild.nodeValue = '<%= fnLang("naoVeResul") %>';
	}
	
}

function criaLinha(dados) 
{	
	var quant;
	if(obj('total').hasChildNodes() && obj('total').childNodes)
	{	
		quant = obj('total').firstChild.nodeValue;
		quant = (quant.length == 0) ? 1 : parseInt(quant.substring(0,quant.indexOf(' '))) + 1;
		quant += (quant > 1) ? ' <%= fnLang("atividades") %>' : ' <%= fnLang("atividade") %>';
		obj('total').firstChild.nodeValue = quant;
	}
	else
	{
		obj('total').appendChild(cria('txt','1 <%= fnLang("atividade") %>'));
	}
	colocaClasse(obj('semAtiv'),'some');
	var ul = obj('ulativ');
	var li = cria('li',{ id: 'ativ_' + dados[5], className: 'listativ' },null,null);
	ul.insertBefore(li,ul.firstChild.nextSibling);
	//Tipo 'teste'
	if(dados[0] == 1)
		li.appendChild(cria('span',{ className: 'ativTipo1', title: '<%= fnLang("tipoAtiv") %>: <%= fnLang("teste") %>' },null,null));
	
	//Tipo 'questionario'
	if(dados[0] == 2)
		li.appendChild(cria('span',{ className: 'ativTipo2', title: '<%= fnLang("tipoAtiv") %>: <%= fnLang("questionario") %>' },null,null));
		
	
	//Tipo 'texto'
	if(dados[0] == 4)	
		li.appendChild(cria('span',{ className: 'ativTipo4', title: '<%= fnLang("tipoAtiv") %>: <%= fnLang("texto") %>' },null,null));
		
	
	//Verifica se a atividade está marcada como "Publica" e cria o Span com 'nome da atividade' e 
	//icone de 'publica' ou 'não publica'
	if(dados[1])
		li.appendChild(cria('span',{ className: 'ativnomePub', title: '<%= fnLang("ativPublic") %>' },null,dados[2]));
	else
		li.appendChild(cria('span',{ className: 'ativnome', title: '<%= fnLang("ativNaoPublic") %>' },null,dados[2]));
	
	//Span com 'nome da categoria' e icone de categoria
	li.appendChild(cria('span',{ className: 'cat', title: '<%= fnLang("categoria") %>' },null,dados[3]));
	
	//Testa se tem tempo e cria o Span de 'tempo'
	if(dados[4])
	li.appendChild(cria('span',{ className: 'tempo' },null,dados[4] + ' <%= fnLang("minAbrev") %>'));
	else
	li.appendChild(cria('span',{ className: 'tempo' },null,'<%= fnLang("semLimite") %>'));
	
	//Span de 'vê resultado' ou 'não ve resultado'
	if(dados[6])
	li.appendChild(cria('span',{ className: 'resultVe' },null,'<%= fnLang("veResult") %>'));
	else
	li.appendChild(cria('span',{ className: 'resultNaoVe' },null,'<%= fnLang("naoVeResult") %>'));
	
	//Span de 'sem indicações'
	li.appendChild(cria('span',{ className: 'indic', title: '<%= fnLang("aindaSemIndic") %>' },null,'0 <%= fnLang("indicacoes") %>'));
	
	//Span de 'edit'
	var img = li.appendChild(cria('img',{ src: 'img/ico_edit.gif', className: 'edit', alt: '<%= fnLang("editarAtiv") %>' },null,null));
	adicionaEvento(img,'click',ativedit);
	adicionaEvento(img,'mouseover',passa);
	adicionaEvento(img,'mouseout',passa);
	
	
	var img = li.appendChild(cria('img',{ src: 'img/ico_mostra1.gif', className: 'mostra', alt: '<%= fnLang("visuAtivAluno") %>' },null,null));
	adicionaEvento(img,'click',ativvisu);
	adicionaEvento(img,'mouseover',passa);
	adicionaEvento(img,'mouseout',passa);
	
	
	var img = li.appendChild(cria('img',{ src: 'img/ico_graf.gif', className: 'graf', alt: '<%= fnLang("estatAtiv") %>' },null,null));
	adicionaEvento(img,'click',ativestat);
	adicionaEvento(img,'mouseover',passa);
	adicionaEvento(img,'mouseout',passa);
	
	if(dados[1])
	{
		var img = li.appendChild(cria('img',{ title: '<%= fnLang("indicAtivGrupo") %>', src: 'img/ico_novalt.gif', className: 'novalt' },null,null));
		adicionaEvento(img,'click',indicgrupo);
		adicionaEvento(img,'mouseover',passa);
		adicionaEvento(img,'mouseout',passa);
	}
	else
	{
		var img = li.appendChild(cria('img',{ title: '<%= fnLang("ativNaoLiberada") %>', src: 'img/ico_novalt.gif', className: 'novalt' },null,null));
		desabilitaBot(img);
	}
	

	
	var img = li.appendChild(cria('img',{ src: 'img/ico_excl.gif', className: 'excl', alt: '<%= fnLang("excluirAtiv") %>' },null,null));
	adicionaEvento(img,'click',function() { ativexcl(0) });
	adicionaEvento(img,'mouseover',passa);
	adicionaEvento(img,'mouseout',passa);
	
	
}

function ativvisu() 
{
	
	li = origemEvento('LI',arguments[0]);
	ativ = li.id.substring(5,li.id.length);
	path = 'ativ_visu.asp?ativ=' + ativ + '&txttop=<%=request.querystring("txttop")%>&id=<%=id%>&vs=20020307';
	param = 'location=no,scrollbars=yes,width=650,height=470,top=10,left=10';
	janela = window.open(path,'apoio',param);
	janela.focus();
}

function ativestat() 
{
	li = origemEvento('LI',arguments[0]);
	ativ = li.id.substring(5,li.id.length);
	path = 'ativ_estat_fr.asp?ativ=' + ativ + '&txttop=<%=request.querystring("txttop")%>&id=<%=id%>';
	param = 'location=no,scrollbars=yes,width=650,height=470,top=10,left=10';
	janela = window.open(path,'apoio',param);
	janela.focus();
}

	
function indicgrupo()
{
	li = origemEvento('LI',arguments[0]);
	var idativ = li.id.substring(5,li.id.length);
	url = 'ativ_indic.asp?txttop=<%= request.querystring("txttop") %>&idativ=' + idativ;
	param = 'toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,' +
		'width=415,height=180,top=50,left=50';
	janela = window.open(url,'indicativ',param);
	janela.focus();
}


function ativexcl(num) {
	var tr = origemEvento('TR');
	var txt = '';
	tr.bgColor = 'red';
	txt = (num == 1) ? txt + "<%= fnLang("confirmExclAtiv") %>" 
		: "<%= fnLang("todasRespSeraoExcluidas") %>!\n\n<%= fnLang("desejaExcluirAtiv") %>"
	if (confirm(txt)) {
		ativ = tr.id.substring(5,tr.id.length);
		path = 'ativ_excl.asp?ativ=' + ativ + '&txttop=<%=request.querystring("txttop")%>';
		param = 'location=no,scrollbars=yes,width=30,height=30,top=10,left=10';
		janela = window.open(path,'apoio',param);
	} else { tr.bgColor = '' }
}


	
</script>
