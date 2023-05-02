<?php
	header("Access-Control-Allow-Origin: *");
	header('Access-Control-Allow-Methods: GET, POST');
	header("Content-Type: text/html; charset=UTF-8", true);

	//echo chr(10) . "POST = " . json_encode($_POST) . chr(10) . chr(10);
	//echo chr(10) . "getContents = " . file_get_contents('php://input') . chr(10) . chr(10);
	$debug = (isset($_GET["debug"]) && $_GET["debug"] == "1");
	if (sizeof($_POST) == 0) $input = json_decode(file_get_contents('php://input'));
	else $input = (object) $_POST;
	if ($input == null) {
		parse_str(file_get_contents('php://input'), $input);
		$input = (object) $input;
	}
	if ($debug) echo chr(10) . "<br />" . "input = " . json_encode($input) . "<br /><br />" . chr(10) . chr(10);
	$acaoAPI = (isset($input->acao)) ? filter_var($input->acao, FILTER_SANITIZE_STRING) : "";
	$token = (isset($input->token)) ? filter_var($input->token, FILTER_SANITIZE_STRING) : "";
	$origem = "API";
	$_POST["origem"] = $origem;
	include ('../interno/session/funcoes_session.php');
	$idEsc = $cnx->campoBD("0", "SELECT escola.id_esc FROM escola 
		WHERE sys.fn_varbintohexsubstring(0, HashBytes('SHA1', 'KAITS*&API*&' + escola.token + CAST(escola.id_esc AS nvarchar)), 1, 0) = ?", [ $token ]);
	if ($idEsc == 0) retornaErro("Token inválido. Por favor confira o API token de sua escola.");
	// faz o login como usuário "Sistema KAITS" (id_licenca = 135392) para poder criar uma sessão e permitir todo acesso, ao final faz o logout desta sessão
	$idLicenSistemaKaits = 135392; // responsável pela inserção dos dados (Sistema Kaits)
	$idUsuSistemaKaits = $cnx->campoBD("NULL", "SELECT licenca.id_usu FROM licenca WHERE licenca.id_licen = $idLicenSistemaKaits");
	$idSession = session_inicializa($idLicenSistemaKaits, $idEsc, null, null, $origem);
	$_COOKIE["kaits"] = $idSession;
	$numMatric = (isset($input->numMatric)) ? filter_var($input->numMatric, FILTER_SANITIZE_STRING) : "";
	$idSit = (isset($input->idSit)) ? filter_var($input->idSit, FILTER_SANITIZE_STRING) : "";
	$_GET['idPagina'] = "40"; //seta o id da página para 40 (pagina de alunos)
	include ('../interno/func/grava_funcoes.php');
	include ('../interno/func/grava_matric.php');
	$grava = true;
	
// Somente campos obrigatórios { "nome" : "Teste áéíóú", "cpf" : "16410420870", "email" : "teste@gmail.com", "foneRes" : "39383047", "idTurm":"247824","id_padrao":"6058", "idTaxa":"6056"}
// { "nome": "KAITS teste", "nasc": "01/03/2001", "genero": "feminino", "cpf": "16410420870", "email": "sergiotregier@kaits.com.br", "foneRes": "39383047", "foneCel": "96587-4569", "estado": "SP", "cidade": "são paulo", "rua": "guihei vatanabe", "num": "281", "compl": "", "bairro": "vila progredidor", "cep": "05985-888", "idTurm": "88372", "idTaxa": "5821" }
// { "resp": "TesteResp", "nascResp": "01/03/2019", "generoResp": "feminino", "cpfResp": "16410420870", "emailResp": "testeResp@gmail.com", "foneResResp": "39383047", "foneCelResp": "96587-4569", "estadoResp": "SP", "cidadeResp": "são paulo", "ruaResp": "guihei vatanabe", "numResp": "281", "complResp": "", "bairroResp": "vila progredidor", "cepResp": "05985-888" }

/* token fun: 605cc08e990fdc00a4035adf2b8b4b4fbf2af5dd
 usu:
{
  "nome": "Teste",
  "nasc": "11/05/1998",
  "cpf": "30644642483",
  "email": "teste@teste.com",
  "foneRes": "23140989",
  "idTurm": "87268",
  "idTaxa": "17271"
}
*/

	if ($acaoAPI == "matricula") {
		echo json_encode(cadastroUsu());
	} else if ($acaoAPI == "moviment") {
		echo json_encode(retornaMoviment());
	} else if ($acaoAPI == "matriculaCURL") {
		/*
		//$url = 'localhost/kaits/integra/matriculas.php';
		$url = 'https://api.kaits.com.br/matriculas/';
		$dados = [
			"token" => "76e42c0dd27b371c168b700e50d3eb122cb7c289",
			"acao" => "matricula",
			"usu" => [
				"nome" => "Aluno de teste",
				"email" => "arturdealmeidaribeiro22@gmail.com",
				"foneRes" => "1128546482",
				"idTurm" => 368019,
				"idTaxa" => 17260,
				"foneCel" => "11980987905",
				"estado" => "São Paulo",
				"cidade" => "SP", 
				"rua" => "Rua Ushi kamia",
				"num" => "110",
				"compl" => "Ap 83",
				"bairro" => "Vila Albertina",
				"cep" => "02353150"
			]
		];
		$jsonPost = http_build_query($dados);
		$ch = curl_init();
		curl_setopt($ch, CURLOPT_URL, $url);
		curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "POST");
		curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonPost);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
		curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
		curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Length: ' . strlen($jsonPost)]);
		//echo "getinfo = " . json_encode(curl_getinfo($ch)) . "<br /><br />";
		//echo "error = " . curl_error($ch) . "<br /><br />";
		$resultado = curl_exec($ch);
		curl_close($ch);
		echo $resultado;
		*/
	} else if ($acaoAPI == "modalidades") {
		$retorno = $cnx->buscaAssoc("SELECT estagio_modalidade.id_modal AS [idModalidade], estagio_modalidade.nome AS [nome] 
			FROM estagio_modalidade 
			WHERE estagio_modalidade.id_esc = $idEsc AND estagio_modalidade.id_aplicModal = 4 
			ORDER BY estagio_modalidade.nome");
		if(sizeof($retorno) <= 0) retornaErro("Não existem modalidades de matrícula cadastradas pela escola");
		echo json_encode(["sucesso" => "1", "modalidades" => $retorno]);
	} else if ($acaoAPI == "situacao") {
		$avisos = [];
		if (strlen($numMatric) == 0) array_push($avisos, 'Por favor informe o número da matrícula (numMatric)');
		if (strlen($idSit) == 0) array_push($avisos, 'Por favor informe o ID da situação (idSit)');
		if (sizeof($avisos) > 0) {
			retornaErro($avisos);
		} else {
			$tipoSit = $cnx->campoBD("0", "SELECT situacao.id_tipo FROM situacao WHERE situacao.id_esc = ? AND situacao.id_sit = ?", 
				[ $idEsc, $idSit ]);
			if ($tipoSit == "0") retornaErro('Situação de matrícula não cadastrada');
			$idMatric = $cnx->campoBD("0", "SELECT matric.id_matric FROM matric INNER JOIN licenca ON licenca.id_usu = matric.id_usu 
				WHERE licenca.id_esc = ? AND matric.numMatric = ?", [ $idEsc, $numMatric ]);
			if ($idMatric == "0") retornaErro('Número de matrícula não cadastrado');
			$campo = ($tipoSit == 2) ? "sitFin" : "sitPed";
			executa("UPDATE matric SET matric.$campo = ? WHERE matric.id_matric = ?", [ $idSit, $idMatric ]);
			executa("INSERT INTO matric_situacao (id_matSit, id_matric, id_sit, cadEm, cadPorLicen, id_tipo) 
				VALUES ((SELECT MAX(matric_situacao.id_matSit) + 1 FROM matric_situacao), ?, ?, dbo.fnAgora(), ?, ?)", 
				[ $idMatric, $idSit, $idLicenSistemaKaits, $tipoSit ]);
		}
		echo json_encode(["sucesso" => "1", "numMatric" => $numMatric]);
	} else {
		echo retornaErro("Ação não informada ou não encontrada.");
	}

	function retornaErro($msg) {
		$retorno = array("sucesso" => "0", "msg" => $msg);
		echo json_encode($retorno);
		die();
	}	
	
	function dataSeparada($arei, $campoDia, $campoMes, $campoAno) {
		if (strlen($dia) == 0 || strlen($mes) == 0 || strlen($ano) == 0) return 'NULL';
		if (strlen($ano) == 2) $ano = '20' . $ano;
		if (strlen($mes) == 1) $mes = '0' . $mes;
		if (strlen($dia) == 1) $dia = '0' . $dia;
		return "'$ano-$mes-$dia'";
	}
	
	function criaSenhaImportacao($nome) {
		global $cnx;
		// ********** username e senha **********
		$user = trim($nome);
		if (strpos($user, " ") > 0) {
			$user = explode(" ", $user);
			$user = $user[0];
		}
		$user = tiraAcentos($user);
		
		$temSenha = "";
		while($temSenha == "") {
			$pass = senhaletra() . senhaletra() . senhaletra() . senhaletra() . senhadigito() . senhadigito() . senhadigito() . senhadigito();
			$temSenha = $cnx->query("SELECT pass FROM usu WHERE username LIKE '$user' AND pass LIKE '$pass'");
		}
		return array( "user" => $user, "pass" => $pass );
	}
	
	function recupera($arei, $campo, $tipo = "string") {
		if ($tipo == "num") $constTeste = FILTER_SANITIZE_NUMBER_INT;
		if ($tipo == "email") $constTeste = FILTER_SANITIZE_EMAIL;
		else $constTeste = FILTER_SANITIZE_STRING;
		$retorno = (isset($arei[$campo])) ? (($tipo == "string") ? utf8_decode(filter_var($arei[$campo], $constTeste)) : filter_var($arei[$campo], $constTeste)) : "";
		return $retorno;
	}
	
	function cadastroUsu() {
		global $cnx, $idSession, $idLicenSistemaKaits, $idUsuSistemaKaits, $idEsc, $input, $debug;
		$usu = (isset($input->usu)) ? ((is_array($input->usu) || is_object($input->usu)) ? $input->usu : json_decode($input->usu)) : [];
		// recupera os dados do usuário enviados
		$usu = (array) $usu;
		if (sizeof($usu) == 0) retornaErro("Por favor informe os dados do usuário");
		$nome = recupera($usu, "nome");
		$nasc = recupera($usu, "nasc");
		// $nasc =  $usu['nasc'];
		$genero = recupera($usu, "genero");
		$cpf = recupera($usu, "cpf");
		$rg = recupera($usu, "rg");
		$email = recupera($usu, "email", "email");
		$foneRes = recupera($usu, "foneRes");
		$foneCel = recupera($usu, "foneCel");
		$pais = recupera($usu, "pais");
		$estado = recupera($usu, "estado");
		$cidade = recupera($usu, "cidade");
		$rua = recupera($usu, "rua");
		$num = recupera($usu, "num");
		$compl = recupera($usu, "compl");
		$bairro = recupera($usu, "bairro");
		$cep = recupera($usu, "cep");
		$idCurs = recupera($usu, "idCurs", "num");
		$idEst = recupera($usu, "idEst", "num");
		$idTurm = recupera($usu, "idTurm", "num");
		$idTaxa = recupera($usu, "idTaxa", "num");
		$inicio = recupera($usu, "inicio");
		$termino = recupera($usu, "termino");
		$idConta = recupera($usu, "idConta", "num");
		$idModal = recupera($usu, "idModalidade", "num");
		// testa os dados do usuário
		if (strlen($nome) == 0) retornaErro("nome do usuário inválido.");
		if ($pais == '') $pais = 'Brasil';
		$cpf = (validaCPF($cpf)) ? formataCpf($cpf) : (($pais == 'Brasil') ? retornaErro("CPF do usuário inválido.") : '');
		if (strlen($email) == 0 || !validaEmail($email)) retornaErro("e-mail do usuário inválido.");
		if (strlen($foneRes) == 0) retornaErro("telefone do usuário inválido.");
		if (strlen($idCurs) == 0 && strlen($idEst) == 0 && strlen($idTurm) == 0) retornaErro("curso, estágio ou curso deve ser informado.");
		if (strlen($idTurm) > 0) {
			$idTurmIndef = $cnx->campoBD(0, "
				SELECT indefinida.id_turm 
				FROM turma 
					INNER JOIN turma AS indefinida ON indefinida.id_est = turma.id_est AND indefinida.indefinida = 1 
					LEFT JOIN estagio ON estagio.id_est = turma.id_est 
					LEFT JOIN curso ON curso.id_curs = estagio.id_curs 
				WHERE curso.id_esc = $idEsc AND turma.id_turm = $idTurm");
			if ($idTurmIndef == 0) retornaErro("turma não encontrada.");
			$periodo = $cnx->buscaArrayUnico("SELECT CONVERT(NVARCHAR, turma.inicio, 103) AS ini, 
				CONVERT(NVARCHAR, turma.termino, 103) AS fim, CONVERT(NVARCHAR, dbo.fnAgora(), 103) AS hoje 
				FROM turma WHERE turma.id_turm = $idTurm");
			if (strlen($inicio) > 0) $periodoIni = dataSql($inicio);
			else if (strlen($periodo["ini"]) > 0) $periodoIni = dataSql($periodo["ini"]); 
			else retornaErro("turma sem data de início.");
			if (strlen($termino) > 0) $periodoTerm = dataSql($termino);
			else if (strlen($periodo["fim"]) > 0) $periodoTerm = dataSql($periodo["fim"]);
			else retornaErro("turma sem data de término.");
		} else {
			if (strlen($inicio) > 0) $periodoIni = dataSql($inicio); else retornaErro("início da matrícula não informado.");
			if (strlen($termino) > 0) $periodoTerm = dataSql($termino); else retornaErro("término da matrícula não informado.");
		}
		$hoje = date("'Y-m-d'");
		$licIni = ($periodoIni < $hoje) ? $periodoIni : $hoje;
		$licFim = ($periodoTerm > $hoje) ? $periodoTerm : $hoje;
		if (strlen($idModal) == 0) $idModal = NULL;
		
		// usu aluno
		// usu e licença
		$login = criaSenhaImportacao($nome);
		$nasc = (strlen($nasc) > 0) ? dataSql($nasc) : "NULL";
		$genero = (strlen($genero) > 0) ? ((strtolower($genero) == 'outro') ? 3 : ((strpos(strtolower($genero), "f") === false) ? 1 : 2)) : NULL;
		$cadastrado = "dbo.fnAgora()";
		$perfil = ($idEsc == 303) ? "1399" : "1"; // perfil de "pré-aluno" da IPESSP ou de "aluno" de outras escolas
		$registro = $cnx->campoBD("0", "SELECT CASE WHEN MAX(CAST(usu.registro AS BIGINT)) + 1 > ISNULL(escola.registroAutoIni, 1) 
				THEN MAX(CAST(usu.registro AS BIGINT)) + 1 ELSE ISNULL(escola.registroAutoIni, 1) END 
			FROM usu INNER JOIN licenca ON licenca.id_usu = usu.id_usu INNER JOIN escola ON escola.id_esc = licenca.id_esc 
			WHERE licenca.id_esc = $idEsc AND ISNUMERIC(usu.registro) > 0 AND usu.registro > '0' 
			GROUP BY escola.id_esc, escola.registroAutoIni");
		if ($registro == "0") $registro = NULL;
		$idUsu = $cnx->achaproximo("id_usu", "usu");
		executa("INSERT INTO usu (id_usu, nome, registro, genero, nasc, username, pass) 
			VALUES (?, ?, ?, ?, $nasc, ?, ?)", [$idUsu, $nome, $registro, $genero, $login["user"], $login["pass"]], true);
		$idLic = $cnx->achaproximo("id_licen", "licenca");
		executa("INSERT INTO licenca (id_licen, id_usu, id_esc, id_perf, ini, fim, ferInicial, cadastradoEm, cadastradoPor) 
			VALUES (?, ?, ?, ?, $licIni, $licFim, ?, dbo.fnAgora(), ?)", [$idLic, $idUsu, $idEsc, $perfil, 40, $idLicenSistemaKaits], true);
		executa("INSERT INTO histlic (id_histlic, id_licen, ini, fim, hist, id_usu) 
			VALUES ((SELECT MAX(id_histlic) + 1 FROM histlic),?, $licIni, $licFim, dbo.fnAgora(), ?)", [ $idLic, $idUsuSistemaKaits], true);
		if ($cpf > '') executa("INSERT INTO usu_ndocs (id_usu, id_doc, numero) VALUES (?, ?, ?)", [$idUsu, 1, $cpf], true);
		if ($rg > '') executa("INSERT INTO usu_ndocs (id_usu, id_doc, numero) VALUES (?, ?, ?)", [$idUsu, 2, $rg], true);
		// e-mail
		executa("INSERT INTO usu_email (id_email, id_usu, id_cont, email) 
			VALUES ((SELECT MAX(usu_email.id_email) + 1 FROM usu_email),?, ?, ?)", [ $idUsu, 59, $email], true);
		// telefones
		$foneRes = str_replace(["(",")","-"," "],'', $foneRes);
		executa("INSERT INTO usu_fone (id_fone, id_usu, id_cont, fone) 
			VALUES ((SELECT MAX(usu_fone.id_fone) + 1 FROM usu_fone), ?, ?, ?)", [$idUsu, 1, $foneRes], true);
		if (strlen($foneCel) > 0) {
			$foneCel = str_replace(["(",")","-"," "],'', $foneCel);
			executa("INSERT INTO usu_fone (id_fone, id_usu, id_cont, fone) 
				VALUES ((SELECT MAX(usu_fone.id_fone) + 1 FROM usu_fone), ?, ?, ?)", [$idUsu, 4, $foneCel], true);
		}
		// endereços
		$idPais = "0";
		if (isset($pais) && strlen(trim($pais)) > 0) {
			$idPais = $cnx->campobd("0", "SELECT paises.id_pais FROM paises WHERE paises.nome = ? OR paises.cod = ?", [trim($pais), trim($pais)]);
		}
		$idEstado = "0";
		if (isset($estado) && strlen(trim($estado)) == 2) {
			$idEstado = $cnx->campobd("0", "SELECT estado.id_est FROM estado WHERE estado.nome = ? AND estado.id_pais = ?", [trim($estado), $idPais]);
		}
		$idCidade = "0";
		if ($idEstado > "0" && isset($cidade) && strlen($cidade) > 0) {
			$parametros = array( $idEsc, $idEstado, $cidade );
			$idCidade = $cnx->campobd("0", "SELECT cidade.id_cid FROM cidade WHERE cidade.id_esc = ? AND cidade.id_est = ? AND cidade.nome LIKE ?", $parametros);
			if ($idCidade == "0") {
				$codIBGE = $cnx->campobd("0", "SELECT cidades_IBGE.id_cidadeIBGE FROM cidades_IBGE 
					WHERE cidades_IBGE.nome LIKE ? AND cidades_IBGE.id_estado = ?", array( $cidade, $idEstado ));
				if ($codIBGE == "0") $codIBGE = NULL;
				if ($idEstado == "0") $idEstado = NULL;
				$idCidade = $cnx->achaproximo("id_cid", "cidade");
				executa("INSERT INTO cidade (id_cid, id_esc, nome, id_est, codigoIBGE) VALUES (?, ?, ?, ?, ? )", [ $idCidade, $idEsc, $cidade, $idEstado, $codIBGE ], true);
			}
		}
		if ($idCidade == "0") $idCidade = NULL;
		$rua = (strlen($rua) > 0) ? "$rua" : NULL;
		$num = (strlen($num) > 0) ? "$num" : NULL;
		$compl = (strlen($compl )> 0) ? "$compl" : NULL;
		$bairro = (strlen($bairro )> 0) ? "$bairro" : NULL;
		$cep = (strlen($cep )> 0) ? "$cep" : NULL;
		if ($idCidade != NULL || $rua != NULL || $num != NULL || $compl != NULL || $bairro != NULL || $cep != NULL) {
			executa ("INSERT INTO usu_endereco (id_end, id_usu, id_cont, rua, num, compl, bairro, cep, id_cid, paraDoc)
				VALUES ((SELECT MAX(usu_endereco.id_end) + 1 FROM usu_endereco), ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
				[$idUsu, 1, $rua, $num, $compl, $bairro, $cep, $idCidade, 1], true);
		}
		
		$resp = (isset($input->resp)) ? ((is_array($input->resp) || is_object($input->resp)) ? $input->resp : json_decode($input->resp)) : [];
		if (is_object($resp)) $resp = (array) $resp;
		$nomeResp = "";
		$emailResp = "";
		// recupera os dados do usuário enviados
		if (is_array($resp) && sizeof($resp) > 0) {
			// recupera os dados do responsável financeiro enviados
			$nomeResp = recupera($resp, "nome");
			$nasc = recupera($resp, "nasc");
			$genero = recupera($resp, "genero");
			$cpf = recupera($resp, "cpf");
			$rg = recupera($resp, "rg");
			$emailResp = recupera($resp, "email", "email");
			$foneRes = recupera($resp, "foneRes");
			$foneCel = recupera($resp, "foneCel");
			$pais = recupera($resp, "pais");
			$estado = recupera($resp, "estado");
			$cidade = recupera($resp, "cidade");
			$rua = recupera($resp, "rua");
			$num = recupera($resp, "num");
			$compl = recupera($resp, "compl");
			$bairro = recupera($resp, "bairro");
			$cep = recupera($resp, "cep");
			// testa os dados do responsável
			if (strlen($nomeResp) == 0) retornaErro("nome do responsável financeiro inválido.");
			if ($pais == '') $pais = 'Brasil';
			$cpf = (validaCPF($cpf)) ? formataCpf($cpf) : (($cpf > '') ? retornaErro("CPF do responsável financeiro inválido.") : '');
			if (isset($resp["email"]) && !validaEmail($resp["email"])) retornaErro("E-mail do responsável financeiro inválido.");
		
			$login = criaSenhaImportacao($nomeResp);
			$nasc = (strlen($nasc) > 0) ? dataSql($nasc) : "NULL";
			$genero = (strlen($genero) > 0) ? ((strtolower($genero) == 'outro') ? 3 : ((strpos(strtolower($genero), "f") === false) ? 1 : 2)) : NULL;
			$cadastrado = "dbo.fnAgora()";
			$perfil = "19"; // responsável
			$idUsuResp = $cnx->achaproximo("id_usu", "usu");
			executa("INSERT INTO usu (id_usu, nome, genero, nasc, username, pass) 
				VALUES (?, ?, ?, $nasc, ?, ?)", [$idUsuResp, $nomeResp, $genero, $login["user"], $login["pass"]], true);
			executa("INSERT INTO usu_resp (id_resp, id_usuResp, id_cont, id_usu, financeiro) 
				VALUES ((SELECT MAX(usu_resp.id_resp) + 1 FROM usu_resp), ?, ?, ?, ?)", [$idUsuResp, 70, $idUsu, 1], true);
			$idLic = $cnx->achaproximo("id_licen", "licenca");
			executa("INSERT INTO licenca (id_licen, id_usu, id_esc, id_perf, ini, fim, ferInicial, cadastradoEm, cadastradoPor) 
				VALUES (?, ?, ?, ?, $licIni, $licFim, ?, dbo.fnAgora(), ?)", 
				[$idLic, $idUsuResp, $idEsc, $perfil, 40, $idLicenSistemaKaits], true);
			executa("INSERT INTO histlic (id_histlic, id_licen, ini, fim, hist, id_usu) 
				VALUES ((SELECT MAX(id_histlic) + 1 FROM histlic),?, $licIni, $licFim, dbo.fnAgora(), ?)", [ $idLic, $idUsuSistemaKaits], true);
			if ($cpf > '') executa("INSERT INTO usu_ndocs (id_usu, id_doc, numero) VALUES (?, ?, ?)", [$idUsuResp, 1, $cpf], true);
			if ($rg > '') executa("INSERT INTO usu_ndocs (id_usu, id_doc, numero) VALUES (?, ?, ?)", [$idUsuResp, 2, $rg], true);
			// e-mail
			executa("INSERT INTO usu_email (id_email, id_usu, id_cont, email) 
				VALUES ((SELECT MAX(usu_email.id_email) + 1 FROM usu_email),?, ?, ?)", [ $idUsuResp, 59, $emailResp], true);
			// telefones
			$foneRes = str_replace(["(",")","-"," "],'', $foneRes);
			executa("INSERT INTO usu_fone (id_fone, id_usu, id_cont, fone) 
				VALUES ((SELECT MAX(usu_fone.id_fone) + 1 FROM usu_fone), ?, ?, ?)", [$idUsuResp, 1, $foneRes], true);
			if (strlen($foneCel) > 0) {
				$foneCel = str_replace(["(",")","-"," "],'', $foneCel);
				executa("INSERT INTO usu_fone (id_fone, id_usu, id_cont, fone) 
					VALUES ((SELECT MAX(usu_fone.id_fone) + 1 FROM usu_fone), ?, ?, ?)", [$idUsuResp, 4, $foneCel], true);
			}
			// endereços
			$idPais = "0";
			if (isset($pais) && strlen(trim($pais)) > 0) {
				$idPais = $cnx->campobd("0", "SELECT paises.id_pais FROM paises WHERE paises.nome = ? OR paises.cod = ?", [trim($pais), trim($pais)]);
			}
			$idEstado = "0";
			if (isset($estado) && strlen(trim($estado)) == 2) {
				$idEstado = $cnx->campobd("0", "SELECT estado.id_est FROM estado WHERE estado.nome = ? AND estado.id_pais = ?", [trim($estado), $idPais]);
			}
			$idCidade = "0";
			if ($idEstado > "0" && isset($cidade) && strlen($cidade) > 0) {
				$parametros = array( $idEsc, $idEstado, $cidade );
				$idCidade = $cnx->campobd("0", "SELECT cidade.id_cid FROM cidade WHERE cidade.id_esc = ? AND cidade.id_est = ? AND cidade.nome LIKE ?", $parametros);
				if ($idCidade == "0") {
					$codIBGE = $cnx->campobd("0", "SELECT cidades_IBGE.id_cidadeIBGE FROM cidades_IBGE 
						WHERE cidades_IBGE.nome LIKE ? AND cidades_IBGE.id_estado = ?", array( $cidade, $idEstado ));
					if ($codIBGE == "0") $codIBGE = NULL;
					if ($idEstado == "0") $idEstado = NULL;
					$idCidade = $cnx->achaproximo("id_cid", "cidade");
					executa("INSERT INTO cidade (id_cid, id_esc, nome, id_est, codigoIBGE) VALUES (?, ?, ?, ?, ? )", [ $idCidade, $idEsc, $cidade, $idEstado, $codIBGE ], true);
				}
			}
			if ($idCidade == "0") $idCidade = NULL;
			$rua = (strlen($rua) > 0) ? "$rua" : NULL;
			$num = (strlen($num) > 0) ? "$num" : NULL;
			$compl = (strlen($compl )> 0) ? "$compl" : NULL;
			$bairro = (strlen($bairro )> 0) ? "$bairro" : NULL;
			$cep = (strlen($cep )> 0) ? "$cep" : NULL;
			if ($estado != NULL || $rua != NULL || $num != NULL || $compl != NULL || $bairro != NULL || $cep != NULL) {
				executa ("INSERT INTO usu_endereco (id_end, id_usu, id_cont, rua, num, compl, bairro, cep, id_cid, paraDoc)
					VALUES ((SELECT MAX(usu_endereco.id_end) + 1 FROM usu_endereco), ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
					[$idUsuResp, 1, $rua, $num, $compl, $bairro, $cep, $idCidade, 1], true);
			}
		}
		
		$pedag = (isset($input->pedag)) ? ((is_array($input->pedag) || is_object($input->pedag)) ? $input->pedag : json_decode($input->pedag)) : [];
		if (is_object($pedag)) $pedag = (array) $pedag;
		// recupera os dados do usuário enviados
		if (is_array($pedag) && sizeof($pedag) > 0) {
			// recupera os dados do responsável pedagógico (se enviado)
			$nomeResp = recupera($pedag, "nome");
			$nasc = recupera($pedag, "nasc");
			$genero = recupera($pedag, "genero");
			$cpf = recupera($pedag, "cpf");
			$rg = recupera($pedag, "rg");
			$email = recupera($pedag, "email", "email");
			$foneRes = recupera($pedag, "foneRes");
			$foneCel = recupera($pedag, "foneCel");
			$pais = recupera($pedag, "pais");
			$estado = recupera($pedag, "estado");
			$cidade = recupera($pedag, "cidade");
			$rua = recupera($pedag, "rua");
			$num = recupera($pedag, "num");
			$compl = recupera($pedag, "compl");
			$bairro = recupera($pedag, "bairro");
			$cep = recupera($pedag, "cep");
			// testa os dados do responsável
			if (strlen($nomeResp) == 0) retornaErro("nome do responsável pedagógico inválido.");
			if ($pais == '') $pais = 'Brasil';
			$cpf = (validaCPF($cpf)) ? formataCpf($cpf) : (($cpf > '') ? retornaErro("CPF do responsável pedagógico inválido.") : '');
			if (isset($resp["email"]) && !validaEmail($resp["email"])) retornaErro("E-mail do responsável pedagógico inválido.");
		
			$login = criaSenhaImportacao($nomeResp);
			$nasc = (strlen($nasc) > 0) ? dataSql($nasc) : "NULL";
			$genero = (strlen($genero) > 0) ? ((strtolower($genero) == 'outro') ? 3 : ((strpos(strtolower($genero), "f") === false) ? 1 : 2)) : NULL;
			$cadastrado = "dbo.fnAgora()";
			$perfil = "19"; // responsável
			$idUsuResp = $cnx->achaproximo("id_usu", "usu");
			executa("INSERT INTO usu (id_usu, nome, genero, nasc, username, pass) 
				VALUES (?, ?, ?, $nasc, ?, ?)", [$idUsuResp, $nomeResp, $genero, $login["user"], $login["pass"]], true);
			executa("INSERT INTO usu_resp (id_resp, id_usuResp, id_cont, id_usu, pedagogico) 
				VALUES ((SELECT MAX(usu_resp.id_resp) + 1 FROM usu_resp), ?, ?, ?, ?)", [$idUsuResp, 70, $idUsu, 1], true);
			$idLic = $cnx->achaproximo("id_licen", "licenca");
			executa("INSERT INTO licenca (id_licen, id_usu, id_esc, id_perf, ini, fim, ferInicial, cadastradoEm, cadastradoPor) 
				VALUES (?, ?, ?, ?, $licIni, $licFim, ?, dbo.fnAgora(), ?)", [$idLic, $idUsuResp, $idEsc, $perfil, 40, $idLicenSistemaKaits], true);
			executa("INSERT INTO histlic (id_histlic, id_licen, ini, fim, hist, id_usu) 
				VALUES ((SELECT MAX(id_histlic) + 1 FROM histlic),?, $licIni, $licFim, dbo.fnAgora(), ?)", [ $idLic, $idUsuSistemaKaits], true);
			if ($cpf > '') executa("INSERT INTO usu_ndocs (id_usu, id_doc, numero) VALUES (?, ?, ?)", [$idUsuResp, 1, $cpf], true);
			if ($rg > '') executa("INSERT INTO usu_ndocs (id_usu, id_doc, numero) VALUES (?, ?, ?)", [$idUsuResp, 2, $rg], true);
			// e-mail
			executa("INSERT INTO usu_email (id_email, id_usu, id_cont, email) 
				VALUES ((SELECT MAX(usu_email.id_email) + 1 FROM usu_email),?, ?, ?)", [ $idUsuResp, 59, $email], true);
			// telefones
			$foneRes = str_replace(["(",")","-"," "],'', $foneRes);
			executa("INSERT INTO usu_fone (id_fone, id_usu, id_cont, fone) 
				VALUES ((SELECT MAX(usu_fone.id_fone) + 1 FROM usu_fone), ?, ?, ?)", [$idUsuResp, 1, $foneRes], true);
			if (strlen($foneCel) > 0) {
				$foneCel = str_replace(["(",")","-"," "],'', $foneCel);
				executa("INSERT INTO usu_fone (id_fone, id_usu, id_cont, fone) 
					VALUES ((SELECT MAX(usu_fone.id_fone) + 1 FROM usu_fone), ?, ?, ?)", [$idUsuResp, 4, $foneCel], true);
			}
			// endereços
			$idPais = "0";
			if (isset($pais) && strlen(trim($pais)) > 0) {
				$idPais = $cnx->campobd("0", "SELECT paises.id_pais FROM paises WHERE paises.nome = ? OR paises.cod = ?", [trim($pais), trim($pais)]);
			}
			$idEstado = "0";
			if (isset($estado) && strlen(trim($estado)) == 2) {
				$idEstado = $cnx->campobd("0", "SELECT estado.id_est FROM estado WHERE estado.nome = ? AND estado.id_pais = ?", [trim($estado), $idPais]);
			}
			$idCidade = "0";
			if ($idEstado > "0" && isset($cidade) && strlen($cidade) > 0) {
				$parametros = array( $idEsc, $idEstado, $cidade );
				$idCidade = $cnx->campobd("0", "SELECT cidade.id_cid FROM cidade WHERE cidade.id_esc = ? AND cidade.id_est = ? AND cidade.nome LIKE ?", $parametros);
				if ($idCidade == "0") {
					$codIBGE = $cnx->campobd("0", "SELECT cidades_IBGE.id_cidadeIBGE FROM cidades_IBGE 
						WHERE cidades_IBGE.nome LIKE ? AND cidades_IBGE.id_estado = ?", array( $cidade, $idEstado ));
					if ($codIBGE == "0") $codIBGE = NULL;
					if ($idEstado == "0") $idEstado = NULL;
					$idCidade = $cnx->achaproximo("id_cid", "cidade");
					executa("INSERT INTO cidade (id_cid, id_esc, nome, id_est, codigoIBGE) VALUES (?, ?, ?, ?, ? )", [ $idCidade, $idEsc, $cidade, $idEstado, $codIBGE ], true);
				}
			}
			if ($idCidade == "0") $idCidade = NULL;
			$rua = (strlen($rua) > 0) ? "$rua" : NULL;
			$num = (strlen($num) > 0) ? "$num" : NULL;
			$compl = (strlen($compl )> 0) ? "$compl" : NULL;
			$bairro = (strlen($bairro )> 0) ? "$bairro" : NULL;
			$cep = (strlen($cep )> 0) ? "$cep" : NULL;
			if ($estado != NULL || $rua != NULL || $num != NULL || $compl != NULL || $bairro != NULL || $cep != NULL) {
				executa ("INSERT INTO usu_endereco (id_end, id_usu, id_cont, rua, num, compl, bairro, cep, id_cid, paraDoc)
					VALUES ((SELECT MAX(usu_endereco.id_end) + 1 FROM usu_endereco), ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
					[$idUsuResp, 1, $rua, $num, $compl, $bairro, $cep, $idCidade, 1], true);
			}
		}

		// matricula
		// No processo de matrícula online do IPESSP a matrícula é sempre na turma indefinida até que o pagamento seja confirmado (e os dados do alunno)
		// nos outros casos a matrícula é realizada já na turma selecionada
		if ($idEsc == 303) { // IPESSP
			$turmaMatriculada = $idTurmIndef;
			$turmaPretendida = $idTurm;
		} else {
			if (strlen($idTurm) == 0) {
				// se idTurm for vazio, é matrícula individual: cria turma sem nome
				if (strlen($idEst) == 0) $idEst = $cnx->campoBD("0", "SELECT estagio.id_est FROM estagio 
					WHERE LEN(estagio.nome) = 0 AND estagio.id_curs = ?", [ $idCurs ]);
				if ($idEst == 0) retornaErro("Curso ou estágio não encontrado. Matrícula não realizada.");
				$idTurm = $cnx->achaproximo("id_turm", "turma");
				executa("INSERT INTO turma (id_turm, id_est, nome) VALUES ($idTurm, $idEst, '')", [ $idTurm, $idEst ]);
			}
			$turmaMatriculada = $idTurm;
			$turmaPretendida = NULL;
		}
		$idMatric = $cnx->achaProximo("id_matric", "matric");
		executa("INSERT INTO matric (id_matric, id_usu, id_turm, id_turmPret, ativo, numMatric, matini, matfim, id_modal)
			VALUES (?, ?, ?, ?, ?, (SELECT MAX(numMatric) +1 FROM dbo.fnNumMatric($idEsc)), $periodoIni, $periodoTerm, ?)", 
			[$idMatric, $idUsu, $turmaMatriculada, $turmaPretendida, 1, $idModal], true);
		executa("INSERT INTO matric_turma (id_matricTurma, id_matric, id_turm, data, responsavel, valid_ini, valid_fim)
			VALUES ((SELECT MAX(matric_turma.id_matricTurma) + 1 FROM matric_turma), ?, ?, dbo.fnAgora(), ?, $periodoIni, $periodoTerm)", 
			[$idMatric, $turmaMatriculada, $idLicenSistemaKaits], true);
		$numMatric = $cnx->campoBD("0", "SELECT matric.numMatric FROM matric WHERE matric.id_matric = $idMatric");

		// gravação do pagamento
		if (strlen($idTaxa) == 0) {
			$primeiroPagto = false;
		} else {
			$comBoleto = false;
			$padraoValor = $cnx->buscaAssoc("SELECT * FROM padraoValor WHERE padraoValor.id_padrao = $idTaxa");
			for ($i = 0; $i < sizeof($padraoValor); $i++) {
				if ($padraoValor[$i]['vezes']  == '' ) $padraoValor[$i]['vezes'] = 1;
				$cat = (strlen($padraoValor[$i]['id_cat']) > 0 ) ? $padraoValor[$i]['id_cat'] : NULL;
				$valor = (strlen($padraoValor[$i]['valor']) > 0 ) ? $padraoValor[$i]['valor']: NULL ;
				$desconto = (strlen($padraoValor[$i]['desconto']) > 0 ) ? $padraoValor[$i]['desconto']: NULL;
				$tipoDesconto = (strlen($padraoValor[$i]['tipoDesconto']) > 0 )? $padraoValor[$i]['tipoDesconto']: NULL;
				//idFormaPrev == 22 (pagSeguro)
				executa("INSERT INTO matric_val (id_val, id_matric, id_usu, id_cat, valor, desconto, desconto_tipo, data, matValIni, matValFim, id_formaPrev)
					VALUES ((SELECT MAX(matric_val.id_val) + 1 FROM matric_val), 
						?, ?, ?, ?, ?, ?, dbo.fnAgora(), $periodoIni, $periodoTerm, ?)", [$idMatric, $idUsu, $cat, $valor, $desconto, $tipoDesconto, 22], true);
				for ($j = 0; $j< $padraoValor[$i]['vezes']; $j++) {
					//for() para ver a quantidade de parcelas para se adicionar no pagamento, 
					//a data de venc da primeira parcela é sempre no primeiro dia util depois da data de cadastro no site
					//a data de venc das outras parcelas, caso tenha, é sempre de 30 em 30 dias.
					if ((int) $padraoValor[$i]['todoDia'] <= 0) {
						if($j == 0) {
							$dataVenc = $cnx ->campoBD("", "
								SELECT CASE WHEN DATEPART(dw,dbo.fnAgora()) = 6 
									THEN CONVERT(NVARCHAR, dbo.fnAgora()+3, 103) 
									ELSE CASE WHEN DATEPART(dw,dbo.fnAgora()) = 7 THEN CONVERT(NVARCHAR, dbo.fnAgora()+ 2, 103) 
										ELSE CONVERT(NVARCHAR, dbo.fnAgora() + 1, 103) END END");
						} else {
							$addMes = 30 * $j;
							$dataVenc = $cnx->campoBD("", "
								SELECT CASE WHEN DATEPART(dw,dbo.fnAgora() + $addMes) = 6 
									THEN CONVERT(NVARCHAR, dbo.fnAgora() + $addMes +3, 103) 
									ELSE CASE WHEN DATEPART(dw,dbo.fnAgora() + $addMes) = 7 THEN CONVERT(NVARCHAR, dbo.fnAgora() + $addMes + 2, 103) 
										ELSE CASE WHEN DATEPART(dw,dbo.fnAgora() + $addMes) = 1 THEN CONVERT(NVARCHAR, dbo.fnAgora()  + $addMes + 1, 103)
											ELSE CONVERT(NVARCHAR, dbo.fnAgora()  + $addMes, 103) END END END");
						}
					} else {
						$todoDia = $padraoValor[$i]['todoDia'];
						$ano = fnAnoAnterior() + 1;
						// $data = $todoDia."/". fnMesAtual(). "/". $ano;
						$data = $ano."/". fnMesAtual(). "/". $todoDia;
						$dataVenc = $cnx->campoBD("", "SELECT  CONVERT(NVARCHAR, DATEADD (mm, $j+1, '$data'), 103)");
					}
					$dataVencSql = dataSql($dataVenc);
					$idCat = $padraoValor[$i]['id_cat'];
					$valor = $padraoValor[$i]['valor'];
					$desconto = ($padraoValor[$i]['desconto']) ?$padraoValor[$i]['desconto']: 0 ;
					$tipoDesconto = ($padraoValor[$i]['tipoDesconto']) ?$padraoValor[$i]['tipoDesconto']: 0 ;
					$parcela = ($padraoValor[$i]['vezes']) ?$padraoValor[$i]['vezes']: 1 ;
					if ($desconto > 0) {
						if ($tipoDesconto == 1) {
							$valor = ($valor - ($valor * $desconto/100)) / $parcela;
						} else {
							$valor = ($valor - $desconto) / $parcela;
						}
					}
					$valor = $valor / $parcela;
					//idFormaPrev == 22 (pagSeguro)
					executa("INSERT INTO pagto (id_pagto, id_matric, id_esc, id_cat, parcela, valor, venc, id_formaPrev)
						VALUES ((SELECT MAX(id_pagto)+1 FROM pagto), ?, ?, ?, ?, ?, $dataVencSql, 22)", 
						[ $idMatric, $idEsc, $idCat, $j + 1, $valor], true);
					$idPagto = $cnx->campoBD("0", "SELECT TOP 1 pagto.id_pagto FROM pagto WHERE pagto.id_matric = $idMatric");
					// atualiza a descAuto (descrição automática) após a gravação do pagamento
					if ($idPagto > 0) executa("EXEC pagto_descAuto '$idPagto'");
					executa("EXEC dbo.atualizaSitMatric @idMatric = $idMatric, @idEsc = $idEsc");
					// se tem conta definida, emite também o boleto para cada pagamento
						
					if (strlen($idConta) > 0) {
						// testa os dados para o boleto
						$idConta = $cnx->campoBD("0", "SELECT ISNULL(esc_banco.id_escbanco, 0) FROM esc_banco 
							WHERE esc_banco.id_esc = $idEsc AND esc_banco.id_escbanco = $idConta");
						if ($idConta == "0") retornaErro("conta financeira não cadastrada.");
						$idBanco = $cnx->campoBD("0", "SELECT ISNULL(esc_banco.id_banco, 0) FROM esc_banco WHERE esc_banco.id_escbanco = $idConta");
						if ($idBanco == "0") retornaErro("conta não vinculada a nenhum banco.");
						$sacado = (strlen($nomeResp) > 0) ? $nomeResp : $nome;
						if (strlen($sacado) == 0) retornaErro("o boleto não pode ser emitido sem um nome de sacado (responsável financeiro ou aluno).");
						// se a conta for gerencianet, o nome do sacado deve conter nome e sobrenome
						$nomeSobrenome = explode(' ', $sacado);
						if ($idBanco == "61" && sizeof($nomeSobrenome) < 2)
							retornaErro('para emissão de boleto pelo Gerencianet, o sacado deve conter nome e sobrenome.');
						$emailSacado = (strlen($emailResp) > 0) ? $emailResp : $email;
						if (strlen($emailSacado) == 0) retornaErro("o boleto não pode ser emitido sem o e-mail do sacado (responsável financeiro ou aluno).");
						
						$url = "https://sistema.kaits.com.br/interno/pag_bolemite.asp?idpagto=$idPagto&idescbanco=$idConta&valor=$valor" .
							"&sacado=" . urlencode($sacado) . "&email=" . urlencode($emailSacado) . "&idusu=$idUsu" .
							"&vencimento=$dataVenc&gravaConta=1&origem=API-matricula&cobranca=1&idLicen=$idLicenSistemaKaits";
						$boleto = curl_init();
						curl_setopt($boleto, CURLOPT_URL, $url);
						curl_setopt($boleto, CURLOPT_RETURNTRANSFER, true);
						curl_setopt($boleto, CURLOPT_FOLLOWLOCATION, true);
						curl_setopt($boleto, CURLOPT_VERBOSE, 1);
						curl_setopt($boleto, CURLOPT_COOKIE, "kaits=" . urlencode($_COOKIE["kaits"]));
						$retornoBoleto = curl_exec($boleto);
						//echo "erro: " . var_dump(curl_error($boleto)) . "<br />";
						//echo "info: " . json_encode(curl_getinfo($boleto)) . "<br />";
						curl_close($boleto);
						$comBoleto = true;
					}
				}
			}

			$fromPagto = ($comBoleto) ? ", 'https://sistema.kaits.com.br/interno/pag_boleto.asp?cod=' 
					+ boleto.codigo AS link, boleto.linhaDigitavel 
				FROM pagto 
					LEFT JOIN pagto_boleto ON pagto_boleto.id_pagto = pagto.id_pagto 
					LEFT JOIN boleto ON boleto.id_boleto = pagto_boleto.id_boleto" 
				: "FROM pagto";
			$primeiroPagto = $cnx->buscaAssoc("SELECT TOP 1 pagto.id_pagto AS idPagto, dbo.fnFormataValor(pagto.valor) AS valor $fromPagto 
				WHERE pagto.id_matric = $idMatric ORDER BY pagto.venc");
		}
		$retornoPagto = ($primeiroPagto) ? $primeiroPagto : "Não existe pagamento para essa matricula";
		
		// envia 1º e-mail de informações do processo de matrícula on-line indicando para prosseguir com o pagamento
		// o 1º e-mail não é mais enviado (solicitado por Júlio - IPESSP - em e-mail de 09/08/2019)
		//	//if (strpos(strtolower($nome), "ipessp") !== false) {
		//		$textoEmail = $cnx->buscaArrayUnico("SELECT emails.assunto, emails.corpo, emails.estilo FROM emails WHERE emails.id_email = 10");
		//		$nomeCurso = $cnx->campoBD("", "
		//			SELECT curso.nome + CASE WHEN LEN(estagio.nome) > 0 THEN ' - ' + estagio.nome ELSE '' END 
		//			FROM turma 
		//				LEFT JOIN estagio ON estagio.id_est = turma.id_est 
		//				LEFT JOIN curso ON curso.id_curs = estagio.id_curs 
		//			WHERE curso.id_esc = $idEsc AND turma.id_turm = $idTurm");
		//		$corpo = str_replace("||nomeAluno||", $nome, $textoEmail["corpo"]);
		//		$corpo = str_replace("||nomeCurso||", $nomeCurso, $corpo);
		//		$corpo = "<style>$textoEmail[estilo]</style>$corpo";
		//		$email = new Email($idEsc, $textoEmail["assunto"], $idUsu, $corpo);
		//		$retornoEmail = $email->envia(true);
		//	//} else $retornoEmail = null;
		
		return ["sucesso" => "1", "numMatric" => $numMatric, "pagto" => $retornoPagto]; // , "email" => $retornoEmail
	}
	
	function retornaMoviment() {
		global $cnx, $idEsc, $input;
		$idMatric = (isset($input->idMatric)) ? filter_var($input->idMatric, FILTER_SANITIZE_STRING) : "";
		$idAlun = (isset($input->idAlun)) ? filter_var($input->idAlun, FILTER_SANITIZE_STRING) : "";
		$idCurs = (isset($input->idCurs)) ? filter_var($input->idCurs, FILTER_SANITIZE_STRING) : "";
		$idEst = (isset($input->idEst)) ? filter_var($input->idEst, FILTER_SANITIZE_STRING) : "";
		$idTurm = (isset($input->idTurm)) ? filter_var($input->idTurm, FILTER_SANITIZE_STRING) : "";
		$movDe = (isset($input->movDe)) ? filter_var($input->movDe, FILTER_SANITIZE_STRING) : "";
		$movAte = (isset($input->movAte)) ? filter_var($input->movAte, FILTER_SANITIZE_STRING) : "";
		$filtro = [];
		$filtroMov = [];
		$filtroSit = [];
		if (strlen($idMatric) > 0) array_push($filtro, "matric.id_matric = $idMatric");
		if (strlen($idAlun) > 0) array_push($filtro, "usu.id_usu = $idAlun");
		if (strlen($idCurs) > 0) array_push($filtro, "curso.id_curs = $idCurs");
		if (strlen($idEst) > 0) array_push($filtro, "estagio.id_est = $idEst");
		if (strlen($idTurm) > 0) array_push($filtro, "turma.id_turm = $idTurm");
		if (strlen($movDe) > 0) {
			array_push($filtro, "(matric.matfim >= '$movDe' OR EXISTS (SELECT TOP 1 1 FROM matric_turma 
				WHERE matric_turma.id_matric = matric.id_matric AND matric_turma.valid_ini >= '$movDe'))");
			array_push($filtroMov, "matric_turma.valid_ini >= '$movDe'");
			array_push($filtroSit, "matric_situacao.cadEm >= '$movDe'");
		}
		if (strlen($movAte) > 0) {
			array_push($filtro, "(matric.matfim <= '$movAte' OR EXISTS (SELECT TOP 1 1 FROM matric_turma 
				WHERE matric_turma.id_matric = matric.id_matric AND matric_turma.valid_ini <= '$movAte'))");
			array_push($filtroMov, "matric_turma.valid_ini <= '$movAte'");
			array_push($filtroSit, "matric_situacao.cadEm <= '$movAte'");
		}
		$sqlFiltro = '';
		if (sizeof($filtro) > 0) $sqlFiltro = " AND " . implode(" AND ", $filtro);
		$sqlFiltroMov = '';
		if (sizeof($filtroMov) > 0) $sqlFiltroMov = " AND " . implode(" AND ", $filtroMov);
		$sqlFiltroSit = '';
		if (sizeof($filtroSit) > 0) $sqlFiltroSit = " AND " . implode(" AND ", $filtroSit);

		$sqlAlteracoes = "SELECT LEFT(CONVERT(nvarchar, matric_turma.valid_ini, 120), 10) AS [data], matric_turma.valid_ini AS [dataOrder], 
				'' AS [tipo], curso.nome AS [curso], estagio.nome AS [estagio], turma.nome AS [turma], 
				LEFT(CONVERT(nvarchar, matric_turma.valid_fim, 120), 10) AS [validFim], '' AS [situacao] 
			FROM matric_turma 
				LEFT JOIN turma ON turma.id_turm = matric_turma.id_turm 
				LEFT JOIN estagio ON estagio.id_est = turma.id_est 
				LEFT JOIN curso ON curso.id_curs = estagio.id_curs 
			WHERE matric_turma.id_matric = matric.id_matric AND ISNULL(matric_turma.naoAplicavel, 0) = 0 $sqlFiltroMov 
			UNION ALL 
			SELECT LEFT(CONVERT(nvarchar, matric_situacao.cadEm, 120), 10) AS [data], matric_situacao.cadEm AS [dataOrder], 
				'4' AS [tipo], '' AS curso, '' AS [estagio], '' AS [turma], '' AS [validFim], situacao.nome AS [situacao] 
			FROM matric_situacao 
				INNER JOIN situacao ON situacao.id_sit = matric_situacao.id_sit 
			WHERE matric_situacao.id_matric = matric.id_matric AND matric_situacao.id_tipo = 1 $sqlFiltroSit";

		$matrics = $cnx->buscaAssoc("SELECT matric.id_matric AS idMatric, matric.numMatric, usu.id_usu AS idAlun, usu.nome AS aluno, 
				curso.id_curs AS idCurs, curso.nome AS curso, estagio.id_est AS idEst, estagio.nome AS estagio, 
				turma.id_turm AS idTurm, turma.nome AS turma, matric_tipoCanc.tipo, 
				LEFT(CONVERT(nvarchar, matric.matFim, 120), 10) AS fimMatric, 
				(SELECT data, tipo, curso, estagio, turma, validFim, situacao, dataOrder 
					FROM ($sqlAlteracoes) AS alteracoes ORDER BY dataOrder FOR JSON PATH) AS moviment 
			FROM curso 
				INNER JOIN estagio ON estagio.id_curs = curso.id_curs 
				INNER JOIN turma ON turma.id_est = estagio.id_est 
				INNER JOIN matric ON matric.id_turm = turma.id_turm 
				INNER JOIN usu ON usu.id_usu = matric.id_usu 
				INNER JOIN licenca ON licenca.id_usu = matric.id_usu AND licenca.id_esc = curso.id_esc 
				LEFT JOIN matric_tipoCanc ON matric_tipoCanc.id_tipo = matric.tipoCanc 
			WHERE curso.id_esc = $idEsc AND licenca.excl IS NULL AND LEN(turma.nome) > 0 $sqlFiltro 
			ORDER BY usu.nome");

		foreach($matrics as &$matric) {
			$validFim = '';
			if (strlen($matric['moviment']) > 0) {
				$matric['moviment'] = json_decode($matric['moviment'], true);
				for ($i = 0; $i < sizeof($matric['moviment']); $i++) {
					if (strlen($matric['moviment'][$i]['tipo']) == 0) {
						$matric['moviment'][$i]['tipo'] = ($i == 0) ? '1' : '2';
						$validFim = $matric['moviment'][$i]['validFim'];
					}
					unset($matric['moviment'][$i]['validFim']);
					unset($matric['moviment'][$i]['dataOrder']);
				}
			} else {
				$matric['moviment'] = [];
				$validFim = $matric["fimMatric"];
			}
			unset($matric["fimMatric"]);
			if ((strlen($movDe) == 0 || $validFim >= $movAte) && (strlen($movAte) == 0 || $validFim <= $movAte))
				array_push($matric['moviment'], [ 'data' => $validFim, 'tipo' => '3', 'finalizacao' => $matric['tipo'] ]);
		}
			
		if (sizeof($matrics) <= 0) retornaErro("Não existem matrículas que atendam estes critérios");
		return [ "sucesso" => "1", "matriculas" => $matrics ];
	}
?>
