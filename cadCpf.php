<?PHP
include '../acessobdphp/cnxabre.php';
include '../funcoes.php';

$idEsc = (isset($_POST["idEsc"])) ? $_POST["idEsc"] : '';
$cpf = (isset($_POST["cpf"])) ? $_POST["cpf"] : '';
$idLic = (isset($_GET["idLic"])) ? $_GET["idLic"] : '';
$logado = false;

if (strlen($idEsc) == 0 && strlen($idLic) > 0) {
    // se receber o idLic é que é de um aluno já logado
    $logado = true;
    $aluno = $cnx->buscaArrayUnico("SELECT licenca.id_esc AS [idEsc], dbo.fnFormataCpf(usu_ndocs.numero) AS [cpf] 
        FROM licenca INNER JOIN usu_ndocs ON usu_ndocs.id_usu = licenca.id_usu AND usu_ndocs.id_doc = 1 
        WHERE licenca.id_licen = $idLic");
    $idEsc = $aluno['idEsc'];
    $cpf = $aluno['cpf'];
}

if (strlen($idEsc) == 0) retornaErro('escola não informada');
if (!validaCPF($cpf)) retornaErro('CPF inválido');

echo buscaCPF($cpf);

function retornaErro($msg) {
    header("HTTP/1.1 401 Unauthorized");
    echo $msg;
    die();
}

function buscaCPF($cpf) {
    global $cnx, $idEsc, $logado;
    $cpf = formataCpf($cpf);
    $encontraUsu = "SELECT TOP 1 licenca.id_usu AS idUsu 
        FROM usu_ndocs 
            INNER JOIN licenca ON licenca.id_usu = usu_ndocs.id_usu 
        WHERE dbo.fnFormataCpf(usu_ndocs.numero) = '$cpf' 
            AND usu_ndocs.id_doc = 1 
            AND licenca.id_esc = $idEsc 
            AND licenca.excl IS NULL 
        ORDER BY CASE WHEN licenca.ini IS NOT NULL AND licenca.ini <= dbo.fnHoje() 
                AND licenca.fim IS NOT NULL AND licenca.fim >= dbo.fnHoje() 
            THEN 1 ELSE 0 END DESC, licenca.cadastradoEm";
    $campos = ($logado) ? ", usu_email.email, usu_fone.id_pais AS [ddiFone], usu_fone.ddd AS [dddFone], usu_fone.fone, 
        foneCel.id_pais AS [ddiCel], foneCel.ddd AS [dddCel], foneCel.fone AS [cel], foneCel.id_pais AS [paisCel],
        usu_endereco.rua, usu_endereco.num, usu_endereco.compl, usu_endereco.bairro, usu_endereco.cep, 
        estado.id_pais AS [pais], cidade.id_est AS [est], usu_endereco.id_cid AS [cid]" : '';
    $sql = "SELECT usu.id_usu AS [id], usu.nome $campos 
        FROM usu 
            LEFT JOIN usu_email ON usu_email.id_email = (SELECT TOP 1 usu_email.id_email 
                FROM usu_email WHERE usu_email.id_usu = usu.id_usu ORDER BY usu_email.id_cont) 
            LEFT JOIN usu_fone ON usu_fone.id_fone = (SELECT TOP 1 usu_fone.id_fone 
                FROM usu_fone WHERE usu_fone.id_usu = usu.id_usu ORDER BY usu_fone.id_cont) 
            LEFT JOIN usu_fone AS foneCel ON foneCel.id_usu = usu.id_usu AND foneCel.id_cont = 4 
            LEFT JOIN usu_endereco ON usu_endereco.id_end = (SELECT TOP 1 usu_endereco.id_end 
                FROM usu_endereco WHERE usu_endereco.id_usu = usu.id_usu ORDER BY usu_endereco.id_cont) 
            LEFT JOIN cidade ON cidade.id_cid = usu_endereco.id_cid
            LEFT JOIN estado ON estado.id_est = cidade.id_est 
        WHERE usu.id_usu = ($encontraUsu)";
    //return $sql;
    $usu = $cnx->buscaArrayUnico($sql);
    
    $alunoNovo = (!isset($usu["id"]) || $usu["id"] <= "0") ;
    if ($alunoNovo) $usu = [ 'erro' => 'aluno não encontrado', 'id' => 'novo_aluno' ];

    if ($alunoNovo || $logado) {
        $ddi = $cnx->buscaDiretoOrd("SELECT paises.id_pais, CAST(paises.ddi AS nvarchar) + ' - ' + dbo.fnLang(3, paises.nomeLang, paises.nome) 
            FROM paises 
            WHERE paises.ddi IS NOT NULL
            ORDER BY dbo.fnLang(3, paises.nomeLang, paises.nome)");
        foreach ($ddi as $idPais => &$nomePais) if ($idPais != "ord") {
            $tam = strlen(explode(" - ", $nomePais)[0]);
            $nomePais = implode("", array_fill(0, 4 - $tam, "&nbsp;")) . $nomePais;
        }
        $usu['ddiPais'] = $ddi;
        
        $paises = $cnx->buscaAssoc ("SELECT paises.id_pais AS id, COALESCE(paisNome.texto, paisNomePort.texto, paises.nome) AS nome, 
                (SELECT estado.id_est AS id, estado.nome, 
                    (SELECT cidade.id_cid AS id, cidade.nome FROM cidade WHERE cidade.id_esc = $idEsc AND cidade.id_est = estado.id_est 
                        ORDER BY cidade.nome FOR JSON PATH) AS listaFilho 
                FROM estado 
                    INNER JOIN cidade ON cidade.id_est = estado.id_est AND cidade.id_esc = $idEsc 
                WHERE estado.id_pais = paises.id_pais GROUP BY estado.id_est, estado.nome ORDER BY estado.nome FOR JSON PATH) AS listaFilho 
            FROM paises 
                INNER JOIN estado ON estado.id_pais = paises.id_pais 
                INNER JOIN cidade ON cidade.id_est = estado.id_est AND cidade.id_esc = $idEsc 
                LEFT JOIN lang_trad AS paisNome ON paisNome.id_lang = paises.nomeLang AND paisNome.id_idi = 3 
                LEFT JOIN lang_trad AS paisNomePort ON paisNomePort.id_lang = paises.nomeLang AND paisNomePort.id_idi = 3 
            GROUP BY paises.id_pais, COALESCE(paisNome.texto, paisNomePort.texto, paises.nome) 
            ORDER BY COALESCE(paisNome.texto, paisNomePort.texto, paises.nome)");
        foreach ($paises as &$pais) $pais["listaFilho"] = json_decode($pais["listaFilho"]);
        $usu['paises'] = $paises;

        $setup = $cnx->buscaArrayUnico("SELECT ISNULL(escola.perfilPadraoAluno, 1) AS perfilPadrao FROM escola WHERE escola.id_esc = $idEsc");
        $usu['setup'] = $setup;
        $usu["idLicen"] = 3961952; // usuário do sistema KAITS para os processos de matrícula online
    }

    if ($logado) $usu['origem'] = 'matriculaonline';

    return json_encode($usu);
}




?>

