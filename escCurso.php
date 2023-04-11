<?PHP
$_GET['idPagina'] = '40'; // página de alunos
include '../func/grava_funcoes.php';
include '../func/grava_matric.php';

// retorna o id_licenca de quem está logado
// deve ser ou o aluno ou o usuário criado para matrículaOnline
$idLicen = session_testa();
$idEsc = (isset($_POST["idEsc"])) ? $_POST["idEsc"] : '';
$acao = (isset($_POST["acao"])) ? $_POST["acao"] : '';
$idTurm = (isset($_POST["idTurm"])) ? $_POST["idTurm"] : '';
$idUsu = (isset($_POST["idUsu"])) ? $_POST["idUsu"] : '';
$idTaxa = (isset($_POST["idTaxa"])) ? $_POST["idTaxa"] : '';

if ($acao == "turmas") echo buscaCursos();
else if ($acao == "valores") echo buscaValores();
else if ($acao == "matric") echo gravaMatricula();
else echo "";

function retornaErro($msg) {
    header("HTTP/1.1 401 Unauthorized");
    echo $msg;
    die();
}

function buscaCursos() {
	global $cnx, $idEsc;
	if (strlen($idEsc) == 0) retornaErro('escola não informada');
	$cursos = $cnx->buscaAssoc("SELECT curso.id_curs AS [idCurs], estagio.id_est AS [idEst], turma.id_turm AS [idTurm], curso.nome AS [curso], 
		estCurso.obj AS [objCurso], estagio.nome AS [estagio], estagio.obj AS [objEstagio], turma.nome AS [turma], 
		turma.obs AS [obsTurma], CONVERT(nvarchar, turma.inicio, 103) AS [ini], CONVERT(nvarchar, turma.termino, 103) AS [fim], 
		(SELECT dbo.fnLang(3, 56 + turma_horarios.id_dia, CAST(turma_horarios.id_dia AS nvarchar)) AS dia, 
			LEFT(CONVERT(nvarchar, turma_horarios.inicio, 108), 5) AS ini, 
			LEFT(CONVERT(nvarchar, DATEADD(mi, turma_horarios.tempo, turma_horarios.inicio), 108), 5) AS fim 
			FROM turma_horarios 
			WHERE turma_horarios.id_turm = turma.id_turm 
			ORDER BY turma_horarios.id_dia, turma_horarios.inicio FOR JSON PATH) AS [horarios] 
	FROM curso 
		INNER JOIN estagio ON estagio.id_curs = curso.id_curs 
		INNER JOIN estagio AS estCurso ON estCurso.id_curs = curso.id_curs AND LEN(estCurso.nome) = 0 
		INNER JOIN turma ON turma.id_est = estagio.id_est 
	WHERE curso.id_esc = $idEsc AND LEN(turma.nome) > 0 
		AND turma.divulgaAPI = 1 AND turma.indefinida IS NULL 
		AND turma.inativo = 0 
		AND (turma.inicio IS NULL OR turma.inicio <= dbo.fnHoje()) 
		AND (turma.termino IS NULL OR turma.termino >= dbo.fnHoje()) 
	ORDER BY curso.nome, estagio.nome, turma.nome");
		//SELECT * FROM turma_horarios
		//SELECT * FROM turma_periodos
		//SELECT * FROM padraoValor WHERE id_turm IS NOT NULL
	foreach ($cursos as &$curso) $curso["horarios"] = json_decode($curso["horarios"]);	

	echo json_encode($cursos);

	/* $buscaHorario = $cnx->buscaAssoc(trataExportacao("SELECT turma_horarios.id_turmaHorario AS id, turma_horarios.id_modulo AS disciplina, disciplina.cor AS corDisciplina, 
				turma_horarios.id_dia AS diaSemana, 
				LEFT(CONVERT(nvarchar, turma_horarios.inicio, 108), 5) AS horario, 
				turma_horarios.tempo 
			FROM turma_horarios 
				LEFT JOIN disciplina_modulo ON disciplina_modulo.id_modulo = turma_horarios.id_modulo 
				LEFT JOIN disciplina ON disciplina.id_disciplina = disciplina_modulo.id_disciplina 
			WHERE turma_horarios.id_turm = [idTurma]
			ORDER BY turma_horarios.id_dia, turma_horarios.inicio",
			array('id', 'id_turmaHorario', 'dia', 'periodo', 'inicio', 'tempo'),
			array() */
}

function buscaValores() {
	global $cnx, $idTurm;
	if (strlen($idTurm) == 0) retornaErro('turma não informada');
	$valores =  $cnx->buscaAssoc("SELECT padraoValor.id_padrao AS id, padraoValor.id_cat AS [idCat], 
			padraoValor.nome, dbo.fnFormataValor(padraoValor.valor) AS valor, padraoValor.vezes, 
			pagto_cat.nome AS [tipo] 
		FROM padraoValor 
			INNER JOIN pagto_cat ON pagto_cat.id_cat = padraoValor.id_cat 
		WHERE ISNULL(padraoValor.divulgaAPI, 0) = 1 AND padraoValor.id_turm = $idTurm 
		ORDER BY padraoValor.id_cat, padraoValor.id_padrao");
	//atrasoServidor(10000000);
	echo json_encode([ "idTurm" => $idTurm, "valores" => $valores ]);
	//echo $valores;
}

?>


