<?php
	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: GET, POST');
	header("Content-Type: text/html; charset=UTF-8", true);
	if (sizeof($_POST) == 0) $input = json_decode(file_get_contents('php://input'));
	else $input = (object) $_POST;
	$acaoAPI = (isset($input->acao)) ? filter_var($input->acao, FILTER_SANITIZE_STRING) : "";
	$token = (isset($input->token)) ? filter_var($input->token, FILTER_SANITIZE_STRING) : "";
	$cidade = (isset($input->cidade)) ? filter_var($input->cidade, FILTER_SANITIZE_STRING) : "";
	$uf = (isset($input->uf)) ? filter_var($input->uf, FILTER_SANITIZE_STRING) : "";
	$ibge = (isset($input->ibge)) ? filter_var($input->ibge, FILTER_SANITIZE_STRING) : "";
	$_POST["origem"] = "API";
	include ('../interno/session/funcoes_session.php');
	// busca o id_esc pelo tokenAPI da escola
	$idEsc = $cnx->campoBD("0", "SELECT escola.id_esc FROM escola 
		WHERE sys.fn_varbintohexsubstring(0, HashBytes('SHA1', 'KAITS*&API*&' + escola.token + CAST(escola.id_esc AS nvarchar)), 1, 0) = '$token'");
	if ($idEsc == 0) retornaErro("Token inválido. Por favor confira o API token de sua escola.");
	// faz o login como usuário "Sistema KAITS" (id_licenca = 135392) para poder criar uma sessão e permitir todo acesso, ao final faz o logout desta sessão
	$idSession = session_inicializa(135392, $idEsc);
	$_COOKIE["kaits"] = $idSession;
	$_GET['idPagina'] = "33"; // seta o id da página para 33 (ferramenta de interessados)
	include ('../interno/func/grava_funcoes.php');
	$grava = true;
	//if ($idEsc == 1) $grava = false;
	
	// alguns testes:
	// {"nome":"sergio","cpf":"13196059820","email":"asd@asd.com","rg":"lklkj","nasc":"20/05/1997","fone":"(11) 1232-9482","cel":"(11) 93212-0994","comoConheceu":49,"nomecurso":"básico","nomeestagio":"começo","nometurma":"ABC áéíóú"}
	// [info] => {"nome":"Fabio Simões","email":"fabiorafael2@hotmail.com","fone":"(11) 9671-9683","celular":"(11) 96719-6835","nomeCurso":"Pós-Graduação Acupuntura"}
	// {"nome":"AA teste","email":"AAteste@teste.com","rg":"13.432.234-9","cpf":"123.456.789.09","nasc":"05/08/1993","fone":"1234-9876","celular":"98754-0987","rua":"rua do endereço","numero":"num. qualquer","complemento":"apto 333","bairro":"vila fim do mundo","cidade":"Jundiaí","estado":"SP","cep":"01000-000","nacionalidade":"coreano","estadoCivil":"3"}
	// {"nome":"AA teste","email":"AAteste@teste.com","rg":"13.432.234-9","cpf":"123.456.789.09","nasc":"05/08/1993","fone":"1234-9876","celular":"98754-0987","comoConheceu":"493","nomeCurso":"AAA financeiro","nomeEstagio":"","nomeTurma":"","horario":"quinzenal","localidade":"122","tipo":"2","dias":"2,3,4","idioma":"3","obs":"teste de observação de interesse"}
	// {"nome":"AA teste","email":"AAteste@teste.com","rg":"13.432.234-9","cpf":"123.456.789.09","nasc":"05/08/1993","fone":"1234-9876","celular":"98754-0987","comoConheceu":"493","idTurm":"249291","horario":"quinzenal","localidade":"122","tipo":"2","dias":"2,3,4","idioma":"3","obs":"teste de observação de interesse"}
	
	if ($acaoAPI == "cadastro") {
		echo json_encode(cadastro());
	} else if ($acaoAPI == "comoConheceu") {
		echo json_encode(comoConheceu());
	} else if ($acaoAPI == "localidades") {
		echo json_encode(localidades());
	} else if ($acaoAPI == "tipos") {
		echo json_encode(tiposInteresse());
	} else if ($acaoAPI == "idiomas") {
		echo json_encode(idiomasInteresse());
	} else if ($acaoAPI == "cidades") {
		echo json_encode(cidades());
	} else if ($acaoAPI == "ibge") {
		echo json_encode(ibge());
	} else if ($acaoAPI == "novaCidade") {
		echo json_encode(novaCidade());
	} else {
		retornaErro("ação inválida.");
	}
	
	function retornaErro($msg) {
		$retorno = array("sucesso" => "0", "msg" => $msg);
		echo json_encode($retorno);
		die();
	}
	
	function insere($tabela, $campos) {
		$camposDataSistema = array();
		$camposLiterais = array();
		foreach($campos as $campo => $valor) {
			if ($valor == "dbo.fnAgora()" || substr($valor, 0, 7) == "(SELECT") {
				$camposLiterais[$campo] = $valor;
				unset($campos[$campo]);
			}				
		}
		$camposSQL = implode(", ", array_keys($campos));
		$valoresSQL = implode(", ", array_fill(0, sizeof($campos), "?"));
		$parametros = array_merge(array_values($campos));
		foreach ($camposLiterais as $campo => $valor) {
			$camposSQL .= ", $campo";
			$valoresSQL .= ", " . $valor;
		}
		$sql = "INSERT INTO $tabela ($camposSQL) VALUES ($valoresSQL)";
		executa($sql, $parametros, true);
	}
	
	function atualiza($tabela, $chave, $ID, $campos) {
		$camposSQL = "SET $tabela." . implode(" = ?, $tabela.", array_keys($campos)) . " = ?";
		$parametros = array_merge(array_values($campos));
		$sql = "UPDATE $tabela $camposSQL WHERE $tabela.$chave = $ID";
		executa($sql, $parametros, true);
	}
	
	function cadastro() {
		global $cnx, $idEsc, $id_licen, $input;
		$dados = array();
		//retornaErro($input->info);
		$info = (isset($input->info)) ? $input->info : [];
        if (is_string($info)) $info = json_decode($info);
		$info = (array) $info;
		if (sizeof($info) == 0) retornaErro("info inválido.");
		foreach ($info as $chave => $valor) $dados[strtolower(trim($chave))] = trim(filter_var($valor, FILTER_SANITIZE_STRING));
		// se o "dias" for em Array e não em String, recupera de outra forma
		if (isset($info->dias) && strlen($dados["dias"]) == 0) $dados["dias"] = $info->dias;
		//retornaErro(json_encode($dados));
		
		// validações (de campos e de dependências)
		if (isset($dados["email"]) && !validaEmail($dados["email"])) retornaErro("E-mail inválido.");
		if (isset($dados["cpf"]) && !validaCPF($dados["cpf"])) retornaErro("CPF inválido.");
		$temEstagio = (isset($dados["nomeestagio"]) && strlen($dados["nomeestagio"]) > 0);
		$temCurso = (isset($dados["nomecurso"]) && strlen($dados["nomecurso"]) > 0);
		$temTurma = (isset($dados["nometurma"]) && strlen($dados["nometurma"]) > 0);
		//echo "temCurso = $temCurso" . chr(10) . "temEstagio = $temEstagio" . chr(10) . "temTurma = $temTurma" . chr(10);
		// se tiver nome do estágio mas não tiver nome do curso, retorna erro
		if ($temEstagio && !$temCurso) retornaErro("Para definir o estágio o nome do curso precisa ser informado.");
		// se tiver nome da turma mas não tiver nome do curso, retorna erro
		if ($temTurma && !$temCurso) retornaErro("Para definir a turma o nome do curso precisa ser informado.");
		// se for passado um idTurm mas não estiver cadastrada esta turma, retorna erro
		if (isset($dados["idturm"]) && strlen($dados["idturm"]) > 0) {
			$cursEst = $cnx->buscaArrayUnico("SELECT curso.id_curs, estagio.id_est 
				FROM curso INNER JOIN estagio ON estagio.id_curs = curso.id_curs INNER JOIN turma ON turma.id_est = estagio.id_est 
				WHERE curso.id_esc = $idEsc AND turma.id_turm = $dados[idturm]");
			if (!isset($cursEst["id_est"])) retornaErro("O ID de turma informado não está cadastrado.");
		}
		
		// usu
		if (!isset($dados["nome"]) || strlen($dados["nome"]) == 0) retornaErro("Não foi informado o nome do interessado.");
		$idUsuAluno = $cnx->achaproximo("id_usu", "usu");
		$campos = array( "id_usu" => $idUsuAluno, "nome" => destrataTextoAjax($dados["nome"]) );
		if (isset($dados["nasc"])) {
			$nasc = $dados["nasc"];
			if (sizeof(explode("/", $nasc)) == 3) $nasc = str_replace("'", "", dataSQL($nasc));
			if (strlen($nasc) > 0) $campos["nasc"] = $nasc;
		}
		criaSenha($campos);
		$campos["username"] = str_replace("'", "", $campos["username"]);
		$campos["pass"] = str_replace("'", "", $campos["pass"]);
		insere("usu", $campos);
		
		// licenca
		$idlicAluno = $cnx->achaproximo("id_licen", "licenca");
		$campos = array( "id_licen" => $idlicAluno, "id_usu" => $idUsuAluno, "id_esc" => $idEsc, "id_perf" => 11, "cadastradoEm" => "dbo.fnAgora()", "cadastradoPor" => $id_licen );
		if (isset($dados["comoconheceu"]) && strlen($dados["comoconheceu"]) > 0) $campos["id_como"] = $dados["comoconheceu"];
		if (isset($dados["obscadastro"]) && strlen($dados["obscadastro"]) > 0) $campos["obs"] = $dados["obscadastro"];
		$localidade = (isset($dados["localidade"]) && is_numeric($dados["localidade"])) ? intval($dados["localidade"]) : 0;
		insere("licenca", $campos);
		
		// usu_compl
		$campos = array();
		if (isset($dados["nacionalidade"]) && strlen($dados["nacionalidade"]) > 0) $campos["nacionalidade"] = destrataTextoAjax($dados["nacionalidade"]);
		if (isset($dados["estadocivil"]) && strlen($dados["estadocivil"]) > 0 && strpos(",1,2,3,4", $dados["estadocivil"]) != false) $campos["id_estCivil"] = intval($dados["estadocivil"]);
		if (isset($campos["nacionalidade"]) || isset($campos["id_estCivil"])) {
			$campos["id_usu"] = $idUsuAluno;
			insere("usu_compl", $campos);
		}
		
		// usu_fone
		if (isset($dados["fone"]) && strlen($dados["fone"]) > 0) {
			$idFone = $cnx->achaproximo("id_fone", "usu_fone");
			$campos = array( "id_fone" => $idFone, "id_usu" => $idUsuAluno, "id_cont" => 1, "fone" => destrataTextoAjax($dados["fone"]) );
			insere("usu_fone", $campos);
		}
		if (isset($dados["celular"]) && strlen($dados["celular"]) > 0) {
			$idFone = $cnx->achaproximo("id_fone", "usu_fone");
			$campos = array( "id_fone" => $idFone, "id_usu" => $idUsuAluno, "id_cont" => 4, "fone" => destrataTextoAjax($dados["celular"]) );
			insere("usu_fone", $campos);
		}
		
		// usu_email
		if (isset($dados["email"]) && strlen($dados["email"]) > 0) {
			$idEmail = $cnx->achaproximo("id_email", "usu_email");
			$campos = array( "id_email" => $idEmail, "id_usu" => $idUsuAluno, "id_cont" => 59, "email" => destrataTextoAjax($dados["email"]) );
			insere("usu_email", $campos);
		}
		
		// usu_ndocs (RG, CPF e CNH)
		if (isset($dados["rg"]) && strlen($dados["rg"]) > 0) {
			$campos = array( "id_doc" => 2, "id_usu" => $idUsuAluno, "numero" => $dados["rg"] );
			if (isset($dados["orgaoemissor"]) && strlen($dados["orgaoemissor"]) > 0) $campos["orgaoEmissor"] = $dados["orgaoemissor"];
			insere("usu_ndocs", $campos);
		}
		if (isset($dados["cpf"]) && strlen($dados["cpf"]) > 0) {
			$campos = array( "id_doc" => 1, "id_usu" => $idUsuAluno, "numero" => $dados["cpf"] );
			insere("usu_ndocs", $campos);
		}
		if (isset($dados["cnh"]) && strlen($dados["cnh"]) > 0) {
			$campos = array( "id_doc" => 23, "id_usu" => $idUsuAluno, "numero" => $dados["cnh"] );
			if (isset($dados["categcnh"]) && strlen($dados["categcnh"]) > 0) $campos["categ"] = $dados["categcnh"];
			insere("usu_ndocs", $campos);
		}
		
		// endereço
		// estado
		$idEstado = "0";
		if (isset($dados["estado"]) && strlen(trim($dados["estado"])) == 2) {
			$idEstado = $cnx->campobd("0", "SELECT estado.id_est FROM estado WHERE estado.nome = ?", array(trim($dados["estado"])));
		}
		//echo "idEstado = $idEstado" . "<br /><br />" . chr(10) . chr(10);
		
		// cidade
		$idCidade = "0";
		if ($idEstado > "0" && isset($dados["cidade"]) && strlen(destrataTextoAjax($dados["cidade"])) > 0) {
			$parametros = array( $idEsc, $idEstado, destrataTextoAjax($dados["cidade"]) );
			$idCidade = $cnx->campobd("0", "SELECT cidade.id_cid FROM cidade WHERE cidade.id_esc = ? AND cidade.id_est = ? AND cidade.nome LIKE ?", $parametros);
			if ($idCidade == "0") {
				$codIBGE = $cnx->campobd("0", "SELECT cidades_IBGE.id_cidadeIBGE FROM cidades_IBGE 
					WHERE cidades_IBGE.nome LIKE ? AND cidades_IBGE.id_estado = ?", array( destrataTextoAjax($dados["cidade"]), $idEstado ));
				if ($codIBGE == "0") $codIBGE = NULL;
				$idCidade = $cnx->achaproximo("id_cid", "cidade");
				$campos = array( "id_cid" => $idCidade, "id_esc" => $idEsc, "id_est" => $idEstado, "codigoIBGE" => $codIBGE, "nome" => destrataTextoAjax($dados["cidade"]) );
				insere("cidade", $campos);
			}
		}
		//echo "idCidade = $idCidade" . "<br /><br />" . chr(10) . chr(10);
		
		// usu_endereco
		$campos = array();
		if (isset($dados["rua"]) && strlen($dados["rua"]) > 0) $campos["rua"] = destrataTextoAjax($dados["rua"]);
		if (isset($dados["numero"]) && strlen($dados["numero"]) > 0) $campos["num"] = destrataTextoAjax($dados["numero"]);
		if (isset($dados["complemento"]) && strlen($dados["complemento"]) > 0) $campos["compl"] = destrataTextoAjax($dados["complemento"]);
		if (isset($dados["bairro"]) && strlen($dados["bairro"]) > 0) $campos["bairro"] = destrataTextoAjax($dados["bairro"]);
		if (isset($dados["cep"]) && strlen($dados["cep"]) > 0) $campos["cep"] = destrataTextoAjax($dados["cep"]);
		if ($idCidade > "0" || isset($campos["rua"]) || isset($campos["num"]) || isset($campos["compl"]) || isset($campos["bairro"]) || isset($campos["cep"])) {
			if ($idCidade > "0") $campos["id_cid"] = $idCidade;
			$campos["id_usu"] = $idUsuAluno;
			$campos["id_cont"] = 1; // residencial
			$campos["paraDoc"] = 1;
			$campos["id_end"] = $cnx->achaproximo("id_end", "usu_endereco");
			insere("usu_endereco", $campos);
		}

		// responsável financeiro
		$resp = (isset($input->resp)) ? $input->resp : [];
        if (is_string($resp)) $resp = json_decode($resp);
		$resp = (array) $resp;
		$nomeResp = "";
		$emailResp = "";
		// recupera os dados do usuário enviados
		if (is_array($resp) && sizeof($resp) > 0) {
			// recupera os dados do responsável financeiro enviados
			$nomeResp = (isset($resp["nome"])) ? $resp["nome"] : "";
			$nasc =(isset($resp["nasc"])) ? $resp["nasc"] : "";
			$genero = (isset($resp["genero"])) ? $resp["genero"] : "";
			$cpf = (isset($resp["cpf"])) ? $resp["cpf"] : "";
			$rg = (isset($resp["rg"])) ? $resp["rg"] : "";
			$emailResp = (isset($resp["email"])) ? $resp["email"] : "";
			$foneRes = (isset($resp["foneRes"])) ? $resp["foneRes"] : "";
			$foneCel = (isset($resp["foneCel"])) ? $resp["foneCel"] : "";
			$pais = (isset($resp["pais"])) ? $resp["pais"] : "";
			$estado = (isset($resp["estado"])) ? $resp["estado"] : "";
			$cidade = (isset($resp["cidade"])) ? $resp["cidade"] : "";
			$rua = (isset($resp["rua"])) ? $resp["rua"] : "";
			$num = (isset($resp["num"])) ? $resp["num"] : "";
			$compl = (isset($resp["compl"])) ? $resp["compl"] : "";
			$bairro = (isset($resp["bairro"])) ? $resp["bairro"] : "";
			$cep = (isset($resp["cep"])) ? $resp["cep"] : "";
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
				VALUES ((SELECT MAX(usu_resp.id_resp) + 1 FROM usu_resp), ?, ?, ?, ?)", [$idUsuResp, 70, $idUsuAluno, 1], true);
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
		
		// horario ou período, localidade, tipo, dias, idioma e observação
		$horario = (isset($dados["horario"]) && strlen($dados["horario"]) > 0) ? destrataTextoAjax($dados["horario"]) : "";
		$localidade = (isset($dados["localidade"]) && is_numeric($dados["localidade"])) ? intval($dados["localidade"]) : 0;
		$tipo = (isset($dados["tipo"]) && is_numeric($dados["tipo"])) ? intval($dados["tipo"]) : 0;
		$idioma = (isset($dados["idioma"]) && is_numeric($dados["idioma"])) ? intval($dados["idioma"]) : 0;
		$obs = (isset($dados["obs"]) && strlen($dados["obs"]) > 0) ? destrataTextoAjax($dados["obs"]) : "";
		$dias = ""; // dias pode ser enviado como string ("2,3,4") ou como array (["2", "3", "4"] ou [2, 3, 4])
		if (isset($dados["dias"])) {
			$dias = $dados["dias"];
			if (is_array($dias)) $dias = implode(",", $dias);
			$dias = destrataTextoAjax($dias);
		}
		
		// curso, estagio, turma
		if (isset($dados["idturm"]) && strlen($dados["idturm"]) > 0) {
			$idTurm = $dados["idturm"];
			$idEst = $cursEst["id_est"];
			$idCurs = $cursEst["id_curs"];
		} else {
			// só pode ter estágio ou turma se também tiver curso
			$idCurs = "0";
			$idEst = "0";
			$idTurm = "0";
			if (isset($dados["nomecurso"]) && strlen($dados["nomecurso"]) > 0) {
				$idCurs = $cnx->campoBD("0", "SELECT curso.id_curs FROM curso WHERE curso.nome LIKE ? AND curso.id_esc = $idEsc", array(destrataTextoAjax($dados["nomecurso"])));
				if ($idCurs == "0") {
					$idCurs = $cnx->achaproximo("id_curs", "curso");
					$campos = array( "id_curs" => $idCurs, "id_esc" => $idEsc, "nome" => destrataTextoAjax($dados["nomecurso"]) );
					insere("curso", $campos);
					$idEst = $cnx->achaproximo("id_est", "estagio");
					$campos = array( "id_est" => $idEst, "id_curs" => $idCurs, "nome" => "", "criado" => "GETDATE()" );
					insere("estagio", $campos);
				} else {
					$idEst = $cnx->campoBD("0", 
						"SELECT estagio.id_est FROM estagio WHERE LEN(estagio.nome) = 0 AND estagio.id_curs = $idCurs");
				}
			}
			if (isset($dados["nomeestagio"]) && strlen($dados["nomeestagio"]) > 0) {
				$idEst = $cnx->campoBD("0", 
					"SELECT estagio.id_est FROM estagio WHERE estagio.nome LIKE ? AND estagio.id_curs = $idCurs", 
					array(destrataTextoAjax($dados["nomeestagio"])));
				if ($idEst == "0") {
					$idEst = $cnx->achaproximo("id_est", "estagio");
					$campos = array( "id_est" => $idEst, "id_curs" => $idCurs, "nome" => destrataTextoAjax($dados["nomeestagio"]), "criado" => "GETDATE()" );
					insere("estagio", $campos);
				}
			}
			if (isset($dados["nometurma"]) && strlen($dados["nometurma"]) > 0) {
				$idTurm = $cnx->campoBD("0", 
					"SELECT turma.id_turm FROM turma WHERE turma.nome LIKE ? AND turma.id_est = $idEst", 
					array(destrataTextoAjax($dados["nometurma"])));
				if ($idTurm == "0") {
					$idTurm = $cnx->achaproximo("id_turm", "turma");
					$campos = array( "id_turm" => $idTurm, "id_est" => $idEst, "nome" => destrataTextoAjax($dados["nometurma"]) );
					insere("turma", $campos);
				}
			}
		}
		
		// se tiver curso, estágio, turma, horario, localidade, tipo, dias, idioma ou observação, insere um interesse
		if ($idTurm != "0" || $idEst != "0" || $idCurs != "0" || strlen($horario) > 0 || $localidade > 0 || $tipo > 0 || strlen($dias) > 0 || $idioma > 0 || strlen($obs) > 0) {
			$idInteresse = $cnx->achaproximo("id_interesse", "crm_interesse");
			$campos = array( "id_interesse" => $idInteresse, "id_usu" => $idUsuAluno );
			if ($idCurs != "0") $campos["id_curs"] = $idCurs;
			if ($idEst != "0") $campos["id_est"] = $idEst;
			if ($idTurm != "0") $campos["id_turm"] = $idTurm;
			if (strlen($horario) > 0) $campos["horario"] = substr($horario, 0, 50);
			if ($tipo > 0) $campos["id_tipo"] = $tipo;
			if (strlen($dias) > 0) $campos["dias"] = str_replace(" ", "", $dias);
			if ($idioma > 0) $campos["id_idioma"] = $idioma;
			if (strlen($obs) > 0) $campos["obs"] = $obs;
			insere("crm_interesse", $campos);
			if ($localidade > 0) {
				insere("crm_interesse_locais", array( 
					"id_interesse" => $idInteresse,
					"id_local" => $localidade,
					"id_interesseLocal" => "(SELECT MAX(crm_interesse_locais.id_interesseLocal) + 1 FROM crm_interesse_locais)"
				));
			}
		}
		
		return array("sucesso" => "1", "id" => $idUsuAluno);
	}
	
	function comoConheceu() {
		global $cnx, $idEsc;
		$formas = $cnx->buscaAssoc("
			SELECT crm_como.id_como AS id, crm_como.nome AS texto 
			FROM crm_como 
			WHERE crm_como.id_esc = $idEsc 
			ORDER BY crm_como.nome");
		return array("sucesso" => "1", "formas" => $formas);
	}
	
	function localidades() {
		global $cnx, $idEsc;
		$localidades = $cnx->buscaAssoc("
			SELECT crm_interesseLocal.id_local AS id, crm_interesseLocal.nome 
			FROM crm_interesseLocal 
			WHERE crm_interesseLocal.id_esc = $idEsc 
			ORDER BY crm_interesseLocal.nome");
		return array("sucesso" => "1", "localidades" => $localidades);
	}
	
	function tiposInteresse() {
		global $cnx, $idEsc;
		$tipos = $cnx->buscaAssoc("
			SELECT crm_interesseTipo.id_tipo AS id, crm_interesseTipo.nome 
			FROM crm_interesseTipo 
			WHERE crm_interesseTipo.id_esc = $idEsc 
			ORDER BY crm_interesseTipo.nome");
		return array("sucesso" => "1", "tipos" => $tipos);
	}
	
	function idiomasInteresse() {
		global $cnx, $idEsc;
		$idiomas = $cnx->buscaAssoc("
			SELECT idioma.id_idi AS id, idioma.nome 
			FROM curso 
				INNER JOIN idioma ON idioma.id_idi = curso.id_idi 
			WHERE curso.id_esc = $idEsc AND LEN(idioma.nome) > 0 
			GROUP BY idioma.id_idi, idioma.nome 
			ORDER BY idioma.nome");
		return array("sucesso" => "1", "idiomas" => $idiomas);
	}
	
	function cidades() {
		global $cnx, $idEsc, $cidade;
		$cond = "cidade.id_esc = ?";
		$param = [ $idEsc ];
		//echo $cidade . chr(10);
		//echo utf8_decode($cidade) . chr(10);
		//echo utf8_encode($cidade) . chr(10);
		//echo htmlentities($cidade) . chr(10);
		//echo html_entity_decode($cidade) . chr(10);
		//die();

		if (strlen($cidade) > 0) {
			$cond .= " AND cidade.nome COLLATE Latin1_General_CI_AI LIKE ?";
			array_push($param, "%" . utf8_decode($cidade) . "%");
		}
		$cidades = $cnx->buscaAssoc("SELECT cidade.id_cid AS id, cidade.nome, estado.nome AS uf, 
				paises.nome AS pais, cidade.codigoIBGE AS ibge 
			FROM cidade LEFT JOIN estado ON estado.id_est = cidade.id_est LEFT JOIN paises ON paises.id_pais = estado.id_pais 
			WHERE $cond ORDER BY cidade.nome", $param);
		return array("sucesso" => "1", "cidades" => $cidades);
	}
	
	function ibge() {
		global $cnx, $uf, $cidade;
		if (strlen($uf) == 0) retornaErro("Por favor informe o estado para a busca das cidades pelo IBGE.");
		$cond = "estado.nome LIKE ?";
		$param = [ $uf ];
		if (strlen($cidade) > 0) {
			$cond .= " AND cidades_IBGE.nome COLLATE Latin1_General_CI_AI LIKE ?";
			array_push($param, "%" . utf8_decode($cidade) . "%");
		}
		$cidades = $cnx->buscaAssoc("SELECT cidades_IBGE.nome, cidades_IBGE.id_cidadeIBGE AS ibge 
			FROM estado INNER JOIN cidades_IBGE ON cidades_IBGE.id_estado = estado.id_est 
			WHERE $cond ORDER BY cidades_IBGE.nome", $param);
		return array("sucesso" => "1", "cidades" => $cidades);
	}
	
	function novaCidade() {
		global $cnx, $idEsc, $ibge;
		if (strlen($ibge) == 0) retornaErro("Por favor informe código do IBGE da cidade a ser inserida.");
		// se a cidade já estiver cadastrada na escola, não duplica, retorna a já existente
		$jaExiste = $cnx->campoBD("0", "SELECT cidade.id_cid FROM cidade WHERE cidade.id_esc = ? AND cidade.codigoIBGE = ?", 
			[ $idEsc, $ibge ]);
		if (!$jaExiste) executa("INSERT INTO cidade (id_cid, id_esc, nome, id_est, codigoIBGE) 
			SELECT (SELECT MAX(cidade.id_cid) + 1 FROM cidade), ?, cidades_IBGE.nome, cidades_IBGE.id_estado, cidades_IBGE.id_cidadeIBGE 
			FROM cidades_IBGE WHERE cidades_IBGE.id_cidadeIBGE = ?", [ $idEsc, $ibge ]);
		$cidade = $cnx->buscaArrayUnico("SELECT cidade.id_cid AS id, cidade.nome, estado.nome AS uf, 
				paises.nome AS pais, cidade.codigoIBGE AS ibge 
			FROM cidade LEFT JOIN estado ON estado.id_est = cidade.id_est LEFT JOIN paises ON paises.id_pais = estado.id_pais 
			WHERE cidade.id_esc = ? AND cidade.codigoIBGE = ?
			ORDER BY cidade.nome", false, [ $idEsc, $ibge ]);
		$cidade["jaExistia"] = ($jaExiste > "0");
		if (isset($cidade["id"])) {
			$cidade["sucesso"] = "1";
		} else {
			retornaErro("Código IBGE não encontrado.");
		}
		return array($cidade);
	}
	
	
?>
