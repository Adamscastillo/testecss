<?PHP
include '../acessobdphp/cnxabre.php';
include '../funcoes.php';
include_once '../session/funcoes_session.php';
include 'cadAluno.php';
include '../func/classesPHP.php';

header("Content-Type: text/html; charset=UTF-8", true); 
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: no-cache');

//foreach($_SERVER AS $chave => $valor) echo $chave . " = " . $valor . "<br /><br />";
//echo $_SERVER["HTTP_HOST"];
//foreach($_GET AS $chave => $valor) echo $chave . " = " . $valor . "<br /><br />";
$parametros = array_keys($_GET);
$aliasEscola = ($parametros) ? $parametros[0] : '';
$aliasEscola = str_replace('%', '', $aliasEscola);
$escolaValida = ($aliasEscola != '');
if ($aliasEscola == '') {
    $dados = [];
    $escolaValida = false;
} else {
	$idServicoMatOnline = '108';
    $dados = $cnx->buscaArrayUnico("SELECT escola.id_esc, escola.topo, escola.topoEditavel, escola.nome 
		FROM escola INNER JOIN esc_servico ON esc_servico.id_esc = escola.id_esc AND esc_servico.id_servico = $idServicoMatOnline 
			AND esc_servico.inicio <= dbo.fnAgora() 
		WHERE escola.aliasMatOnline LIKE ?", false, [ $aliasEscola ]);
    if (!isset($dados["id_esc"]) || strlen($dados["id_esc"]) == 0) $escolaValida = false;
}
if (!isset($dados["topo"]) || strlen($dados["topo"]) == 0) 
    $dados = $cnx->buscaArrayUnico("SELECT REPLACE(escola.topo, 'img/', '../img/') AS topo, escola.topoEditavel FROM escola WHERE escola.id_esc = 0");
$topo = str_replace("||topoEditavel||", $dados["topoEditavel"], $dados["topo"]);
$topo = str_replace("||acesso||", "&nbsp;", $topo);
$paginaInicial = ($escolaValida) ? intro($dados["nome"]) . pedeCPF() : semEscola();

?>
<!DOCTYPE html>
<html lang="pt-br">
	<head>
		<title>Kaits - Gestão Educacional</title> 
		<meta charset="UTF-8"/>  
  		<meta name="apple-mobile-web-app-capable" content="yes"/>
  		<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
		<meta name="description" content="Sistema de gestão educacional, um controle administrativo e pedagógico sobre tudo o 
    	    que acontece em sua escola, a qualquer hora, de qualquer lugar, sem perder o foco no seu negócio."/>
		<meta name="robots" content="index"/>
		<link rel="stylesheet" href="../func/bootstrap/css/bootstrap.min.css">
		<link rel="stylesheet" type="text/css" href="inicio.css?vs=22090904"/>
		<link rel="stylesheet" href="./inicio.css">
		<link rel="canonical" href="http://kaits.com.br" />
		<link type='text/css' href='../func/css/redmond/jquery-ui-1.10.4.css' rel='stylesheet' />
	</head>
	<body class='inicial'>
		<?= $topo ?>
		<main class='main' id='mainInicial'>
		    <?= $paginaInicial ?>
		</main>
		<footer class='footer'>
			<div class='footer__content center-element' data-wow-duration="1s" data-wow-delay="0.55s">
                <a href="https://kaits.com.br" target="_blank" class="powered">powered by <b>KAITS</b></a>
			</div>
		</footer>
		<script language='javascript' type='text/javascript' src='../func/jquery-1.11.1.min.js'></script>
		<script language='javascript' type='text/javascript' src='../func/jquery.tmpl.min.js'></script>
		<script language='javascript' type='text/javascript' src='../func/jquery-ui-1.10.4.min.js'></script>
		<script language='javascript' type='text/javascript' src='../func/jquery.ui.datepicker-lang.php'></script>
		<script language='javascript' type='text/javascript' src='../funcoes.js'></script>
		<script type='text/javascript' src='cadAluno.js?vs=23030601'></script>
		<script src='../func/bootstrap/js/bootstrap.bundle.min.js'></script>
	</body>
</html>